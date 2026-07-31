import type { UserRole } from '../domain/users';
import { parseFactualFeedbackRoute } from '../features/factualFeedback/routes';
import { getCurrentMvpRouteRole, getMvpRoute } from './routes';

export type CurrentRouteRole = Extract<
  UserRole,
  'head_teacher' | 'grade_director' | 'principal'
>;

export const DEMO_ROLE_STORAGE_KEY = 'changshu-mvp-demo-role';

export function getCurrentRouteRole(hash: string): CurrentRouteRole | undefined {
  const factualRoute = parseFactualFeedbackRoute(hash);
  if (factualRoute.name === 'teacherTasks') return 'head_teacher';

  return getCurrentMvpRouteRole(getMvpRoute(hash)) ?? undefined;
}

export function readDemoSessionRole(storage?: Pick<Storage, 'getItem'>) {
  const value = storage?.getItem(DEMO_ROLE_STORAGE_KEY);
  return value === 'head_teacher' ||
    value === 'grade_director' ||
    value === 'principal'
    ? value
    : undefined;
}

export function getEffectiveDemoRole(
  hash: string,
  sessionRole?: CurrentRouteRole,
): CurrentRouteRole {
  return getCurrentRouteRole(hash) ?? sessionRole ?? 'head_teacher';
}
