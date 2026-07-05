"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Users, 
  CheckCircle2, 
  BookOpen, 
  Plus, 
  FolderPlus,
  Trash2,
  AlertCircle,
  Calendar,
  Clock
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

const arabicDays = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export default function DashboardOverview() {
  // Loading states
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // App data state
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Form state
  const [groupName, setGroupName] = useState("");
  const [groupDay, setGroupDay] = useState("السبت");
  const [groupTime, setGroupTime] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const currentMonthIndex = new Date().getMonth();
  const currentMonthName = arabicMonths[currentMonthIndex];

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setUserId(session.user.id);

        // Fetch groups
        const { data: groupsData, error: groupsError } = await supabase
          .from("groups")
          .select("*")
          .order("created_at", { ascending: false });

        if (groupsError) throw groupsError;
        setGroups(groupsData || []);

        // Fetch students
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("*")
          .order("created_at", { ascending: false });

        if (studentsError) throw studentsError;

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

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || !groupDay || !groupTime || !userId) {
      showToast("يرجى ملء جميع الحقول المطلوبة.", "error");
      return;
    }

    // Collision Check: Day and Time (1-hour slot interval)
    const timeToMinutes = (timeStr: string) => {
      if (!timeStr) return 0;
      const parts = timeStr.split(":");
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      return hours * 60 + minutes;
    };

    const formatTimeHM = (timeStr: string) => {
      if (!timeStr) return "";
      const parts = timeStr.split(":");
      return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    };

    const targetMinutes = timeToMinutes(groupTime);
    const conflictingGroup = groups.find(g => {
      if (g.day_of_week !== groupDay) return false;
      const existMinutes = timeToMinutes(g.time);
      return Math.abs(targetMinutes - existMinutes) < 60; // Overlaps if difference is less than 60 mins
    });

    if (conflictingGroup) {
      const conflictStart = formatTimeHM(conflictingGroup.time);
      alert(
        `عذراً، لا يمكن إنشاء المجموعة! يوجد تعارض في المواعيد مع مجموعة "${conflictingGroup.name}" المسجلة في نفس اليوم (${groupDay}) الساعة (${conflictStart}). يجب أن يكون الفرق بين مواعيد المجموعات ساعة كاملة على الأقل.`
      );
      return; // Stop execution (Strict block)
    }

    setActionLoading(true);
    try {
      const { data, error } = await supabase
        .from("groups")
        .insert([
          {
            teacher_id: userId,
            name: groupName,
            day_of_week: groupDay,
            time: groupTime,
            is_private: isPrivate
          }
        ])
        .select();

      if (error) throw error;

      setGroups([data[0], ...groups]);
      setGroupName("");
      setGroupTime("");
      setIsPrivate(false);
      showToast("تم إنشاء المجموعة بنجاح.");
    } catch (err: any) {
      showToast(err.message || "فشل إنشاء المجموعة.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المجموعة؟ سيتم إلغاء تعيين طلابها دون حذفهم.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId);

      if (error) throw error;

      setGroups(groups.filter(g => g.id !== groupId));
      setStudents(students.map(s => s.group_id === groupId ? { ...s, group_id: null } : s));
      showToast("تم حذف المجموعة وتحديث بيانات طلابها بنجاح.");
    } catch (err: any) {
      showToast(err.message || "فشل حذف المجموعة.", "error");
    }
  };

  // Dynamic statistics
  const totalStudentsCount = students.length;
  const paidThisMonthCount = students.filter(s => s.months[currentMonthIndex] === true).length;
  const book1Count = students.filter(s => s.book_1 === true).length;
  const book2Count = students.filter(s => s.book_2 === true).length;

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Title */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>لوحة التحكم</h1>
        <p style={{ color: "var(--text-secondary)" }}>نظرة عامة وإدارة المجموعات التعليمية</p>
      </div>

      {/* Statistics Cards */}
      <section className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper stat-icon-blue">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">إجمالي الطلاب</span>
            <span className="stat-value monospace">{totalStudentsCount}</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper stat-icon-teal">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">الاشتراكات المدفوعة ({currentMonthName})</span>
            <span className="stat-value monospace">{paidThisMonthCount}</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper stat-icon-amber">
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">مستلمو كتاب ١</span>
            <span className="stat-value monospace">{book1Count}</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper stat-icon-amber">
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">مستلمو كتاب ٢</span>
            <span className="stat-value monospace">{book2Count}</span>
          </div>
        </div>
      </section>

      {/* Main Layout Grid */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: "350px 1fr" }}>
        {/* Right side: Create Group Form */}
        <aside className="sidebar-panels" style={{ gap: 0 }}>
          <div className="glass-panel panel-content">
            <h2 className="panel-title">
              <FolderPlus size={18} className="stat-icon-blue" style={{ background: "none", border: "none" }} />
              <span>إنشاء مجموعة جديدة</span>
            </h2>
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label className="form-label" htmlFor="gName">اسم المجموعة</label>
                <input
                  id="gName"
                  type="text"
                  required
                  placeholder="مثال: مجموعة أ"
                  className="form-input"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="gDay">اليوم</label>
                  <select
                    id="gDay"
                    className="form-input"
                    value={groupDay}
                    onChange={(e) => setGroupDay(e.target.value)}
                    style={{ padding: "0.7rem 0.5rem" }}
                  >
                    {arabicDays.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="gTime">الوقت</label>
                  <input
                    id="gTime"
                    type="time"
                    required
                    className="form-input"
                    value={groupTime}
                    onChange={(e) => setGroupTime(e.target.value)}
                    style={{ direction: "ltr", textAlign: "right" }}
                  />
                </div>
              </div>
              <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", marginBottom: "1rem" }}>
                <input
                  id="gPrivate"
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "#8b5cf6", cursor: "pointer" }}
                />
                <label className="form-label" htmlFor="gPrivate" style={{ margin: 0, cursor: "pointer" }}>
                  مجموعة خاصة / فردية
                </label>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "0.5rem" }}
                disabled={actionLoading}
              >
                <Plus size={18} />
                <span>{actionLoading ? "جاري الإنشاء..." : "إنشاء مجموعة"}</span>
              </button>
            </form>
          </div>
        </aside>

        {/* Left side: Groups List */}
        <section className="glass-panel panel-content">
          <h2 className="panel-title">
            <Calendar size={18} style={{ color: "var(--color-info)" }} />
            <span>المجموعات الحالية ({groups.length})</span>
          </h2>

          {groups.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={48} className="empty-state-icon" />
              <p>لا توجد أي مجموعات حالياً. أضف أول مجموعة لبدء تنظيم طلابك.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
              {groups.map(group => {
                const groupStudentCount = students.filter(s => s.group_id === group.id).length;
                return (
                  <div key={group.id} className={`glass-panel panel-content ${group.is_private ? "group-card-private" : ""}`} style={{ background: "rgba(255,255,255,0.02)", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <h3 style={{ fontSize: "1.1rem" }}>{group.name}</h3>
                        {group.is_private && <span className="private-badge">خاصة</span>}
                      </div>
                      <button
                        className="btn btn-secondary btn-icon"
                        onClick={() => handleDeleteGroup(group.id)}
                        style={{ border: "none", background: "none", width: "1.75rem", height: "1.75rem" }}
                        title="حذف المجموعة"
                      >
                        <Trash2 size={15} className="color-danger" />
                      </button>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Calendar size={14} />
                        <span>اليوم: {group.day_of_week}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Clock size={14} />
                        <span className="monospace">الوقت: {group.time.slice(0, 5)}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "0.5rem" }}>
                        <Users size={14} style={{ color: "var(--color-teal)" }} />
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>عدد الطلاب: {groupStudentCount} طالب</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
