import type { StudentRef } from '../../domain/tasks';

export function StudentCompactInfo({ student }: { student: StudentRef }) {
  return (
    <dl className="mvp-student-compact">
      <div><dt>学生</dt><dd>{student.name}</dd></div>
      <div><dt>年级</dt><dd>{student.gradeName}</dd></div>
      <div><dt>班级</dt><dd>{student.className}</dd></div>
    </dl>
  );
}
