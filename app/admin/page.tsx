"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  Shield, 
  Users, 
  LayoutDashboard, 
  Check, 
  AlertCircle,
  Receipt,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Lock,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface Teacher {
  id: string;
  name: string;
  email: string | null;
  is_admin: boolean;
  is_active: boolean;
  has_bills_feature: boolean;
  subscription_expires_at: string;
  created_at: string;
}

interface Student {
  id: string;
  teacher_id: string;
}

interface Group {
  id: string;
  teacher_id: string;
}

export default function AdminPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Data state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // Editing state (track unsaved changes per teacher)
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function loadAdminData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace("/login");
          return;
        }

        // Verify if admin
        const { data: currentTeacher, error: authError } = await supabase
          .from("teachers")
          .select("is_admin")
          .eq("id", session.user.id)
          .single();

        if (authError || !currentTeacher?.is_admin) {
          showToast("عذراً، هذه الصفحة مخصصة لمدير النظام فقط.", "error");
          setTimeout(() => router.replace("/dashboard"), 1500);
          return;
        }

        setIsAdmin(true);

        // Fetch all teachers
        const { data: teachersData } = await supabase
          .from("teachers")
          .select("*")
          .order("created_at", { ascending: false });

        // Fetch all students
        const { data: studentsData } = await supabase
          .from("students")
          .select("id, teacher_id");

        // Fetch all groups
        const { data: groupsData } = await supabase
          .from("groups")
          .select("id, teacher_id");

        setTeachers(teachersData || []);
        setStudents(studentsData || []);
        setGroups(groupsData || []);

      } catch (err: any) {
        showToast("حدث خطأ أثناء تحميل البيانات الإدارية.", "error");
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, [router]);

  const handleToggleActive = async (teacherId: string, currentStatus: boolean) => {
    setUpdatingId(teacherId);
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from("teachers")
        .update({ is_active: newStatus })
        .eq("id", teacherId);

      if (error) throw error;

      setTeachers(teachers.map(t => t.id === teacherId ? { ...t, is_active: newStatus } : t));
      showToast("تم تحديث حالة تفعيل المعلم بنجاح.");
    } catch (err: any) {
      showToast("حدث خطأ أثناء تحديث حالة التفعيل.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleBills = async (teacherId: string, currentStatus: boolean) => {
    setUpdatingId(teacherId);
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from("teachers")
        .update({ has_bills_feature: newStatus })
        .eq("id", teacherId);

      if (error) throw error;

      setTeachers(teachers.map(t => t.id === teacherId ? { ...t, has_bills_feature: newStatus } : t));
      showToast("تم تحديث صلاحية ميزة الفواتير بنجاح.");
    } catch (err: any) {
      showToast("حدث خطأ أثناء تحديث ميزة الفواتير.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateExpiration = async (teacherId: string, newDateStr: string) => {
    if (!newDateStr) return;
    setUpdatingId(teacherId);
    try {
      const expirationDate = new Date(newDateStr).toISOString();
      const { error } = await supabase
        .from("teachers")
        .update({ subscription_expires_at: expirationDate })
        .eq("id", teacherId);

      if (error) throw error;

      setTeachers(teachers.map(t => t.id === teacherId ? { ...t, subscription_expires_at: expirationDate } : t));
      showToast("تم تحديث تاريخ انتهاء الاشتراك.");
    } catch (err: any) {
      showToast("حدث خطأ أثناء تحديث تاريخ الاشتراك.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="login-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div className="glass-panel panel-content" style={{ maxWidth: "400px", textAlign: "center", padding: "2.5rem" }}>
          <AlertCircle size={48} className="color-danger" style={{ margin: "0 auto 1rem auto" }} />
          <p>جاري التحويل للوحة التحكم الخاصة بك...</p>
        </div>
      </div>
    );
  }

  // Admin stats
  const totalTeachers = teachers.length;
  const totalStudents = students.length;
  const totalGroups = groups.length;

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>لوحة المدير العام للمنصة (SaaS)</h1>
            <span className="private-badge" style={{ background: "rgba(139, 92, 246, 0.2)", color: "#c084fc", border: "1px solid rgba(139, 92, 246, 0.3)" }}>
              <Shield size={14} style={{ marginLeft: "4px" }} />
              مدير النظام
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)" }}>إدارة حسابات الأساتذة، الاشتراكات السنوية، وصلاحيات الميزات</p>
        </div>
        
        <Link href="/dashboard" className="btn btn-secondary">
          <ArrowRight size={16} />
          <span>العودة للوحة المعلم</span>
        </Link>
      </div>

      {/* Admin Stats Grid */}
      <section className="stats-grid" style={{ marginBottom: "2.5rem" }}>
        <div className="stat-card glass-panel" style={{ borderLeft: "4px solid #8b5cf6" }}>
          <div className="stat-icon-wrapper" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#a78bfa", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
            <Shield size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label" style={{ color: "#c084fc" }}>إجمالي الأساتذة</span>
            <span className="stat-value monospace">{totalTeachers}</span>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ borderLeft: "4px solid var(--color-teal)" }}>
          <div className="stat-icon-wrapper stat-icon-teal">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">إجمالي الطلاب بالمنصة</span>
            <span className="stat-value monospace">{totalStudents}</span>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ borderLeft: "4px solid var(--color-info)" }}>
          <div className="stat-icon-wrapper" style={{ background: "rgba(14, 165, 233, 0.15)", color: "#38bdf8", border: "1px solid rgba(14, 165, 233, 0.2)" }}>
            <LayoutDashboard size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">إجمالي المجموعات</span>
            <span className="stat-value monospace">{totalGroups}</span>
          </div>
        </div>
      </section>

      {/* Teachers Management Table */}
      <section className="glass-panel panel-content">
        <h2 className="panel-title">
          <Shield size={18} style={{ color: "#a78bfa" }} />
          <span>إدارة حسابات واشتراكات المعلمين</span>
        </h2>

        <div className="table-container" style={{ marginTop: "1.5rem" }}>
          <table className="report-table">
            <thead>
              <tr>
                <th>المعلم والبريد</th>
                <th>تاريخ التسجيل</th>
                <th>إحصائيات الطلاب</th>
                <th>ميزة الفواتير</th>
                <th>حالة الاشتراك</th>
                <th>تاريخ انتهاء الاشتراك</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(teacher => {
                const teacherStudentsCount = students.filter(s => s.teacher_id === teacher.id).length;
                const teacherGroupsCount = groups.filter(g => g.teacher_id === teacher.id).length;
                
                const regDate = new Date(teacher.created_at).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                });

                const formattedExpiry = teacher.subscription_expires_at 
                  ? new Date(teacher.subscription_expires_at).toISOString().split("T")[0]
                  : "";

                const isExpired = teacher.subscription_expires_at 
                  ? new Date(teacher.subscription_expires_at) < new Date()
                  : false;

                const isUpdating = updatingId === teacher.id;

                return (
                  <tr key={teacher.id} style={{ opacity: isUpdating ? 0.6 : 1, transition: "opacity 0.2s" }}>
                    {/* Name & Email */}
                    <td>
                      <div>
                        <div style={{ fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {teacher.name}
                          {teacher.is_admin && <span className="private-badge" style={{ fontSize: "0.65rem", padding: "1px 6px" }}>مدير</span>}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }} className="monospace">
                          {teacher.email || "لا يوجد بريد مسجل"}
                        </div>
                      </div>
                    </td>

                    {/* Registration Date */}
                    <td style={{ fontSize: "0.9rem" }}>{regDate}</td>

                    {/* Stats */}
                    <td>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        <p style={{ display: "inline-block", marginRight: "1rem" }}>
                          طلاب: <strong className="monospace" style={{ color: "var(--color-teal)" }}>{teacherStudentsCount}</strong>
                        </p>
                        <p style={{ display: "inline-block" }}>
                          مجموعات: <strong className="monospace" style={{ color: "var(--color-info)" }}>{teacherGroupsCount}</strong>
                        </p>
                      </div>
                    </td>

                    {/* Bills Feature Toggle */}
                    <td>
                      <button
                        className="btn-icon"
                        onClick={() => handleToggleBills(teacher.id, teacher.has_bills_feature)}
                        disabled={isUpdating}
                        style={{ background: "none", border: "none", color: teacher.has_bills_feature ? "var(--color-teal)" : "var(--text-muted)", cursor: "pointer" }}
                        title={teacher.has_bills_feature ? "تعطيل ميزة الفواتير" : "تفعيل ميزة الفواتير"}
                      >
                        {teacher.has_bills_feature ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <ToggleRight size={32} />
                            <span style={{ fontSize: "0.8rem" }}>مفعلة</span>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <ToggleLeft size={32} />
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>معطلة</span>
                          </div>
                        )}
                      </button>
                    </td>

                    {/* Subscription Status Toggle */}
                    <td>
                      <button
                        onClick={() => handleToggleActive(teacher.id, teacher.is_active)}
                        disabled={isUpdating}
                        style={{
                          background: "none",
                          border: "none",
                          color: (teacher.is_active && !isExpired) ? "#10b981" : "#ef4444",
                          cursor: "pointer"
                        }}
                        title={teacher.is_active ? "تعطيل الاشتراك" : "تفعيل الاشتراك"}
                      >
                        {teacher.is_active && !isExpired ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <ToggleRight size={32} />
                            <span style={{ fontSize: "0.8rem" }}>نشط</span>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <ToggleLeft size={32} />
                            <span style={{ fontSize: "0.8rem", color: "#ef4444" }}>
                              {isExpired ? "منتهي" : "معطل"}
                            </span>
                          </div>
                        )}
                      </button>
                    </td>

                    {/* Expiration Date Editor */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Calendar size={14} style={{ color: isExpired ? "#ef4444" : "var(--text-muted)" }} />
                        <input
                          type="date"
                          className="search-input"
                          value={formattedExpiry}
                          disabled={isUpdating}
                          onChange={(e) => handleUpdateExpiration(teacher.id, e.target.value)}
                          style={{
                            padding: "4px 8px",
                            fontSize: "0.85rem",
                            border: isExpired ? "1px solid rgba(239,68,68,0.4)" : "1px solid var(--border-color)",
                            background: "rgba(0,0,0,0.2)",
                            color: isExpired ? "#f87171" : "#ffffff",
                            borderRadius: "4px",
                            width: "135px"
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Toast Alert */}
      {toast && (
        <div className={`alert-toast ${toast.type === "success" ? "alert-success" : "alert-error"}`}>
          {toast.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
