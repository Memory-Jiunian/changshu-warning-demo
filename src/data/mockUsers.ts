import type { DemoUser } from '../domain/users';

export const mockUsers: DemoUser[] = [
  {
    id: 'user-head-li',
    name: '李老师',
    role: 'head_teacher',
    classIds: ['class-g2-3'],
  },
  {
    id: 'user-head-wang',
    name: '王老师',
    role: 'head_teacher',
    classIds: ['class-g2-6', 'class-g2-8'],
  },
  {
    id: 'user-head-sun',
    name: '孙老师',
    role: 'head_teacher',
    classIds: ['class-g2-5'],
  },
  {
    id: 'user-director-g2',
    name: '陈老师',
    role: 'grade_director',
    managedGradeIds: ['grade-2'],
  },
  {
    id: 'user-psych-zhou',
    name: '周老师',
    role: 'psychologist',
  },
];

export const defaultUserIdByRole = {
  head_teacher: 'user-head-li',
  grade_director: 'user-director-g2',
  psychologist: 'user-psych-zhou',
} as const;
