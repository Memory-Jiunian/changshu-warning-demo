import type {
  AbnormalReport,
  AbnormalReportInput,
  Draft,
  ObservationInput,
  ObservationRecord,
  SupervisionInput,
  SupervisionRecord,
} from '../domain/feedback';
import { err, ok, type Result } from '../domain/result';
import type { CollaborationTask, RetestReminderMethod, RetestSchedule } from '../domain/tasks';
import type { DemoUser, UserRole } from '../domain/users';
import {
  canUserAddSupervision,
  canUserConfirmRetestReminder,
  canUserSubmitObservation,
  canUserViewTask,
} from '../selectors/permissionSelectors';
import { sortTasksForAction } from '../selectors/taskSelectors';
import { mockObservationRecords, mockRetestSchedules, mockSupervisionRecords } from './mockFeedback';
import { DEMO_NOW_ISO, mockTasks } from './mockTasks';
import { defaultUserIdByRole, mockUsers } from './mockUsers';

export interface DemoSnapshot {
  currentUser: DemoUser;
  users: DemoUser[];
  tasks: CollaborationTask[];
  observations: ObservationRecord[];
  abnormalReports: AbnormalReport[];
  retestSchedules: RetestSchedule[];
  supervisionRecords: SupervisionRecord[];
  drafts: Draft[];
  now: string;
}

export interface DemoRepositoryOptions {
  now?: string;
  delayMs?: number;
  initialRole?: UserRole;
  failReads?: boolean;
  storage?: Storage;
}

interface WriteFailure {
  code: string;
  message: string;
}

interface PersistedRepositoryState {
  version: 1;
  tasks: CollaborationTask[];
  observations: ObservationRecord[];
  abnormalReports: AbnormalReport[];
  retestSchedules: RetestSchedule[];
  supervisionRecords: SupervisionRecord[];
  requestIds: string[];
}

const REPOSITORY_STORAGE_KEY = 'changshu-demo:repository:v1';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class DemoRepository {
  private users = clone(mockUsers);
  private tasks = clone(mockTasks);
  private observations = clone(mockObservationRecords);
  private abnormalReports: AbnormalReport[] = [];
  private retestSchedules = clone(mockRetestSchedules);
  private supervisionRecords = clone(mockSupervisionRecords);
  private drafts: Draft[] = [];
  private currentUserId: string;
  private readonly requestIds = new Set<string>();
  private readonly nowIso: string;
  private readonly delayMs: number;
  private readonly failReads: boolean;
  private readonly storage?: Storage;
  private nextWriteFailure: WriteFailure | null = null;
  private idSequence = 0;

  constructor(options: DemoRepositoryOptions = {}) {
    const initialRole = options.initialRole ?? 'head_teacher';
    this.currentUserId = defaultUserIdByRole[initialRole];
    this.nowIso = options.now ?? DEMO_NOW_ISO;
    this.delayMs = options.delayMs ?? 360;
    this.failReads = options.failReads ?? false;
    this.storage = options.storage;
    this.restore();
  }

  getNow() {
    return new Date(this.nowIso);
  }

  getCurrentUser() {
    return clone(this.requireCurrentUser());
  }

  switchDemoRole(role: UserRole): Result<DemoUser> {
    const userId = defaultUserIdByRole[role];
    const user = this.users.find((item) => item.id === userId);
    if (!user) return err('ROLE_NOT_AVAILABLE', '当前演示角色不可用');
    this.currentUserId = user.id;
    return ok(clone(user));
  }

  getVisibleTasks(user = this.requireCurrentUser()) {
    const now = this.getNow();
    const visible = this.tasks.filter((task) => canUserViewTask(user, task, now));
    return clone(sortTasksForAction(visible, now));
  }

  getTaskById(taskId: string, user = this.requireCurrentUser()): Result<CollaborationTask> {
    const task = this.tasks.find((item) => item.id === taskId);
    if (!task) return err('TASK_NOT_FOUND', '任务不存在或已被移除');
    if (!canUserViewTask(user, task, this.getNow())) {
      return err('TASK_FORBIDDEN', '你没有权限查看该任务');
    }
    return ok(clone(task));
  }

  getViewSnapshot(): Result<DemoSnapshot> {
    if (this.failReads) return err('DEMO_LOAD_FAILED', '演示数据加载失败，请稍后重试');

    const currentUser = this.requireCurrentUser();
    const tasks = this.getVisibleTasks(currentUser);
    const visibleTaskIds = new Set(tasks.map((task) => task.id));
    const observations =
      currentUser.role === 'grade_director'
        ? []
        : this.observations.filter(
            (record) =>
              visibleTaskIds.has(record.taskId) &&
              (currentUser.role === 'psychologist' || record.authorId === currentUser.id),
          );
    const abnormalReports =
      currentUser.role === 'grade_director'
        ? []
        : this.abnormalReports.filter(
            (report) => currentUser.role === 'psychologist' || report.reporterId === currentUser.id,
          );
    const supervisionRecords =
      currentUser.role === 'head_teacher'
        ? []
        : this.supervisionRecords.filter(
            (record) =>
              visibleTaskIds.has(record.taskId) &&
              (currentUser.role === 'psychologist' || record.supervisorId === currentUser.id),
          );

    return ok(
      clone({
        currentUser,
        users: this.users,
        tasks,
        observations,
        abnormalReports,
        retestSchedules: this.retestSchedules.filter((schedule) => visibleTaskIds.has(schedule.taskId)),
        supervisionRecords,
        drafts: this.drafts.filter((draft) => draft.userId === currentUser.id),
        now: this.nowIso,
      }),
    );
  }

  async markTaskRead(taskId: string): Promise<Result<CollaborationTask>> {
    await this.wait();
    const access = this.getTaskById(taskId);
    if (!access.ok) return access;
    const task = this.requireTask(taskId);
    if (!task.readAt) task.readAt = this.nowIso;
    this.persist();
    return ok(clone(task));
  }

  async submitObservation(taskId: string, input: ObservationInput): Promise<Result<ObservationRecord>> {
    return this.submitObservationInternal(taskId, input, false);
  }

  async submitObservationRevision(taskId: string, input: ObservationInput): Promise<Result<ObservationRecord>> {
    return this.submitObservationInternal(taskId, input, true);
  }

  async submitAbnormalReport(input: AbnormalReportInput): Promise<Result<AbnormalReport>> {
    await this.wait();
    const user = this.requireCurrentUser();
    if (user.role !== 'head_teacher') return err('ROLE_FORBIDDEN', '只有班主任可以主动上报异常事实');
    const student = this.tasks.map((task) => task.student).find((item) => item.id === input.studentId);
    if (!student || !user.classIds?.includes(student.classId)) {
      return err('STUDENT_FORBIDDEN', '只能上报当前班级中的学生');
    }
    const validation = this.validateFactsInput(input);
    if ('code' in validation) return err(validation.code, validation.message);
    const request = this.beginRequest(input.requestId);
    if ('code' in request) return err(request.code, request.message);

    const report: AbnormalReport = {
      id: this.nextId('report'),
      studentId: input.studentId,
      reporterId: user.id,
      observedAt: input.observedAt,
      scene: input.scene,
      facts: input.facts,
      supportActions: input.supportActions,
      immediateSafetyConcern: input.immediateSafetyConcern,
      status: 'submitted',
      submittedAt: this.nowIso,
    };
    this.abnormalReports.push(report);
    this.persist();
    return ok(clone(report));
  }

  async confirmRetestReminder(
    taskId: string,
    method: RetestReminderMethod,
  ): Promise<Result<RetestSchedule>> {
    await this.wait();
    const user = this.requireCurrentUser();
    const access = this.getTaskById(taskId, user);
    if ('code' in access) return err(access.code, access.message);
    const task = this.requireTask(taskId);
    if (!canUserConfirmRetestReminder(user, task)) {
      return err('RETEST_CONFIRM_FORBIDDEN', '当前任务不能由该用户确认提醒');
    }
    const schedule = this.retestSchedules.find((item) => item.taskId === taskId);
    if (!schedule) return err('RETEST_SCHEDULE_NOT_FOUND', '未找到关联复测安排');
    if (schedule.reminderConfirmedAt) return err('RETEST_ALREADY_CONFIRMED', '该复测提醒已确认');

    schedule.reminderConfirmedAt = this.nowIso;
    schedule.reminderMethod = method;
    task.status = 'completed';
    task.completedAt = this.nowIso;
    this.persist();
    return ok(clone(schedule));
  }

  async addSupervisionRecord(
    taskId: string,
    input: SupervisionInput,
  ): Promise<Result<SupervisionRecord>> {
    await this.wait();
    const user = this.requireCurrentUser();
    const access = this.getTaskById(taskId, user);
    if ('code' in access) return err(access.code, access.message);
    const task = this.requireTask(taskId);
    if (!canUserAddSupervision(user, task, this.getNow())) {
      return err('SUPERVISION_FORBIDDEN', '当前用户不能督办该任务');
    }
    if (!input.summary.trim()) return err('VALIDATION_ERROR', '请填写督办结果');
    const request = this.beginRequest(input.requestId);
    if ('code' in request) return err(request.code, request.message);

    const record: SupervisionRecord = {
      id: this.nextId('supervision'),
      taskId,
      supervisorId: user.id,
      method: input.method,
      summary: input.summary.trim(),
      createdAt: this.nowIso,
    };
    this.supervisionRecords.push(record);
    this.persist();
    return ok(clone(record));
  }

  simulateNextWriteFailure(code = 'DEMO_WRITE_FAILED', message = '模拟提交失败，请重试') {
    this.nextWriteFailure = { code, message };
  }

  private async submitObservationInternal(
    taskId: string,
    input: ObservationInput,
    revision: boolean,
  ): Promise<Result<ObservationRecord>> {
    await this.wait();
    const user = this.requireCurrentUser();
    const access = this.getTaskById(taskId, user);
    if ('code' in access) return err(access.code, access.message);
    const task = this.requireTask(taskId);
    if (this.requestIds.has(input.requestId)) {
      return err('DUPLICATE_REQUEST', '该提交已处理，请勿重复提交');
    }

    if (!canUserSubmitObservation(user, task)) {
      return err('OBSERVATION_FORBIDDEN', '当前任务不能提交观察反馈');
    }
    if (revision && task.status !== 'returned') {
      return err('REVISION_NOT_REQUIRED', '当前任务不需要补充反馈');
    }
    if (!revision && task.status !== 'pending') {
      return err('TASK_NOT_PENDING', '当前任务不是待反馈状态');
    }
    const validation = this.validateFactsInput(input);
    if ('code' in validation) return err(validation.code, validation.message);
    if (new Date(input.observedAt).getTime() > this.getNow().getTime()) {
      return err('OBSERVED_AT_IN_FUTURE', '观察时间不能晚于当前时间');
    }
    const request = this.beginRequest(input.requestId);
    if ('code' in request) return err(request.code, request.message);

    const previous = revision
      ? [...this.observations].reverse().find((record) => record.taskId === taskId)
      : undefined;
    const record: ObservationRecord = {
      id: this.nextId(revision ? 'revision' : 'observation'),
      taskId,
      authorId: user.id,
      authorRole: 'head_teacher',
      observedAt: input.observedAt,
      scene: input.scene.trim(),
      facts: input.facts.trim(),
      frequency: input.frequency,
      duration: input.duration,
      impact: input.impact,
      supportActions: input.supportActions ? [...input.supportActions] : undefined,
      immediateSafetyConcern: input.immediateSafetyConcern,
      requestExpeditedReview: input.requestExpeditedReview,
      additionalNotes: input.additionalNotes?.trim() || undefined,
      submittedAt: this.nowIso,
      revisionOfRecordId: previous?.id,
    };
    this.observations.push(record);
    task.status = 'submitted';
    this.persist();
    return ok(clone(record));
  }

  private validateFactsInput(input: Pick<ObservationInput, 'requestId' | 'observedAt' | 'scene' | 'facts'>) {
    if (!input.requestId.trim()) return err('REQUEST_ID_REQUIRED', '缺少提交请求编号');
    if (!input.observedAt.trim()) return err('OBSERVED_AT_REQUIRED', '请填写观察时间');
    if (!input.scene.trim()) return err('SCENE_REQUIRED', '请选择观察场景');
    const length = input.facts.trim().length;
    if (length < 20 || length > 500) return err('FACTS_LENGTH_INVALID', '事实观察需为 20–500 字');
    return ok(true);
  }

  private beginRequest(requestId: string): Result<true> {
    if (this.requestIds.has(requestId)) return err('DUPLICATE_REQUEST', '该提交已处理，请勿重复提交');
    if (this.nextWriteFailure) {
      const failure = this.nextWriteFailure;
      this.nextWriteFailure = null;
      return err(failure.code, failure.message);
    }
    this.requestIds.add(requestId);
    return ok(true);
  }

  private requireCurrentUser() {
    const user = this.users.find((item) => item.id === this.currentUserId);
    if (!user) throw new Error('Demo repository current user is missing');
    return user;
  }

  private requireTask(taskId: string) {
    const task = this.tasks.find((item) => item.id === taskId);
    if (!task) throw new Error(`Demo repository task is missing: ${taskId}`);
    return task;
  }

  private nextId(prefix: string) {
    this.idSequence += 1;
    return `${prefix}-${new Date(this.nowIso).getTime()}-${this.idSequence}`;
  }

  private wait() {
    if (this.delayMs <= 0) return Promise.resolve();
    return new Promise<void>((resolve) => globalThis.setTimeout(resolve, this.delayMs));
  }

  private restore() {
    if (!this.storage) return;
    const raw = this.storage.getItem(REPOSITORY_STORAGE_KEY);
    if (!raw) return;

    try {
      const state = JSON.parse(raw) as Partial<PersistedRepositoryState>;
      if (
        state.version !== 1 ||
        !Array.isArray(state.tasks) ||
        !Array.isArray(state.observations) ||
        !Array.isArray(state.abnormalReports) ||
        !Array.isArray(state.retestSchedules) ||
        !Array.isArray(state.supervisionRecords) ||
        !Array.isArray(state.requestIds)
      ) {
        this.storage.removeItem(REPOSITORY_STORAGE_KEY);
        return;
      }
      this.tasks = clone(state.tasks);
      this.observations = clone(state.observations);
      this.abnormalReports = clone(state.abnormalReports);
      this.retestSchedules = clone(state.retestSchedules);
      this.supervisionRecords = clone(state.supervisionRecords);
      state.requestIds.forEach((requestId) => this.requestIds.add(requestId));
    } catch {
      this.storage.removeItem(REPOSITORY_STORAGE_KEY);
    }
  }

  private persist() {
    if (!this.storage) return;
    const state: PersistedRepositoryState = {
      version: 1,
      tasks: this.tasks,
      observations: this.observations,
      abnormalReports: this.abnormalReports,
      retestSchedules: this.retestSchedules,
      supervisionRecords: this.supervisionRecords,
      requestIds: [...this.requestIds],
    };
    this.storage.setItem(REPOSITORY_STORAGE_KEY, JSON.stringify(state));
  }
}

export function createDemoRepository(options?: DemoRepositoryOptions) {
  return new DemoRepository(options);
}
