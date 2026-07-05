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
  ArrowRight,
  UserPlus,
  Trash2,
  Mail,
  Package
} from "lucide-react";
import Link from "next/link";

interface Teacher {
  id: string;
  name: string;
  email: string | null;
  is_admin: boolean;
  is_active: boolean;
  has_bills_feature: boolean;
  has_attendance_feature: boolean;
  plan_id: string | null;
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

interface AdminEmail {
  id: string;
  email: string;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_months: number;
  has_bills: boolean;
  has_attendance: boolean;
  color: string;
}

export default function AdminPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Data state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [adminEmails, setAdminEmails] = useState<AdminEmail[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  // Form state
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
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

        // Fetch authorized admin email addresses
        const { data: adminsData } = await supabase
          .from("admins")
          .select("*")
          .order("created_at", { ascending: false });

        // Fetch plans
        const { data: plansData } = await supabase
          .from("plans")
          .select("id, name, price, duration_months, has_bills, has_attendance, color")
          .eq("is_active", true)
          .order("price");

        setTeachers(teachersData || []);
        setStudents(studentsData || []);
        setGroups(groupsData || []);
        setAdminEmails(adminsData || []);
        setPlans(plansData || []);

      } catch (err: any) {
        showToast("حدث خطأ أثناء تحميل البيانات الإدارية.", "error");
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, [router]);

  const handleAddAdminEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    setActionLoading(true);
    try {
      const emailInput = newAdminEmail.trim().toLowerCase();

      // Check if already exists in list
      if (adminEmails.find(a => a.email === emailInput)) {
        throw new Error("هذا البريد الإلكتروني مسجل بالفعل كمسؤول.");
      }

      const { data, error } = await supabase
        .from("admins")
        .insert([{ email: emailInput }])
        .select();

      if (error) throw error;

      setAdminEmails([data[0], ...adminEmails]);
      setNewAdminEmail("");
      showToast("تمت إضافة بريد المسؤول بنجاح وسيتلقى صلاحيات الإدارة عند تسجيل دخوله.");
      
      // Refresh teachers list to reflect the automatic trigger change
      const { data: teachersData } = await supabase
        .from("teachers")
        .select("*")
        .order("created_at", { ascending: false });
      setTeachers(teachersData || []);

    } catch (err: any) {
      showToast(err.message || "فشل تسجيل بريد المسؤول.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAdminEmail = async (adminId: string, email: string) => {
    if (email === "3bdeniovlr@gmail.com") {
      showToast("لا يمكن إلغاء صلاحيات المسؤول الرئيسي للنظام!", "error");
      return;
    }

    if (!confirm(`هل أنت متأكد من إلغاء صلاحيات الإدارة عن البريد: ${email}؟`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("admins")
        .delete()
        .eq("id", adminId);

      if (error) throw error;

      setAdminEmails(adminEmails.filter(a => a.id !== adminId));
      showToast("تم إلغاء بريد المسؤول وسحب صلاحيات الإدارة بنجاح.");

      // Refresh teachers list to reflect the automatic trigger change
      const { data: teachersData } = await supabase
        .from("teachers")
        .select("*")
        .order("created_at", { ascending: false });
      setTeachers(teachersData || []);

    } catch (err: any) {
      showToast(err.message || "فشل إلغاء بريد المسؤول.", "error");
    }
  };

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

  const handleToggleAttendance = async (teacherId: string, currentStatus: boolean) => {
    setUpdatingId(teacherId);
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from("teachers")
        .update({ has_attendance_feature: newStatus })
        .eq("id", teacherId);

      if (error) throw error;

      setTeachers(teachers.map(t => t.id === teacherId ? { ...t, has_attendance_feature: newStatus } : t));
      showToast("تم تحديث ميزة الحضور والغياب بنجاح.");
    } catch (err: any) {
      showToast("حدث خطأ أثناء تحديث ميزة الحضور.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignPlan = async (teacher: Teacher, planId: string) => {
    setUpdatingId(teacher.id);
    try {
      if (planId === "") {
        // Remove plan
        const { error } = await supabase
          .from("teachers")
          .update({ plan_id: null })
          .eq("id", teacher.id);
        if (error) throw error;
        setTeachers(teachers.map(t => t.id === teacher.id ? { ...t, plan_id: null } : t));
        showToast("تم إلغاء تعيين الباقة.");
        return;
      }
      const plan = plans.find(p => p.id === planId);
      if (!plan) return;
      // Calculate new expiry
      const newExpiry = new Date();
      newExpiry.setMonth(newExpiry.getMonth() + plan.duration_months);
      // Apply plan features to teacher
      const { error } = await supabase
        .from("teachers")
        .update({
          plan_id: plan.id,
          has_bills_feature: plan.has_bills,
          has_attendance_feature: plan.has_attendance,
          is_active: true,
          subscription_expires_at: newExpiry.toISOString()
        })
        .eq("id", teacher.id);
      if (error) throw error;
      setTeachers(teachers.map(t => t.id === teacher.id ? {
        ...t,
        plan_id: plan.id,
        has_bills_feature: plan.has_bills,
        has_attendance_feature: plan.has_attendance,
        is_active: true,
        subscription_expires_at: newExpiry.toISOString()
      } : t));
      showToast(`✓ تم تعيين باقة "${plan.name}" لـ ${teacher.name} وتفعيل كل مميزاتها تلقائياً.`);
    } catch (err: any) {
      showToast(err.message || "فشل تعيين الباقة", "error");
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

  const handleDeleteTeacher = async (teacher: Teacher) => {
    // Protect the master admin account
    if (teacher.email === "3bdeniovlr@gmail.com") {
      showToast("لا يمكن حذف حساب المسؤول الرئيسي للنظام!", "error");
      return;
    }

    const confirmed = confirm(
      `تحذير: سيتم حذف حساب المعلم "${teacher.name}" وكل بياناته (طلابه، مجموعاته، فواتيره) نهائياً. هذا الإجراء لا يمكن التراجع عنه.\n\nهل أنت متأكد تماماً؟`
    );
    if (!confirmed) return;

    setUpdatingId(teacher.id);
    try {
      // Deleting from teachers cascades to groups, students, bills via FK
      const { error } = await supabase
        .from("teachers")
        .delete()
        .eq("id", teacher.id);

      if (error) throw error;

      setTeachers(teachers.filter(t => t.id !== teacher.id));
      setStudents(students.filter(s => s.teacher_id !== teacher.id));
      setGroups(groups.filter(g => g.teacher_id !== teacher.id));
      showToast(`✓ تم حذف حساب ${teacher.name} وكل بياناته بنجاح.`);
    } catch (err: any) {
      showToast(err.message || "فشل حذف المعلم.", "error");
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
          <p style={{ color: "var(--text-secondary)" }}>إدارة حسابات الأساتذة، الاشتراكات السنوية، والتحكم بصلاحيات ومسؤولي النظام</p>
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

      {/* Dashboard Grid split */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: "350px 1fr" }}>
        
        {/* Right side: Manage Admin Emails */}
        <aside className="sidebar-panels" style={{ gap: 0 }}>
          <div className="glass-panel panel-content">
            <h2 className="panel-title">
              <Shield size={18} className="stat-icon-amber" style={{ background: "none", border: "none", color: "#a78bfa" }} />
              <span>ترخيص مسؤولي النظام (Admins)</span>
            </h2>

            {/* Add Admin Email Form */}
            <form onSubmit={handleAddAdminEmail} style={{ marginBottom: "1.5rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="aEmail">البريد الإلكتروني للترخيص</label>
                <div className="search-input-wrapper" style={{ flex: "none" }}>
                  <Mail className="search-icon" size={18} />
                  <input
                    id="aEmail"
                    type="email"
                    required
                    placeholder="email@example.com"
                    className="search-input"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    style={{ direction: "ltr", textAlign: "right" }}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "0.5rem" }}
                disabled={actionLoading}
              >
                <UserPlus size={18} />
                <span>{actionLoading ? "جاري الترخيص..." : "ترخيص كمسؤول"}</span>
              </button>
            </form>

            {/* List of Admin Emails */}
            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.75rem", fontWeight: 600 }}>المسؤولون المرخصون حالياً:</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {adminEmails.map(admin => (
                  <div 
                    key={admin.id} 
                    style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center", 
                      background: "rgba(255,255,255,0.02)", 
                      padding: "8px 12px", 
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)"
                    }}
                  >
                    <span className="monospace" style={{ fontSize: "0.85rem", wordBreak: "break-all" }}>{admin.email}</span>
                    {admin.email !== "3bdeniovlr@gmail.com" ? (
                      <button
                        className="btn-icon"
                        onClick={() => handleDeleteAdminEmail(admin.id, admin.email)}
                        style={{ border: "none", background: "none", cursor: "pointer" }}
                        title="إلغاء صلاحية المسؤول"
                      >
                        <Trash2 size={14} className="color-danger" />
                      </button>
                    ) : (
                      <span className="private-badge" style={{ fontSize: "0.6rem", padding: "1px 4px" }}>الرئيسي</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Left Side: Teachers Management Table */}
        <section className="glass-panel panel-content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="panel-title" style={{ margin: 0, border: "none", paddingBottom: 0 }}>
              <Users size={18} style={{ color: "var(--color-info)" }} />
              <span>إدارة حسابات واشتراكات المعلمين</span>
            </h2>
            <Link href="/admin/plans" className="btn btn-secondary" style={{ fontSize: "0.85rem", gap: "0.4rem" }}>
              <Package size={15} />
              <span>إدارة الباقات</span>
            </Link>
          </div>

          <div className="table-container" style={{ marginTop: "1.5rem" }}>
            <table className="report-table">
              <thead>
                <tr>
                  <th>المعلم والبريد</th>
                  <th>تاريخ التسجيل</th>
                  <th>إحصائيات الطلاب</th>
                  <th style={{ color: "var(--color-teal)" }}>الباقة</th>
                  <th>ميزة الفواتير</th>
                  <th>ميزة الحضور</th>
                  <th>حالة الاشتراك</th>
                  <th>تاريخ انتهاء الاشتراك</th>
                  <th style={{ color: "#f87171" }}>حذف</th>
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

                      {/* Plan Assignment */}
                      <td>
                        {plans.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <select
                              value={teacher.plan_id || ""}
                              disabled={isUpdating}
                              onChange={e => handleAssignPlan(teacher, e.target.value)}
                              style={{
                                background: "rgba(0,0,0,0.25)",
                                border: teacher.plan_id
                                  ? `1px solid ${plans.find(p => p.id === teacher.plan_id)?.color || "var(--border-color)"}`
                                  : "1px solid var(--border-color)",
                                borderRadius: "8px",
                                color: teacher.plan_id
                                  ? (plans.find(p => p.id === teacher.plan_id)?.color || "#fff")
                                  : "var(--text-muted)",
                                fontSize: "0.82rem",
                                fontWeight: 600,
                                padding: "0.4rem 0.6rem",
                                cursor: "pointer",
                                minWidth: "130px"
                              }}
                            >
                              <option value="">— بدون باقة —</option>
                              {plans.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.price}ج)
                                </option>
                              ))}
                            </select>
                            {teacher.plan_id && (
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                يفعّل كل مميزات الباقة تلقائياً
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>لا توجد باقات</span>
                        )}
                      </td>

                      {/* Bills Feature Toggle */}
                      <td>
                        <button
                          className="toggle-button"
                          onClick={() => handleToggleBills(teacher.id, teacher.has_bills_feature)}
                          disabled={isUpdating}
                          style={{ color: teacher.has_bills_feature ? "var(--color-teal)" : "var(--text-muted)" }}
                          title={teacher.has_bills_feature ? "تعطيل ميزة الفواتير" : "تفعيل ميزة الفواتير"}
                        >
                          {teacher.has_bills_feature ? (
                            <>
                              <ToggleRight size={38} />
                              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>مفعلة</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={38} />
                              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>معطلة</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Attendance Feature Toggle */}
                      <td>
                        <button
                          className="toggle-button"
                          onClick={() => handleToggleAttendance(teacher.id, teacher.has_attendance_feature ?? true)}
                          disabled={isUpdating}
                          style={{ color: (teacher.has_attendance_feature ?? true) ? "var(--color-teal)" : "var(--text-muted)" }}
                          title={(teacher.has_attendance_feature ?? true) ? "تعطيل ميزة الحضور" : "تفعيل ميزة الحضور"}
                        >
                          {(teacher.has_attendance_feature ?? true) ? (
                            <>
                              <ToggleRight size={38} />
                              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>مفعلة</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={38} />
                              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>معطلة</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Subscription Status Toggle */}
                      <td>
                        <button
                          className="toggle-button"
                          onClick={() => handleToggleActive(teacher.id, teacher.is_active)}
                          disabled={isUpdating}
                          style={{ color: (teacher.is_active && !isExpired) ? "#10b981" : "#ef4444" }}
                          title={teacher.is_active ? "تعطيل الاشتراك" : "تفعيل الاشتراك"}
                        >
                          {teacher.is_active && !isExpired ? (
                            <>
                              <ToggleRight size={38} />
                              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>نشط</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={38} />
                              <span style={{ fontSize: "0.85rem", color: "#ef4444", fontWeight: 600 }}>
                                {isExpired ? "منتهي" : "معطل"}
                              </span>
                            </>
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

                      {/* Delete Teacher */}
                      <td>
                        {teacher.email !== "3bdeniovlr@gmail.com" ? (
                          <button
                            className="btn btn-secondary btn-icon"
                            onClick={() => handleDeleteTeacher(teacher)}
                            disabled={isUpdating}
                            title="حذف حساب المعلم وكل بياناته"
                            style={{ border: "none", background: "none" }}
                          >
                            <Trash2 size={16} className="color-danger" />
                          </button>
                        ) : (
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>محمي</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

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
