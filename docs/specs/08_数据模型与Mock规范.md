# 08 数据模型与 Mock 规范

## 1. 统一数据结构

建议在 `src/domain/` 或 `src/types/` 建立稳定类型，在 `src/data/` 或 Provider 中维护共享真值。

```ts
type UserRole = "head_teacher" | "grade_director" | "psychologist";

interface DemoUser {
  id: string;
  name: string;
  role: UserRole;
  classIds?: string[];
  managedGradeIds?: string[];
}

interface StudentRef {
  id: string;
  name: string;
  gradeName: string;
  className: string;
}

interface CollaborationTask {
  id: string;
  warningId: string;
  student: StudentRef;
  type: CollaborationTaskType;
  status: TaskStatus;
  assigneeId: string;
  supervisorId?: string;
  title: string;
  purpose: string;
  observationFocus?: string[];
  precautions?: string[];
  createdAt: string;
  dueAt?: string;
  readAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  urgency: "normal" | "important" | "urgent";
  warningStatusSnapshot?: WarningStatus;
}
```

---

## 2. Mock 最少场景

必须准备至少以下数据：

1. 班主任待反馈任务；
2. 今天到期任务；
3. 已超时任务；
4. 已提交等待查看；
5. 被退回待补充；
6. 已完成任务；
7. 已取消任务；
8. 今日复测提醒；
9. 已确认提醒的复测任务；
10. 年级主任待督办事项；
11. 无权限任务；
12. 数据加载失败场景。

---

## 3. Mock 数据一致性

每条任务必须满足：

- `assigneeId` 对应真实 Demo 用户；
- `student.className` 在班主任管理范围内；
- 任务状态与反馈记录一致；
- `submitted` 至少有一条反馈；
- `returned` 有退回原因和旧反馈；
- `completed` 有完成时间；
- `cancelled` 有取消原因；
- `retest_reminder` 有复测安排；
- `grade_supervision` 有被督办原任务；
- 当前时间与 `dueAt` 能正确派生超时。

---

## 4. 数据操作 API

即使当前是前端 mock，也应通过函数操作，避免页面直接改数组。

```ts
readTask(taskId)
submitObservation(taskId, input)
submitObservationRevision(taskId, input)
submitAbnormalReport(input)
confirmRetestReminder(taskId, method)
addSupervisionRecord(taskId, input)
markTaskRead(taskId)
switchDemoRole(role)
```

每个函数返回：

```ts
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };
```

---

## 5. 防重复提交

- 每次提交生成客户端 `requestId`；
- 同一 `requestId` 只写入一次；
- 按钮提交中禁用；
- 失败后重试复用同一草稿但生成明确的重试请求；
- Mock 层也应模拟 300–600ms 延迟。

---

## 6. 草稿

```ts
interface Draft {
  key: string; // taskId 或 abnormal-report
  userId: string;
  content: unknown;
  updatedAt: string;
}
```

- 草稿仅属于当前用户；
- 提交成功后删除；
- 任务取消后不自动删除，允许用户复制事实记录；
- Demo 可使用 localStorage，但要有版本号和迁移兜底。

---

## 7. 推荐目录

```text
src/
├─ components/
│  ├─ ui/
│  ├─ business/
│  └─ layout/
├─ domain/
│  ├─ users.ts
│  ├─ tasks.ts
│  ├─ feedback.ts
│  └─ events.ts
├─ data/
│  ├─ mockUsers.ts
│  ├─ mockTasks.ts
│  ├─ mockFeedback.ts
│  └─ demoRepository.ts
├─ pages/
│  ├─ teacher/
│  ├─ director/
│  └─ shared/
├─ state/
│  └─ DemoProvider.tsx
└─ styles/
   ├─ tokens.css
   ├─ components.css
   └─ pages.css
```

如果当前项目仍集中在 `App.tsx`，先逐步提取，不得一次性重构全部代码。
