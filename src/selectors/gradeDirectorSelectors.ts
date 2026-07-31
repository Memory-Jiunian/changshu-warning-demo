import type { SupervisionRecord } from '../domain/feedback';
import type { TeacherActionItem } from '../domain/teacherActions';
import type { DemoUser } from '../domain/users';

export interface GradeDirectorSupervisionItem extends TeacherActionItem {
  responsibleTeacher: DemoUser;
  latestRecord?: SupervisionRecord;
}

export function getGradeDirectorSupervisionItems({
  director,
  actions,
  users,
  records,
}: {
  director: DemoUser;
  actions: TeacherActionItem[];
  users: DemoUser[];
  records: SupervisionRecord[];
}) {
  if (director.role !== 'grade_director') return [];
  const gradeIds = new Set(director.managedGradeIds ?? []);

  return actions
    .filter((action) => gradeIds.has(action.student.gradeId))
    .flatMap((action): GradeDirectorSupervisionItem[] => {
      const teacher = users.find((user) => user.id === action.assigneeId);
      if (!teacher || teacher.role !== 'head_teacher') return [];
      const latestRecord = records
        .filter((record) => record.sourceActionId === action.id)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
      return [{ ...action, responsibleTeacher: teacher, latestRecord }];
    })
    .sort((left, right) => {
      if (left.status !== right.status) return left.status === 'overdue' ? -1 : 1;
      return left.actionAt.localeCompare(right.actionAt) ||
        left.createdAt.localeCompare(right.createdAt) ||
        left.id.localeCompare(right.id);
    });
}
