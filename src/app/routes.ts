export type MvpRouteName =
  | 'roleSelect'
  | 'home'
  | 'tasks'
  | 'teacherTaskDetail'
  | 'teacherFeedback'
  | 'report'
  | 'profile'
  | 'retest'
  | 'supervision'
  | 'legacyTask'
  | 'legacyReport'
  | 'legacyCounselor'
  | 'legacyPrincipal'
  | 'notFound';

export interface MvpRoute {
  name: MvpRouteName;
  taskId?: string;
  filter?: string;
  highlightRecordId?: string;
}

function parseHashQuery(hash: string) {
  const [path, rawQuery = ''] = hash.split('?');
  return { path, query: new URLSearchParams(rawQuery) };
}

export function getMvpRoute(): MvpRoute {
  const rawHash = window.location.hash.replace(/^#/, '') || '/';
  const { path, query } = parseHashQuery(rawHash);
  const parts = path.split('/').filter(Boolean);

  if (parts.length === 0) return { name: 'home' };
  if (parts[0] === 'select-role') return { name: 'roleSelect' };
  if (parts[0] === 'mvp' && parts[1] === 'home') return { name: 'home' };
  if (
    parts[0] === 'mvp' &&
    (parts[1] === 'tasks' || (parts[1] === 'teacher' && parts[2] === 'tasks'))
  ) {
    const taskId = parts[1] === 'teacher' ? parts[3] : undefined;
    if (taskId && parts[4] === 'feedback') {
      return { name: 'teacherFeedback', taskId };
    }
    if (taskId) {
      return {
        name: 'teacherTaskDetail',
        taskId,
        highlightRecordId: query.get('highlight') ?? undefined,
      };
    }
    return { name: 'tasks', filter: query.get('filter') ?? undefined };
  }
  if (parts[0] === 'mvp' && parts[1] === 'report') return { name: 'report' };
  if (parts[0] === 'mvp' && parts[1] === 'profile') return { name: 'profile' };
  if (parts[0] === 'mvp' && parts[1] === 'retest') {
    return { name: 'retest', taskId: parts[2] };
  }
  if (parts[0] === 'mvp' && parts[1] === 'supervision') {
    return {
      name: 'supervision',
      taskId: query.get('task') ?? undefined,
      filter: query.get('filter') ?? undefined,
    };
  }
  if (parts[0] === 'legacy' && parts[1] === 'counselor') return { name: 'legacyCounselor' };
  if (parts[0] === 'legacy' && parts[1] === 'principal') return { name: 'legacyPrincipal' };
  if (parts[0] === 'school-overview') return { name: 'legacyPrincipal' };
  if (parts[0] === 'report') return { name: 'legacyReport' };
  if (parts[0] === 'task') return { name: 'legacyTask', taskId: parts[1] };
  return { name: 'notFound' };
}

export function getActiveNavigation(route: MvpRoute) {
  if (
    ['tasks', 'teacherTaskDetail', 'teacherFeedback', 'legacyTask'].includes(route.name)
  ) return 'tasks';
  if (route.name === 'report' || route.name === 'legacyReport') return 'report';
  if (route.name === 'supervision') return 'supervision';
  if (route.name === 'profile') return 'profile';
  return 'home';
}
