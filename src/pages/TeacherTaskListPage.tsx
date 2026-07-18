import { useEffect } from 'react';
import { TeacherTaskCard } from '../components/business/TeacherTaskCard';
import { EmptyState } from '../components/ui/EmptyState';
import type { CollaborationTask } from '../domain/tasks';
import {
  filterTeacherTasksForView,
  normalizeTeacherTaskView,
  normalizeTeacherTaskViewFilter,
  teacherTaskFilterLabels,
  type TeacherTaskView,
  type TeacherTaskViewFilter,
} from '../selectors/taskSelectors';

const actionFilters: TeacherTaskViewFilter[] = [
  'action',
  'pending',
  'returned',
  'overdue',
  'retest',
];

const historyFilters: TeacherTaskViewFilter[] = [
  'history',
  'submitted',
  'completed',
];

const filterLabels: Record<TeacherTaskViewFilter, string> = {
  action: '全部',
  history: '全部',
  pending: teacherTaskFilterLabels.pending,
  returned: teacherTaskFilterLabels.returned,
  overdue: '超时',
  retest: '复测',
  submitted: teacherTaskFilterLabels.submitted,
  completed: teacherTaskFilterLabels.completed,
};

const emptyCopy: Record<TeacherTaskViewFilter, { title: string; description: string }> = {
  action: { title: '当前没有待处理任务', description: '新的协作任务会在分发后显示在这里。' },
  history: { title: '暂时没有历史记录', description: '已提交、已完成或已取消的任务会保留在这里。' },
  pending: { title: '当前没有需要填写观察反馈的任务', description: '可以查看其他筛选中的历史任务。' },
  overdue: { title: '当前没有已超时任务', description: '可以查看其他筛选中的协作任务。' },
  returned: { title: '当前没有被退回等待补充的任务', description: '需要补充时，原反馈仍会保留。' },
  retest: { title: '当前没有复测提醒', description: '复测安排由管理终端创建后同步到这里。' },
  submitted: { title: '暂时没有已提交的协作任务', description: '提交成功的观察反馈会显示在这里。' },
  completed: { title: '暂时没有已完成的协作任务', description: '已结束任务只保留只读记录。' },
};

function scrollKey(userId: string, view: TeacherTaskView, filter: TeacherTaskViewFilter) {
  return `changshu-demo:teacher-task-scroll:${userId}:${view}:${filter}`;
}

export function TeacherTaskListPage({
  userId,
  tasks,
  now,
  filter: rawFilter,
  view: rawView,
  loading,
  onView,
  onFilter,
  onOpen,
}: {
  userId: string;
  tasks: CollaborationTask[];
  now: string;
  filter?: string;
  view?: string;
  loading: boolean;
  onView: (view: TeacherTaskView) => void;
  onFilter: (view: TeacherTaskView, filter: TeacherTaskViewFilter) => void;
  onOpen: (task: CollaborationTask) => void;
}) {
  const view = normalizeTeacherTaskView(rawView);
  const filter = normalizeTeacherTaskViewFilter(view, rawFilter);
  const filters = view === 'history' ? historyFilters : actionFilters;
  const filteredTasks = filterTeacherTasksForView(tasks, view, filter, new Date(now));

  useEffect(() => {
    const saved = Number(window.sessionStorage.getItem(scrollKey(userId, view, filter)) ?? 0);
    const frame = window.requestAnimationFrame(() => window.scrollTo({ top: saved }));
    return () => window.cancelAnimationFrame(frame);
  }, [filter, userId, view]);

  const openTask = (task: CollaborationTask) => {
    window.sessionStorage.setItem(scrollKey(userId, view, filter), String(window.scrollY));
    window.sessionStorage.setItem('changshu-demo:teacher-task-last-view', view);
    window.sessionStorage.setItem('changshu-demo:teacher-task-last-filter', filter);
    onOpen(task);
  };

  return (
    <div className="mvp-page mvp-v2-page mvp-v2-task-list-page" aria-busy={loading}>
      <header className="mvp-v2-primary-header">
        <h1>我的任务</h1>
      </header>

      <nav className="mvp-v2-view-switch" aria-label="任务记录类型">
        {(['action', 'history'] as TeacherTaskView[]).map((item) => (
          <button
            key={item}
            type="button"
            className={view === item ? 'is-active' : ''}
            aria-current={view === item ? 'page' : undefined}
            onClick={() => onView(item)}
          >
            {item === 'action' ? '待处理' : '历史记录'}
          </button>
        ))}
      </nav>

      <nav className="mvp-v2-filter-chips" aria-label="任务筛选">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            className={filter === item ? 'is-active' : ''}
            aria-current={filter === item ? 'page' : undefined}
            onClick={() => onFilter(view, item)}
          >
            <span>{filterLabels[item]}</span>
          </button>
        ))}
      </nav>

      <section className="mvp-task-results" aria-label={`${filterLabels[filter]}任务`}>
        <p className="mvp-list-summary" aria-live="polite">
          {filteredTasks.length} 项结果
        </p>
        {loading && filteredTasks.length === 0 ? (
          <div className="mvp-loading-state" role="status">正在加载任务…</div>
        ) : filteredTasks.length > 0 ? (
          <div className="mvp-v21-task-list-surface">
            {filteredTasks.map((task) => (
              <TeacherTaskCard
                key={task.id}
                task={task}
                now={new Date(now)}
                onOpen={() => openTask(task)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={emptyCopy[filter].title}
            description={emptyCopy[filter].description}
            icon={filter === 'overdue' ? 'alert' : 'clipboard'}
          />
        )}
      </section>
    </div>
  );
}
