import { useEffect } from 'react';
import { TeacherTaskCard } from '../components/business/TeacherTaskCard';
import { AppIcon } from '../components/ui/AppIcon';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import type { CollaborationTask } from '../domain/tasks';
import {
  filterTeacherTasks,
  normalizeTeacherTaskFilter,
  teacherTaskFilterLabels,
  type TeacherTaskFilter,
} from '../selectors/taskSelectors';

const standardFilters: TeacherTaskFilter[] = [
  'all',
  'pending',
  'returned',
  'overdue',
  'retest',
  'submitted',
  'completed',
];

const emptyCopy: Record<TeacherTaskFilter, { title: string; description: string }> = {
  all: { title: '暂无协作任务', description: '新的协作任务会在管理终端完成分发后显示在这里。' },
  pending: { title: '当前没有需要填写观察反馈的任务', description: '可以查看其他筛选中的历史任务。' },
  overdue: { title: '当前没有已超时任务', description: '可以查看其他筛选中的协作任务。' },
  returned: { title: '当前没有被退回等待补充的任务', description: '需要补充时，原反馈仍会保留。' },
  retest: { title: '当前没有复测提醒', description: '复测安排由管理终端创建后同步到这里。' },
  submitted: { title: '暂时没有已提交的协作任务', description: '提交成功的观察反馈会显示在这里。' },
  completed: { title: '暂时没有已完成的协作任务', description: '已结束任务只保留只读记录。' },
};

function scrollKey(userId: string, filter: TeacherTaskFilter) {
  return `changshu-demo:teacher-task-scroll:${userId}:${filter}`;
}

export function TeacherTaskListPage({
  userId,
  tasks,
  now,
  filter: rawFilter,
  loading,
  onBack,
  onFilter,
  onOpen,
}: {
  userId: string;
  tasks: CollaborationTask[];
  now: string;
  filter?: string;
  loading: boolean;
  onBack: () => void;
  onFilter: (filter: TeacherTaskFilter) => void;
  onOpen: (task: CollaborationTask) => void;
}) {
  const filter = normalizeTeacherTaskFilter(rawFilter);
  const filteredTasks = filterTeacherTasks(tasks, filter, new Date(now));

  useEffect(() => {
    const saved = Number(window.sessionStorage.getItem(scrollKey(userId, filter)) ?? 0);
    const frame = window.requestAnimationFrame(() => window.scrollTo({ top: saved }));
    return () => window.cancelAnimationFrame(frame);
  }, [filter, userId]);

  const openTask = (task: CollaborationTask) => {
    window.sessionStorage.setItem(scrollKey(userId, filter), String(window.scrollY));
    window.sessionStorage.setItem('changshu-demo:teacher-task-last-filter', filter);
    onOpen(task);
  };

  return (
    <div className="mvp-page mvp-task-list-page" aria-busy={loading}>
      <header className="mvp-page-header">
        <Button variant="secondary" size="icon" aria-label="返回首页" onClick={onBack}>
          <AppIcon name="arrowLeft" size={20} />
        </Button>
        <div>
          <h1>我的任务</h1>
        </div>
      </header>

      <nav className="mvp-filter-tabs" aria-label="任务筛选">
        {standardFilters.map((item) => (
          <button
            key={item}
            type="button"
            className={filter === item ? 'is-active' : ''}
            aria-current={filter === item ? 'page' : undefined}
            onClick={() => onFilter(item)}
          >
            {teacherTaskFilterLabels[item]}
          </button>
        ))}
      </nav>

      <section className="mvp-task-results" aria-label={`${teacherTaskFilterLabels[filter]}任务`}>
        <p className="mvp-list-summary" aria-live="polite">
          {filteredTasks.length} 项结果
        </p>
        {loading && filteredTasks.length === 0 ? (
          <div className="mvp-loading-state" role="status">正在加载任务…</div>
        ) : filteredTasks.length > 0 ? (
          <div className="mvp-card-list">
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
