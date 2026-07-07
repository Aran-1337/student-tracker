"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  AlertCircle,
  X,
  UserPlus,
  CheckSquare,
  Square
} from "lucide-react";

interface Group {
  id: string;
  name: string;
  day_of_week: string;
  time: string;
  is_private?: boolean;
  grade_id?: string | null;
}

interface Grade {
  id: string;
  name: string;
  start_code: number;
}

interface Student {
  id: string;
  name: string;
  code?: string;
  group_id: string | null;
  grade_id?: string | null;
  months: boolean[];
  book_1: boolean;
  book_2: boolean;
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setUserId(session.user.id);

        const { data: groupsData } = await supabase
          .from("groups")
          .select("*")
          .order("created_at", { ascending: false });
        setGroups(groupsData || []);

        const { data: studentsData } = await supabase
          .from("students")
          .select("*")
          .order("created_at", { ascending: false });

        const validatedStudents = (studentsData || []).map(student => ({
          ...student,
          months: Array.isArray(student.months) && student.months.length === 12
            ? student.months 
            : Array(12).fill(false)
        }));
        setStudents(validatedStudents);

        const { data: gradesData } = await supabase
          .from("grades")
          .select("*")
          .order("created_at", { ascending: true });
        setGrades(gradesData || []);
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

    setActionLoading(true);
    try {
      const selectedGroupIdVal = studentGroupId === "" ? null : studentGroupId;
      const initialMonths = Array(12).fill(false);

      const { data, error } = await supabase
        .from("students")
        .insert([
          {
            teacher_id: userId,
            name: studentName,
            group_id: selectedGroupIdVal,
            grade_id: studentGradeId || null,
            months: initialMonths,
            book_1: false,
            book_2: false
          }
        ])
        .select();

      if (error) throw error;

      setStudents([data[0], ...students]);
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
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", studentId);

      if (error) throw error;

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
    const updatedMonths = [...student.months];
    updatedMonths[monthIdx] = !updatedMonths[monthIdx];

    const prevStudents = [...students];
    setStudents(students.map(s => s.id === student.id ? { ...s, months: updatedMonths } : s));

    try {
      const { error } = await supabase
        .from("students")
        .update({ months: updatedMonths })
        .eq("id", student.id);

      if (error) throw error;
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
      const { error } = await supabase
        .from("students")
        .update({ [bookKey]: updatedVal })
        .eq("id", student.id);

      if (error) throw error;
    } catch (err: any) {
      setStudents(prevStudents);
      showToast("حدث خطأ أثناء تعديل حالة الكتاب.", "error");
    }
  };

  const handleChangeGroup = async (student: Student, newGroupId: string) => {
    try {
      const targetGroupId = newGroupId === "" ? null : newGroupId;
      const { error } = await supabase
        .from("students")
        .update({ group_id: targetGroupId })
        .eq("id", student.id);

      if (error) throw error;

      setStudents(students.map(s => s.id === student.id ? { ...s, group_id: targetGroupId } : s));
      showToast(`تم تغيير مجموعة "${student.name}" بنجاح.`);
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
    const matchesGroup = activeFilter === "all" 
      ? true 
      : activeFilter === "none" 
        ? student.group_id === null 
        : student.group_id === activeFilter;
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (student.code && student.code.includes(searchQuery));
    return matchesGroup && matchesSearch;
  });

  const allSelected = filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length;
  const someSelected = selectedStudentIds.size > 0;

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner"></div>
      </div>
    );
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
                <label className="form-label" htmlFor="sName">اسم الطالب</label>
                <input
                  id="sName"
                  type="text"
                  required
                  placeholder="الاسم الكامل للطالب"
                  className="form-input"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="sGrade">السنة الدراسية (اختياري)</label>
                <select
                  id="sGrade"
                  className="form-input"
                  value={studentGradeId}
                  onChange={(e) => {
                    setStudentGradeId(e.target.value);
                    setStudentGroupId(""); // Reset group when grade changes
                  }}
                  style={{ padding: "0.7rem 0.5rem" }}
                >
                  <option value="">-- بدون سنة دراسية --</option>
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
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "0.5rem" }}
                disabled={actionLoading}
              >
                <Plus size={18} />
                <span>{actionLoading ? "جاري الإضافة..." : "إضافة طالب"}</span>
              </button>
            </form>
          </div>
        </aside>

        {/* Left Side: Students List */}
        <section className="glass-panel panel-content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 className="panel-title" style={{ margin: 0 }}>
              <Users size={18} style={{ color: "var(--color-info)" }} />
              <span>قائمة الطلاب ({filteredStudents.length})</span>
            </h2>
          </div>

          {/* Group Filter Chips */}
          <div className="chips-container">
            <button 
              className={`chip ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => { setActiveFilter("all"); setSelectedStudentIds(new Set()); }}
            >
              كل الطلاب
            </button>
            <button 
              className={`chip ${activeFilter === "none" ? "active" : ""}`}
              onClick={() => { setActiveFilter("none"); setSelectedStudentIds(new Set()); }}
            >
              بدون مجموعة
            </button>
            {groups.map(group => (
              <button 
                key={group.id}
                className={`chip ${group.is_private ? "private" : ""} ${activeFilter === group.id ? "active" : ""}`}
                onClick={() => { setActiveFilter(group.id); setSelectedStudentIds(new Set()); }}
              >
                <span>{group.name} {group.is_private ? "★ " : ""}({group.day_of_week} {formatTimeTo12H(group.time)})</span>
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="table-controls">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="بحث سريع باسم الطالب أو الكود..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Students Table */}
          <div className="table-container">
            {filteredStudents.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={48} className="empty-state-icon" />
                <p>لا يوجد طلاب يطابقون خيارات التصفية أو البحث الحالية.</p>
              </div>
            ) : (
              <table className="students-table mobile-card-table">
                <thead>
                  <tr>
                    {/* Select All Checkbox */}
                    <th style={{ width: "40px", textAlign: "center" }}>
                      <button
                        onClick={toggleSelectAll}
                        style={{ background: "none", border: "none", cursor: "pointer", color: allSelected ? "var(--color-teal)" : "var(--text-muted)", display: "flex", alignItems: "center", margin: "0 auto" }}
                        title={allSelected ? "إلغاء تحديد الكل" : "تحديد الكل"}
                      >
                        {allSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </th>
                    <th style={{ width: "40px", textAlign: "center" }}>#</th>
                    <th>الكود</th>
                    <th>اسم الطالب</th>
                    <th>الشهور المدفوعة (١ - ١٢)</th>
                    <th>الكتب المستلمة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => {
                    const studentGroup = groups.find(g => g.id === student.group_id);
                    const isSelected = selectedStudentIds.has(student.id);
                    return (
                      <tr 
                        key={student.id}
                        style={{
                          background: isSelected ? "rgba(20, 184, 166, 0.06)" : undefined,
                          outline: isSelected ? "1px solid rgba(20, 184, 166, 0.2)" : undefined,
                          transition: "background 0.15s ease"
                        }}
                      >
                        {/* Row Checkbox */}
                        <td data-label="تحديد" style={{ textAlign: "center" }}>
                          <button
                            onClick={() => toggleSelectStudent(student.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: isSelected ? "var(--color-teal)" : "var(--text-muted)", display: "flex", alignItems: "center", margin: "0 auto" }}
                          >
                            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                        </td>
                        <td data-label="#" style={{ textAlign: "center", fontWeight: 600, color: "var(--text-muted)" }}>
                          {index + 1}
                        </td>
                        <td data-label="الكود" style={{ fontWeight: 700, color: "var(--color-teal)" }}>
                          {student.code || "-"}
                        </td>
                        <td data-label="اسم الطالب">
                          <div className="student-name-cell">
                            <span className="student-name">{student.name}</span>
                            <select
                              value={student.group_id || ""}
                              onChange={(e) => handleChangeGroup(student, e.target.value)}
                              className={`student-group-badge ${studentGroup?.is_private ? "private" : ""}`}
                              style={{ 
                                background: "rgba(0,0,0,0.2)", 
                                border: "1px solid var(--border-color)", 
                                color: studentGroup?.is_private ? "var(--color-warning)" : "var(--color-teal)",
                                cursor: "pointer",
                                padding: "2px 6px"
                              }}
                            >
                              <option value="" style={{ background: "#0f172a" }}>بدون مجموعة</option>
                              {groups.map(g => (
                                <option key={g.id} value={g.id} style={{ background: "#0f172a" }}>
                                  {g.name} ({g.day_of_week} - {formatTimeTo12H(g.time)})
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td data-label="الشهور المدفوعة (١ - ١٢)">
                          <div className="months-grid">
                            {student.months.map((isPaid, idx) => (
                              <button
                                key={idx}
                                className={`month-toggle ${isPaid ? "paid" : ""}`}
                                onClick={() => handleToggleMonth(student, idx)}
                                title={`${arabicMonths[idx]} (شهر ${idx + 1}) - اضغط للتبديل`}
                              >
                                {idx + 1}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td data-label="الكتب المستلمة">
                          <div className="book-toggles">
                            <button
                              className={`book-toggle ${student.book_1 ? "active" : ""}`}
                              onClick={() => handleToggleBook(student, "book_1")}
                            >
                              {student.book_1 ? "✓ كتاب ١" : "كتاب ١"}
                            </button>
                            <button
                              className={`book-toggle ${student.book_2 ? "active" : ""}`}
                              onClick={() => handleToggleBook(student, "book_2")}
                            >
                              {student.book_2 ? "✓ كتاب ٢" : "كتاب ٢"}
                            </button>
                          </div>
                        </td>
                        <td data-label="إجراءات">
                          <button 
                            className="btn btn-secondary btn-icon"
                            onClick={() => handleDeleteStudent(student.id)}
                            title="حذف الطالب"
                            style={{ border: "none", background: "none" }}
                          >
                            <Trash2 size={16} className="color-danger" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {/* Floating Bulk Action Bar */}
      {someSelected && (
        <div style={{
          position: "fixed",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(15, 23, 42, 0.97)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(20, 184, 166, 0.3)",
          borderRadius: "14px",
          padding: "0.85rem 1.75rem",
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(20,184,166,0.1)",
          zIndex: 100,
          animation: "fadeInUp 0.2s ease"
        }}>
          <span style={{ fontWeight: 600, color: "var(--color-teal)", fontSize: "0.95rem" }}>
            <CheckSquare size={16} style={{ display: "inline", marginLeft: "6px", verticalAlign: "middle" }} />
            تم تحديد {selectedStudentIds.size} طالب
          </span>

          <button
            className="btn btn-danger"
            onClick={handleBulkDelete}
            disabled={actionLoading}
            style={{ padding: "0.5rem 1.25rem", fontSize: "0.9rem" }}
          >
            <Trash2 size={16} />
            <span>{actionLoading ? "جاري الحذف..." : "حذف المحدد"}</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setSelectedStudentIds(new Set())}
            style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
          >
            <X size={16} />
            <span>إلغاء التحديد</span>
          </button>
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div className={`alert-toast ${toast.type === "success" ? "alert-success" : "alert-error"}`}>
          {toast.type === "error" ? <AlertCircle size={18} /> : <CheckSquare size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
