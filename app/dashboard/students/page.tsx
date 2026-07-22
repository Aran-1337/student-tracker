"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Users, CheckSquare, Square, AlertCircle, Printer } from "lucide-react";

import { Student, Group, Grade, BookDef } from "@/lib/types";
import { StudentsService } from "@/lib/services/studentsService";
import { GroupsService } from "@/lib/services/groupsService";
import { GradesService } from "@/lib/services/gradesService";
import { TeachersService } from "@/lib/services/teachersService";
import { AuthService } from "@/lib/services/authService";
import { supabase } from "@/lib/supabaseClient";

import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { StudentTableRow } from "@/components/features/StudentTableRow";
import { StudentProfileModal } from "@/components/features/StudentProfileModal";

import { AddStudentForm } from "./_components/AddStudentForm";
import { StudentsFilters } from "./_components/StudentsFilters";
import { BulkActionBar } from "./_components/BulkActionBar";
import { Pagination } from "./_components/Pagination";
import { ConfirmDeleteDialog } from "./_components/ConfirmDeleteDialog";

const PAGE_SIZE = 20;

interface PendingConfirm {
  ids: string[];
  message: string;
}

export default function StudentsManagement() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [teacherBooks, setTeacherBooks] = useState<BookDef[]>([]);
  const [hasCenterMode, setHasCenterMode] = useState(false);
  const [subTeachers, setSubTeachers] = useState<any[]>([]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGradeId, setFilterGradeId] = useState("all");
  const [filterSubTeacherId, setFilterSubTeacherId] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await AuthService.getSession();
        if (!session) return;
        setUserId(session.user.id);

        const [groupsData, studentsData, gradesData, teacherProfile] = await Promise.all([
          GroupsService.getGroupsByTeacherId(session.user.id),
          StudentsService.getStudentsByTeacherId(session.user.id),
          GradesService.getGradesByTeacherId(session.user.id),
          TeachersService.getTeacherProfile(session.user.id),
        ]);

        setGroups(groupsData);
        setGrades(gradesData);
        setTeacherBooks(teacherProfile?.books || []);

        const centerMode = teacherProfile?.is_center_mode || false;
        setHasCenterMode(centerMode);

        if (centerMode) {
          const { data: subs } = await supabase.from("sub_teachers").select("*").eq("center_id", session.user.id);
          setSubTeachers(subs || []);
        }

        setStudents(
          studentsData.map((s) => ({
            ...s,
            months: Array.isArray(s.months) && s.months.length === 12 ? s.months : Array(12).fill(false),
            received_books: Array.isArray(s.received_books) ? s.received_books : [],
          }))
        );
      } catch {
        showToast("حدث خطأ أثناء تحميل البيانات.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // ─── Filtering ────────────────────────────────────────────────────────────
  const filteredStudents = students.filter((s) => {
    const effectiveGradeId = s.grade_id || groups.find((g) => g.id === s.group_id)?.grade_id;
    const matchesGrade = filterGradeId === "all" || effectiveGradeId === filterGradeId;
    const matchesGroup =
      activeFilter === "all" ? true : activeFilter === "none" ? s.group_id === null : s.group_id === activeFilter;
    const studentSubTId = groups.find((g) => g.id === s.group_id)?.sub_teacher_id;
    const matchesSub = !hasCenterMode || filterSubTeacherId === "all" || studentSubTId === filterSubTeacherId;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.code && s.code.includes(searchQuery));
    return matchesGrade && matchesGroup && matchesSub && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedStudents = filteredStudents.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleFilterChange = useCallback((setter: (v: string) => void) => (v: string) => {
    setter(v);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, []);

  // ─── Add Student ──────────────────────────────────────────────────────────
  const handleAddStudent = async (data: { name: string; gradeId: string; groupId: string; parentPhone: string; subTeacherId: string }) => {
    if (!data.name || !userId) { showToast("يرجى إدخال اسم الطالب.", "error"); return; }
    if (!data.gradeId) { showToast("يرجى اختيار السنة الدراسية.", "error"); return; }
    setActionLoading(true);
    try {
      const newStudent = await StudentsService.addStudentWithGeneratedCode({
        teacher_id: userId,
        name: data.name,
        group_id: data.groupId || null,
        grade_id: data.gradeId,
        months: Array(12).fill(false),
        received_books: [],
        parent_phone: data.parentPhone,
      }, students);
      setStudents((prev) => [newStudent, ...prev]);
      showToast("تم إضافة الطالب بنجاح.");
    } catch (err: any) {
      showToast(err.message || "فشل إضافة الطالب.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Delete with Confirm ──────────────────────────────────────────────────
  const handleDeleteStudent = (studentId: string) => {
    const target = students.find((s) => s.id === studentId);
    if (!target) return;
    setPendingConfirm({ ids: [studentId], message: `هل أنت متأكد من حذف "${target.name}"؟` });
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setPendingConfirm({ ids, message: `هل أنت متأكد من حذف ${ids.length} طالب؟` });
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingConfirm) return;
    const { ids } = pendingConfirm;
    setPendingConfirm(null);
    setStudents((prev) => prev.filter((s) => !ids.includes(s.id)));
    setSelectedIds(new Set());
    try {
      if (ids.length === 1) await StudentsService.deleteStudent(ids[0]);
      else await StudentsService.deleteStudents(ids);
      showToast(ids.length === 1 ? "تم حذف الطالب بنجاح." : `تم حذف ${ids.length} طالب بنجاح.`);
    } catch {
      showToast("فشل الحذف من قاعدة البيانات.", "error");
    }
  }, [pendingConfirm]);

  // ─── Toggle Month (debounced per student) ─────────────────────────────────
  const monthTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleToggleMonth = (student: Student, monthIdx: number) => {
    const updatedMonths = [...(student.months || Array(12).fill(false))];
    updatedMonths[monthIdx] = !updatedMonths[monthIdx];
    setStudents((prev) => prev.map((s) => s.id === student.id ? { ...s, months: updatedMonths } : s));

    if (monthTimers.current[student.id]) clearTimeout(monthTimers.current[student.id]);
    monthTimers.current[student.id] = setTimeout(async () => {
      try {
        await StudentsService.updateStudent(student.id, { months: updatedMonths });
      } catch {
        setStudents((prev) => prev.map((s) => s.id === student.id ? { ...s, months: student.months } : s));
        showToast("حدث خطأ أثناء تعديل حالة الدفع.", "error");
      }
    }, 600);
  };

  const handleToggleBook = async (student: Student, bookId: string) => {
    const prev = student.received_books || [];
    const updated = prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId];
    setStudents((s) => s.map((x) => x.id === student.id ? { ...x, received_books: updated } : x));
    try {
      await StudentsService.updateStudent(student.id, { received_books: updated });
    } catch {
      setStudents((s) => s.map((x) => x.id === student.id ? { ...x, received_books: prev } : x));
      showToast("حدث خطأ أثناء تعديل حالة الكتاب.", "error");
    }
  };

  const handleChangeGroup = async (studentId: string, newGroupId: string) => {
    const targetGroupId = newGroupId === "" ? null : newGroupId;
    setStudents((prev) => prev.map((s) => s.id === studentId ? { ...s, group_id: targetGroupId } : s));
    try {
      await StudentsService.updateStudent(studentId, { group_id: targetGroupId });
      showToast("تم النقل بنجاح.");
    } catch {
      showToast("فشل نقل الطالب.", "error");
    }
  };

  const handleSaveStudentProfile = async (studentId: string, updates: Partial<Student>) => {
    await StudentsService.updateStudent(studentId, updates);
    setStudents((prev) => prev.map((s) => s.id === studentId ? { ...s, ...updates } : s));
    showToast("تم تحديث بيانات الطالب بنجاح!");
  };

  // ─── Selection ────────────────────────────────────────────────────────────
  const toggleSelectStudent = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pagedStudents.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(pagedStudents.map((s) => s.id)));
  };

  const allSelected = pagedStudents.length > 0 && selectedIds.size === pagedStudents.length;

  // ─── Print ────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const arabicMonthsArr = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

    const rows = filteredStudents.map((s, i) => {
      const group = groups.find((g) => g.id === s.group_id);
      const grade = grades.find((g) => g.id === (s.grade_id || groups.find((gr) => gr.id === s.group_id)?.grade_id));
      const paidCount = (s.months || []).filter(Boolean).length;
      const monthCells = (s.months || Array(12).fill(false))
        .map((m, idx) => `<td style="text-align:center;border:1px solid #ddd;background:${m ? "#d1fae5" : "#f9fafb"};font-size:11px">${m ? "✓" : ""}</td>`)
        .join("");
      return `<tr>
        <td style="border:1px solid #ddd;padding:5px 8px;text-align:center">${i + 1}</td>
        <td style="border:1px solid #ddd;padding:5px 8px;font-family:monospace;text-align:center">${s.code || "—"}</td>
        <td style="border:1px solid #ddd;padding:5px 8px;font-weight:600">${s.name}</td>
        <td style="border:1px solid #ddd;padding:5px 8px;text-align:center">${grade?.name || "—"}</td>
        <td style="border:1px solid #ddd;padding:5px 8px;text-align:center">${group?.name || "—"}</td>
        ${monthCells}
        <td style="border:1px solid #ddd;padding:5px 8px;text-align:center;font-weight:700">${paidCount}/12</td>
      </tr>`;
    }).join("");

    const monthHeaders = arabicMonthsArr.map(m => `<th style="border:1px solid #ddd;padding:4px;font-size:10px">${m.slice(0,3)}</th>`).join("");

    const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
      <title>قائمة الطلاب</title>
      <style>body{font-family:Arial,sans-serif;padding:16px;font-size:13px}table{border-collapse:collapse;width:100%}th{background:#f3f4f6;padding:6px 8px;border:1px solid #ddd}@media print{body{padding:8px}}</style>
    </head><body>
      <h2 style="text-align:center;margin-bottom:4px">قائمة الطلاب</h2>
      <p style="text-align:center;color:#666;margin-bottom:12px">إجمالي: ${filteredStudents.length} طالب — ${new Date().toLocaleDateString("ar-EG")}</p>
      <table><thead><tr>
        <th style="border:1px solid #ddd;padding:6px">#</th>
        <th style="border:1px solid #ddd;padding:6px">الكود</th>
        <th style="border:1px solid #ddd;padding:6px">الاسم</th>
        <th style="border:1px solid #ddd;padding:6px">السنة</th>
        <th style="border:1px solid #ddd;padding:6px">المجموعة</th>
        ${monthHeaders}
        <th style="border:1px solid #ddd;padding:6px">الدفع</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <script>window.onload=()=>window.print()</script>
    </body></html>`;

    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  if (loading) return <Spinner fullScreen />;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>إدارة الطلاب</h1>
          <p style={{ color: "var(--text-secondary)" }}>إضافة الطلاب وإدارة الاشتراكات والكتب المستلمة</p>
        </div>
        <Link href={`/dashboard/students/print-qr?gradeId=${filterGradeId}&groupId=${activeFilter}`} style={{ textDecoration: "none" }}>
          <Button variant="secondary" leftIcon={<Printer size={16} />}>طباعة بطاقات QR</Button>
        </Link>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: "320px 1fr", alignItems: "start" }}>
        {/* Sidebar */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <AddStudentForm
            groups={groups}
            grades={grades}
            hasCenterMode={hasCenterMode}
            subTeachers={subTeachers}
            isLoading={actionLoading}
            onSubmit={handleAddStudent}
          />

          {/* Stats card */}
          <div className="glass-panel panel-content stat-card">
            <div className="stat-icon-wrapper" style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>
              <Users size={22} />
            </div>
            <div>
              <div className="stat-value">{filteredStudents.length}</div>
              <div className="stat-label">طالب في الفلتر الحالي</div>
            </div>
          </div>
        </aside>

        {/* Main Table Panel */}
        <div className="glass-panel panel-content" style={{ display: "flex", flexDirection: "column", minHeight: "600px" }}>
          <StudentsFilters
            grades={grades}
            groups={groups}
            hasCenterMode={hasCenterMode}
            subTeachers={subTeachers}
            searchQuery={searchQuery}
            filterGradeId={filterGradeId}
            filterSubTeacherId={filterSubTeacherId}
            activeFilter={activeFilter}
            onSearchChange={handleFilterChange(setSearchQuery)}
            onGradeChange={handleFilterChange(setFilterGradeId)}
            onSubTeacherChange={handleFilterChange(setFilterSubTeacherId)}
            onGroupChange={handleFilterChange(setActiveFilter)}
            onPrint={handlePrint}
          />

          <BulkActionBar
            count={selectedIds.size}
            isLoading={actionLoading}
            onDelete={handleBulkDelete}
            onClear={() => setSelectedIds(new Set())}
          />

          {/* Table */}
          <div className="table-container" style={{ flex: 1 }}>
            <table className="students-table">
              <thead>
                <tr>
                  <th style={{ width: "40px", textAlign: "center" }}>
                    <button onClick={toggleSelectAll} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", margin: "0 auto" }} title="تحديد الكل">
                      {allSelected ? <CheckSquare size={18} className="color-teal" /> : <Square size={18} />}
                    </button>
                  </th>
                  <th style={{ textAlign: "center", minWidth: "70px" }}>الكود</th>
                  <th style={{ textAlign: "center", minWidth: "110px" }}>السنة</th>
                  <th style={{ minWidth: "180px" }}>الاسم</th>
                  <th style={{ textAlign: "center", minWidth: "160px" }}>المجموعة</th>
                  <th style={{ textAlign: "center", minWidth: "240px" }}>الشهور (١–١٢)</th>
                  <th style={{ textAlign: "center", minWidth: "130px" }}>الكتب</th>
                  <th style={{ textAlign: "center", minWidth: "80px" }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {pagedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "3rem" }}>
                      <div className="empty-state" style={{ margin: "0 auto" }}>
                        <AlertCircle size={44} style={{ opacity: 0.4, marginBottom: "0.75rem" }} />
                        <p style={{ color: "var(--text-secondary)" }}>لا يوجد طلاب للفلتر المحدد</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedStudents.map((student) => (
                    <StudentTableRow
                      key={student.id}
                      student={student}
                      groups={groups}
                      grades={grades}
                      teacherBooks={teacherBooks}
                      isSelected={selectedIds.has(student.id)}
                      onToggleSelect={toggleSelectStudent}
                      onToggleMonth={handleToggleMonth}
                      onToggleBook={handleToggleBook}
                      onDelete={handleDeleteStudent}
                      onUpdateGroup={handleChangeGroup}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={filteredStudents.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Toasts */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {pendingConfirm && (
        <ConfirmDeleteDialog
          message={pendingConfirm.message}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingConfirm(null)}
        />
      )}

      <StudentProfileModal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        student={editingStudent}
        groups={groups}
        grades={grades}
        onSave={handleSaveStudentProfile}
      />
    </div>
  );
}
