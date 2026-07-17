import type { StudentProfile } from '../domain/students';
import type { StudentRef } from '../domain/tasks';

export const mockStudents: StudentProfile[] = [
  { id: 'student-chen', name: '陈同学', gradeId: 'grade-2', gradeName: '高二', classId: 'class-g2-3', className: '高二（3）班' },
  { id: 'student-zhou', name: '周同学', gradeId: 'grade-2', gradeName: '高二', classId: 'class-g2-3', className: '高二（3）班' },
  { id: 'student-zheng', name: '郑同学', gradeId: 'grade-2', gradeName: '高二', classId: 'class-g2-3', className: '高二（3）班' },
  { id: 'student-qian', name: '钱同学', gradeId: 'grade-2', gradeName: '高二', classId: 'class-g2-3', className: '高二（3）班' },
  { id: 'student-zhao', name: '赵同学', gradeId: 'grade-2', gradeName: '高二', classId: 'class-g2-3', className: '高二（3）班' },
  { id: 'student-lin', name: '林同学', gradeId: 'grade-2', gradeName: '高二', classId: 'class-g2-1', className: '高二（1）班' },
  { id: 'student-he', name: '何同学', gradeId: 'grade-2', gradeName: '高二', classId: 'class-g2-1', className: '高二（1）班' },
  { id: 'student-sun', name: '孙同学', gradeId: 'grade-2', gradeName: '高二', classId: 'class-g2-1', className: '高二（1）班' },
  { id: 'student-xu', name: '许同学', gradeId: 'grade-1', gradeName: '高一', classId: 'class-g1-2', className: '高一（2）班' },
  { id: 'student-wu', name: '吴同学', gradeId: 'grade-2', gradeName: '高二', classId: 'class-g2-5', className: '高二（5）班' },
  { id: 'student-tang', name: '唐同学', gradeId: 'grade-2', gradeName: '高二', classId: 'class-g2-5', className: '高二（5）班' },
  { id: 'student-wang', name: '王同学', gradeId: 'grade-2', gradeName: '高二', classId: 'class-g2-6', className: '高二（6）班' },
];

export function getMockStudentRef(studentId: string): StudentRef {
  const student = mockStudents.find((item) => item.id === studentId);
  if (!student) throw new Error(`Mock student is missing: ${studentId}`);
  return { ...student };
}
