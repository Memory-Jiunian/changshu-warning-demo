import type { DemoUser } from '../domain/users';
import type { CollaborationTask } from '../domain/tasks';
import type { StudentProfile } from '../domain/students';
import { canTaskAcceptObservation, isTaskOverdue } from './taskSelectors';

export function canUserViewTask(user: DemoUser, task: CollaborationTask, now: Date) {
  if (user.role === 'psychologist') return true;
  if (user.role === 'head_teacher') return task.assigneeId === user.id;

  const managesGrade = user.managedGradeIds?.includes(task.student.gradeId) ?? false;
  const explicitlyAssigned = task.supervisorId === user.id;
  return explicitlyAssigned || (managesGrade && isTaskOverdue(task, now));
}

export function canUserSubmitObservation(user: DemoUser, task: CollaborationTask) {
  return user.role === 'head_teacher' && task.assigneeId === user.id && canTaskAcceptObservation(task);
}

export function canUserViewStudent(user: DemoUser, student: StudentProfile) {
  return user.role === 'head_teacher' && Boolean(user.classIds?.includes(student.classId));
}

export function canUserConfirmRetestReminder(user: DemoUser, task: CollaborationTask) {
  return user.role === 'head_teacher' && task.assigneeId === user.id && task.type === 'retest_reminder' && task.status === 'pending';
}

export function canUserAddSupervision(user: DemoUser, task: CollaborationTask, now: Date) {
  return user.role === 'grade_director' && canUserViewTask(user, task, now);
}

export function canUserMarkFeedbackViewed(user: DemoUser, task: CollaborationTask) {
  return user.role === 'psychologist' && task.status === 'submitted';
}
