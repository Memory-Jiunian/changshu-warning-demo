export type FactualFeedbackRoute =
  | { name: 'teacherTasks'; taskId?: string }
  | { name: 'psychologistReview'; taskId: string }
  | { name: 'notFound' };

export function isFactualFeedbackHash(hash: string) {
  return hash.replace(/^#/, '').startsWith('/feedback');
}

export function parseFactualFeedbackRoute(hash: string): FactualFeedbackRoute {
  const raw = hash.replace(/^#/, '') || '/feedback/tasks';
  const [path] = raw.split('?');
  const parts = path.split('/').filter(Boolean);

  if (parts[0] !== 'feedback') return { name: 'notFound' };
  if (parts[1] === 'tasks') {
    return { name: 'teacherTasks', taskId: parts[2] };
  }
  if (parts[1] === 'review' && parts[2]) {
    return { name: 'psychologistReview', taskId: parts[2] };
  }
  return { name: 'notFound' };
}
