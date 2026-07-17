export type UserRole = 'head_teacher' | 'grade_director' | 'psychologist';

export interface DemoUser {
  id: string;
  name: string;
  role: UserRole;
  classIds?: string[];
  managedGradeIds?: string[];
}
