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
  UserPlus
} from "lucide-react";

interface Group {
  id: string;
  name: string;
  day_of_week: string;
  time: string;
  is_private?: boolean;
}

interface Student {
  id: string;
  name: string;
  group_id: string | null;
  months: boolean[];
  book_1: boolean;
  book_2: boolean;
}

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

  // Form state
  const [studentName, setStudentName] = useState("");
  const [studentGroupId, setStudentGroupId] = useState("");

  // Filters state
  const [activeFilter, setActiveFilter] = useState<string>("all"); // 'all', 'none', or group_id
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setUserId(session.user.id);

        // Fetch groups
        const { data: groupsData } = await supabase
          .from("groups")
          .select("*")
          .order("created_at", { ascending: false });
        setGroups(groupsData || []);

        // Fetch students
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
    if (!confirm("هل أنت متأكد من حذف هذا الطالب نهائياً؟")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", studentId);

      if (error) throw error;

      setStudents(students.filter(s => s.id !== studentId));
      showToast("تم حذف الطالب بنجاح.");
    } catch (err: any) {
      showToast(err.message || "فشل حذف الطالب.", "error");
    }
  };

  const handleToggleMonth = async (student: Student, monthIdx: number) => {
    const updatedMonths = [...student.months];
    updatedMonths[monthIdx] = !updatedMonths[monthIdx];

    // Optimistic Update
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

    // Optimistic Update
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

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesGroup = activeFilter === "all" 
      ? true 
      : activeFilter === "none" 
        ? student.group_id === null 
        : student.group_id === activeFilter;
        
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

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
                <label className="form-label" htmlFor="sGroup">المجموعة (اختياري)</label>
                <select
                  id="sGroup"
                  className="form-input"
                  value={studentGroupId}
                  onChange={(e) => setStudentGroupId(e.target.value)}
                  style={{ padding: "0.7rem 0.5rem" }}
                >
                  <option value="">بدون مجموعة</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} {group.is_private ? "(خاصة) " : ""}({group.day_of_week} - {group.time.slice(0, 5)})
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
          <h2 className="panel-title">
            <Users size={18} style={{ color: "var(--color-info)" }} />
            <span>قائمة الطلاب ({filteredStudents.length})</span>
          </h2>

          {/* Group Filter Chips */}
          <div className="chips-container">
            <button 
              className={`chip ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              كل الطلاب
            </button>
            <button 
              className={`chip ${activeFilter === "none" ? "active" : ""}`}
              onClick={() => setActiveFilter("none")}
            >
              بدون مجموعة
            </button>
            {groups.map(group => (
              <button 
                key={group.id}
                className={`chip ${group.is_private ? "private" : ""} ${activeFilter === group.id ? "active" : ""}`}
                onClick={() => setActiveFilter(group.id)}
              >
                <span>{group.name} {group.is_private ? "★ " : ""}({group.day_of_week} {group.time.slice(0, 5)})</span>
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="table-controls">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="بحث سريع باسم الطالب..."
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
              <table className="students-table">
                <thead>
                  <tr>
                    <th>اسم الطالب</th>
                    <th>الشهور المدفوعة (١ - ١٢)</th>
                    <th>الكتب المستلمة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => {
                    const studentGroup = groups.find(g => g.id === student.group_id);
                    return (
                      <tr key={student.id}>
                        <td>
                          <div className="student-name-cell">
                            <span className="student-name">{student.name}</span>
                            {activeFilter === "all" && (
                              <span className={`student-group-badge ${studentGroup?.is_private ? "private" : ""}`}>
                                {studentGroup ? studentGroup.name : "بدون مجموعة"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
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
                        <td>
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
                        <td>
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

      {/* Toast Alert */}
      {toast && (
        <div className={`alert-toast ${toast.type === "success" ? "alert-success" : "alert-error"}`}>
          {toast.type === "error" && <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
