import type { AbnormalReport } from '../domain/feedback';
import type { StudentProfile } from '../domain/students';
import type { DemoUser } from '../domain/users';
import { canUserViewStudent } from './permissionSelectors';

export const abnormalReportStatusLabel = '已提交，等待心理老师专业复核';

export function getVisibleStudentsForUser(user: DemoUser, students: StudentProfile[]) {
  return students
    .filter((student) => canUserViewStudent(user, student))
    .sort((left, right) => {
      const classCompare = left.className.localeCompare(right.className, 'zh-CN');
      return classCompare || left.name.localeCompare(right.name, 'zh-CN');
    });
}

export function getVisibleReportsForUser(user: DemoUser, reports: AbnormalReport[]) {
  if (user.role !== 'head_teacher') return [];
  return reports
    .filter((report) => report.reporterId === user.id)
    .sort(
      (left, right) =>
        new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime(),
    );
}
