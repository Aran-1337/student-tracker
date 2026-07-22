"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { Student, Group, Grade, BookDef } from "@/lib/types";
import { StudentsService } from "@/lib/services/studentsService";
import { GroupsService } from "@/lib/services/groupsService";
import { GradesService } from "@/lib/services/gradesService";
import { TeachersService } from "@/lib/services/teachersService";
import { AuthService } from "@/lib/services/authService";

import { Toast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

import { StudentHeader } from "./_components/StudentHeader";
import { StudentInfoCard } from "./_components/StudentInfoCard";
import { StudentContactCard } from "./_components/StudentContactCard";
import { StudentFinancialCard } from "./_components/StudentFinancialCard";
import { StudentPaymentCard } from "./_components/StudentPaymentCard";
import { StudentBooksCard } from "./_components/StudentBooksCard";
import { exportStudentPDF } from "./_components/exportStudentPDF";

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [teacherBooks, setTeacherBooks] = useState<BookDef[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await AuthService.getSession();
        if (!session) { router.replace("/login"); return; }

        const [studentData, groupsData, gradesData, teacherProfile] = await Promise.all([
          StudentsService.getStudentById(id),
          GroupsService.getGroupsByTeacherId(session.user.id),
          GradesService.getGradesByTeacherId(session.user.id),
          TeachersService.getTeacherProfile(session.user.id),
        ]);

        if (!studentData) { router.replace("/dashboard/students"); return; }

        const normalized: Student = {
          ...studentData,
          months: Array.isArray(studentData.months) && studentData.months.length === 12
            ? studentData.months : Array(12).fill(false),
          received_books: Array.isArray(studentData.received_books) ? studentData.received_books : [],
        };

        setStudent(normalized);
        setFormData(normalized);
        setGroups(groupsData);
        setGrades(gradesData);
        setTeacherBooks(teacherProfile?.books || []);
      } catch {
        showToast("حدث خطأ أثناء تحميل البيانات.", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  const handleSave = async () => {
    if (!student) return;
    setSaving(true);
    try {
      const sanitized = { ...formData };
      if ((sanitized.discount_value as unknown as string) === "") sanitized.discount_value = 0;
      await StudentsService.updateStudent(student.id, sanitized);
      setStudent((prev) => prev ? { ...prev, ...sanitized } : prev);
      setIsEditing(false);
      showToast("تم حفظ التغييرات بنجاح.");
    } catch {
      showToast("فشل حفظ التغييرات.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMonth = async (idx: number) => {
    if (!student) return;
    const updated = [...(student.months || Array(12).fill(false))];
    updated[idx] = !updated[idx];
    setStudent((prev) => prev ? { ...prev, months: updated } : prev);
    try {
      await StudentsService.updateStudent(student.id, { months: updated });
    } catch {
      setStudent((prev) => prev ? { ...prev, months: student.months } : prev);
      showToast("فشل تعديل حالة الدفع.", "error");
    }
  };

  const handleToggleBook = async (bookId: string) => {
    if (!student) return;
    const prev = student.received_books || [];
    const updated = prev.includes(bookId) ? prev.filter((b) => b !== bookId) : [...prev, bookId];
    setStudent((s) => s ? { ...s, received_books: updated } : s);
    try {
      await StudentsService.updateStudent(student.id, { received_books: updated });
    } catch {
      setStudent((s) => s ? { ...s, received_books: prev } : s);
      showToast("فشل تعديل حالة الكتاب.", "error");
    }
  };

  const handleExportPDF = () => {
    if (!student) return;
    const group = groups.find((g) => g.id === student.group_id);
    const grade = grades.find((g) => g.id === student.grade_id);
    const studentBooks = teacherBooks.filter((b) => !b.grade_id || b.grade_id === student.grade_id);
    exportStudentPDF(student, group, grade, studentBooks);
  };

  if (loading) return <Spinner fullScreen />;
  if (!student) return null;

  const group = groups.find((g) => g.id === student.group_id);
  const grade = grades.find((g) => g.id === student.grade_id);
  const studentBooks = teacherBooks.filter((b) => !b.grade_id || b.grade_id === student.grade_id);
  const paidMonths = (student.months || []).filter(Boolean).length;
  const paidThisMonth = student.months?.[new Date().getMonth()] === true;

  return (
    <div>
      <StudentHeader
        student={student}
        group={group}
        grade={grade}
        isEditing={isEditing}
        saving={saving}
        paidMonths={paidMonths}
        paidThisMonth={paidThisMonth}
        onEdit={() => setIsEditing(true)}
        onCancel={() => { setIsEditing(false); setFormData(student); }}
        onSave={handleSave}
        onExportPDF={handleExportPDF}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
        <StudentInfoCard
          student={student}
          formData={formData}
          isEditing={isEditing}
          groups={groups}
          grades={grades}
          onChange={(updates) => setFormData((p) => ({ ...p, ...updates }))}
        />
        <StudentContactCard
          student={student}
          formData={formData}
          isEditing={isEditing}
          onChange={(updates) => setFormData((p) => ({ ...p, ...updates }))}
        />
        <StudentFinancialCard
          student={student}
          formData={formData}
          isEditing={isEditing}
          onChange={(updates) => setFormData((p) => ({ ...p, ...updates }))}
        />
        <StudentPaymentCard
          student={student}
          onToggleMonth={handleToggleMonth}
        />
        <StudentBooksCard
          student={student}
          books={studentBooks}
          onToggleBook={handleToggleBook}
        />
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
