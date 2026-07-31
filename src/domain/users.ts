export type UserRole = 'head_teacher' | 'grade_director' | 'psychologist' | 'principal';

export interface DemoUser {
  id: string;
  name: string;
  role: UserRole;
  classIds?: string[];
  managedGradeIds?: string[];
}
