"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Users, Plus, Search, UserPlus, CheckSquare, Square, AlertCircle } from "lucide-react";
import { Student, Group, Grade } from "@/lib/types";
import { StudentsService } from "@/lib/services/studentsService";
import { GroupsService } from "@/lib/services/groupsService";
import { GradesService } from "@/lib/services/gradesService";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { StudentTableRow } from "@/components/features/StudentTableRow";

const formatTimeTo12H = (timeStr: string) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const ampm = hours >= 12 ? "م" : "ص";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, "0");
  return `${strHours}:${minutes} ${ampm}`;
};

const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export default function StudentsManagement() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // App data state
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  // Form state
  const [studentName, setStudentName] = useState("");
  const [studentGroupId, setStudentGroupId] = useState("");
  const [studentGradeId, setStudentGradeId] = useState("");

  // Bulk selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Filters state
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [filterGradeId, setFilterGradeId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setUserId(session.user.id);

        const [groupsData, studentsData, gradesData] = await Promise.all([
          GroupsService.getAllGroups(),
          StudentsService.getAllStudents(),
          GradesService.getAllGrades()
        ]);

        setGroups(groupsData);
        setGrades(gradesData);

        const validatedStudents = studentsData.map(student => ({
          ...student,
          months: Array.isArray(student.months) && student.months.length === 12
            ? student.months 
            : Array(12).fill(false)
        }));
        setStudents(validatedStudents);
      } catch (err: any) {
        showToast("حدث خطأ أثناء تحميل البيانات.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !userId) {
      showToast("يرجى إدخال اسم الطالب.", "error");
      return;
    }
    if (!studentGradeId) {
      showToast("يرجى اختيار السنة الدراسية.", "error");
      return;
    }

    setActionLoading(true);
    try {
      const selectedGroupIdVal = studentGroupId === "" ? null : studentGroupId;
      const initialMonths = Array(12).fill(false);

      const newStudent = await StudentsService.addStudentWithGeneratedCode({
        teacher_id: userId,
        name: studentName,
        group_id: selectedGroupIdVal,
        grade_id: studentGradeId,
        months: initialMonths,
        book_1: false,
        book_2: false
      }, students);

      setStudents([...students, newStudent]);
      setStudentName("");
      setStudentGroupId("");
      showToast("تم إضافة الطالب بنجاح.");
    } catch (err: any) {
      showToast(err.message || "فشل إضافة الطالب.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطالب نهائياً؟")) return;

    try {
      await StudentsService.deleteStudent(studentId);
      setStudents(students.filter(s => s.id !== studentId));
      setSelectedStudentIds(prev => { const n = new Set(prev); n.delete(studentId); return n; });
      showToast("تم حذف الطالب بنجاح.");
    } catch (err: any) {
      showToast(err.message || "فشل حذف الطالب.", "error");
    }
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedStudentIds);
    if (ids.length === 0) return;

    if (!confirm(`هل أنت متأكد من حذف ${ids.length} طالب؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;

    setActionLoading(true);
    try {
      // For now, doing it sequentially as Service doesn't have bulkDelete yet,
      // but let's assume we can add it to repo/service if needed.
      // We will use supabase direct for bulk just to not break behavior now.
      const { error } = await supabase
        .from("students")
        .delete()
        .in("id", ids);

      if (error) throw error;

      setStudents(students.filter(s => !selectedStudentIds.has(s.id)));
      setSelectedStudentIds(new Set());
      showToast(`✓ تم حذف ${ids.length} طالب بنجاح.`);
    } catch (err: any) {
      showToast(err.message || "فشل الحذف الجماعي.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleMonth = async (student: Student, monthIdx: number) => {
    const updatedMonths = [...(student.months || Array(12).fill(false))];
    updatedMonths[monthIdx] = !updatedMonths[monthIdx];

    const prevStudents = [...students];
    setStudents(students.map(s => s.id === student.id ? { ...s, months: updatedMonths } : s));

    try {
      await StudentsService.updateStudent(student.id, { months: updatedMonths });
    } catch (err: any) {
      setStudents(prevStudents);
      showToast("حدث خطأ أثناء تعديل حالة الدفع.", "error");
    }
  };

  const handleToggleBook = async (student: Student, bookKey: "book_1" | "book_2") => {
    const updatedVal = !student[bookKey];

    const prevStudents = [...students];
    setStudents(students.map(s => s.id === student.id ? { ...s, [bookKey]: updatedVal } : s));

    try {
      await StudentsService.updateStudent(student.id, { [bookKey]: updatedVal });
    } catch (err: any) {
      setStudents(prevStudents);
      showToast("حدث خطأ أثناء تعديل حالة الكتاب.", "error");
    }
  };

  const handleChangeGroup = async (studentId: string, newGroupId: string) => {
    try {
      const targetGroupId = newGroupId === "" ? null : newGroupId;
      await StudentsService.updateStudent(studentId, { group_id: targetGroupId });
      setStudents(students.map(s => s.id === studentId ? { ...s, group_id: targetGroupId } : s));
      showToast(`تم النقل بنجاح.`);
    } catch (err: any) {
      showToast("فشل نقل الطالب.", "error");
    }
  };

  // Selection helpers
  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.size === filteredStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const studentEffectiveGradeId = student.grade_id || groups.find(g => g.id === student.group_id)?.grade_id;
    const matchesGrade = filterGradeId === "all" || studentEffectiveGradeId === filterGradeId;

    const matchesGroup = activeFilter === "all" 
      ? true 
      : activeFilter === "none" 
        ? student.group_id === null 
        : student.group_id === activeFilter;
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (student.code && student.code.includes(searchQuery));
    return matchesGrade && matchesGroup && matchesSearch;
  });

  const allSelected = filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length;
  const someSelected = selectedStudentIds.size > 0;

  if (loading) {
    return <Spinner fullScreen />;
  }

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>إدارة الطلاب</h1>
        <p style={{ color: "var(--text-secondary)" }}>إضافة الطلاب وإدارة الاشتراكات والكتب المستلمة</p>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: "350px 1fr" }}>
        {/* Sidebar: Add Student Form */}
        <aside className="sidebar-panels" style={{ gap: 0 }}>
          <div className="glass-panel panel-content">
            <h2 className="panel-title">
              <UserPlus size={18} className="stat-icon-teal" style={{ background: "none", border: "none" }} />
              <span>إضافة طالب جديد</span>
            </h2>
            <form onSubmit={handleAddStudent}>
              <div className="form-group">
                <Input
                  label="اسم الطالب"
                  id="sName"
                  type="text"
                  required
                  placeholder="الاسم الكامل للطالب"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="sGrade">السنة الدراسية</label>
                <select
                  id="sGrade"
                  required
                  className="form-input"
                  value={studentGradeId}
                  onChange={(e) => {
                    setStudentGradeId(e.target.value);
                    setStudentGroupId(""); // Reset group when grade changes
                  }}
                  style={{ padding: "0.7rem 0.5rem" }}
                >
                  <option value="">-- اختر السنة الدراسية --</option>
                  {grades.map(grade => (
                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="sGroup">المجموعة (اختياري)</label>
                <select
                  id="sGroup"
                  className="form-input"
                  value={studentGroupId}
                  onChange={(e) => setStudentGroupId(e.target.value)}
                  style={{ padding: "0.7rem 0.5rem" }}
                >
                  <option value="">بدون مجموعة</option>
                  {groups
                    .filter(g => !studentGradeId || g.grade_id === studentGradeId)
                    .map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} {group.is_private ? "(خاصة) " : ""}({group.day_of_week} - {formatTimeTo12H(group.time)})
                    </option>
                  ))}
                </select>
              </div>
              
              <Button
                type="submit"
                variant="primary"
                isLoading={actionLoading}
                leftIcon={<Plus size={18} />}
                style={{ width: "100%", marginTop: "1rem" }}
              >
                إضافة الطالب
              </Button>
            </form>
          </div>

          <div className="glass-panel panel-content stat-card" style={{ marginTop: "1.5rem" }}>
            <div className="stat-icon-wrapper" style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>
              <Users size={24} />
            </div>
            <div>
              <div className="stat-value">{filteredStudents.length}</div>
              <div className="stat-label">إجمالي الطلاب في الفلتر الحالي</div>
            </div>
          </div>
        </aside>

        {/* Main Content: Filters & Table */}
        <div className="glass-panel panel-content" style={{ display: "flex", flexDirection: "column", minHeight: "600px" }}>
          
          <div className="action-bar" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            {/* Search */}
            <div style={{ flex: "1 1 300px" }}>
              <Input
                leftIcon={<Search size={18} />}
                placeholder="ابحث بالاسم أو الكود..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter by Grade */}
            <div style={{ flex: "1 1 150px" }}>
              <select
                className="form-input"
                value={filterGradeId}
                onChange={(e) => {
                  setFilterGradeId(e.target.value);
                  setActiveFilter("all"); // Reset group filter
                }}
              >
                <option value="all">كل السنين الدراسية</option>
                {grades.map(grade => (
                  <option key={grade.id} value={grade.id}>{grade.name}</option>
                ))}
              </select>
            </div>

            {/* Filter by Group */}
            <div style={{ flex: "1 1 200px" }}>
              <select
                className="form-input"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
              >
                <option value="all">جميع المجموعات</option>
                <option value="none">بدون مجموعة</option>
                {groups
                  .filter(g => filterGradeId === "all" || g.grade_id === filterGradeId)
                  .map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name} {group.is_private ? "(خاصة)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Action Bar (Shows when items are selected) */}
          {selectedStudentIds.size > 0 && (
            <div style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span style={{ color: "var(--color-danger)", fontWeight: 500 }}>
                تم تحديد {selectedStudentIds.size} طالب
              </span>
              <Button
                variant="danger"
                size="sm"
                onClick={handleBulkDelete}
                isLoading={actionLoading}
              >
                حذف المحدد
              </Button>
            </div>
          )}

          {/* Students Table */}
          <div className="table-container" style={{ flex: 1 }}>
            <table className="students-table">
              <thead>
                <tr>
                  <th style={{ width: "40px", textAlign: "center" }}>
                    <button 
                      onClick={toggleSelectAll} 
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", margin: "0 auto" }}
                      title="تحديد الكل / إلغاء"
                    >
                      {allSelected ? <CheckSquare size={18} className="color-teal" /> : <Square size={18} />}
                    </button>
                  </th>
                  <th style={{ minWidth: "80px", textAlign: "center" }}>الكود</th>
                  <th style={{ minWidth: "200px" }}>الاسم</th>
                  <th style={{ minWidth: "150px", textAlign: "center" }}>المجموعة</th>
                  <th style={{ minWidth: "250px", textAlign: "center" }}>الشهور المدفوعة (١ - ١٢)</th>
                  <th style={{ minWidth: "150px", textAlign: "center" }}>الكتب المستلمة</th>
                  <th style={{ minWidth: "80px", textAlign: "center" }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      <AlertCircle size={48} style={{ opacity: 0.5, marginBottom: "1rem" }} />
                      <p>لا يوجد طلاب حالياً للفلتر المحدد.</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => (
                    <StudentTableRow
                      key={student.id}
                      student={student}
                      groups={groups}
                      arabicMonths={arabicMonths}
                      formatTimeTo12H={formatTimeTo12H}
                      isSelected={selectedStudentIds.has(student.id)}
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
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
