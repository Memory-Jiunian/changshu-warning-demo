import type { CurrentRouteRole } from './currentRouteAuthority';

export const MOBILE_DEMO_ROLES = [
  {
    role: 'head_teacher',
    title: '班主任',
    description: '执行协作任务',
    route: '#/feedback/tasks',
  },
  {
    role: 'grade_director',
    title: '年级主任',
    description: '查看协作进度并进行督办',
    route: '#/mvp/grade-director/tasks',
  },
  {
    role: 'principal',
    title: '校长',
    description: '查看脱敏后的校级整体态势',
    route: '#/mvp/principal/overview',
  },
] as const satisfies ReadonlyArray<{
  role: CurrentRouteRole;
  title: string;
  description: string;
  route: string;
}>;

export function getMobileDemoRoute(role: CurrentRouteRole) {
  return MOBILE_DEMO_ROLES.find((option) => option.role === role)?.route;
}
