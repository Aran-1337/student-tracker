"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { SystemSettingsService, SystemSettings } from "@/lib/services/systemSettingsService";
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
  Package,
  X,
  Settings,
  Phone,
  ChevronDown
} from "lucide-react";
import Link from "next/link";

interface Teacher {
  id: string;
  name: string;
  email: string | null;
  phone?: string | null;
  is_admin: boolean;
  is_active: boolean;
  has_bills_feature: boolean;
  has_attendance_feature: boolean;
  is_center_mode?: boolean;
  plan_id: string | null;
  subscription_started_at?: string;
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
  has_center_mode?: boolean;
  color: string;
  is_active: boolean;
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
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({ site_name: "إدارة السناتر والمعلمين", site_logo: "" });

  // Form state
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [featureModalTeacher, setFeatureModalTeacher] = useState<Teacher | null>(null);
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);

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

        // Load plans from Supabase
        const { data: plansData } = await supabase.from("plans").select("*");
        setPlans(plansData || []);
        
        // Load System Settings
        const sysSettings = await SystemSettingsService.getSettings();
        if (sysSettings) {
          setSystemSettings(sysSettings);
        }

        // No local mapping needed, just use teachersData directly
        const mappedTeachers = (teachersData || []).map(t => {
          return {
            ...t,
            plan_id: t.plan_id || null,
            has_bills_feature: t.has_bills_feature,
            has_attendance_feature: t.has_attendance_feature,
            is_center_mode: t.is_center_mode,
            subscription_started_at: t.subscription_started_at,
            subscription_expires_at: t.subscription_expires_at
          };
        });

        setTeachers(mappedTeachers);
        setStudents(studentsData || []);
        setGroups(groupsData || []);
        setAdminEmails(adminsData || []);

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
      showToast(err.message || "فشل تسجيل البريد الجديد", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await SystemSettingsService.updateSettings(systemSettings);
      showToast("تم تحديث إعدادات المنصة بنجاح!");
    } catch (err: any) {
      showToast("فشل تحديث الإعدادات", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      showToast("حجم الصورة يجب ألا يتجاوز 500 كيلوبايت", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setSystemSettings({ ...systemSettings, site_logo: base64String });
    };
    reader.readAsDataURL(file);
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 200 * 1024) {
      showToast("حجم أيقونة المتصفح يجب ألا يتجاوز 200 كيلوبايت", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setSystemSettings({ ...systemSettings, site_favicon: base64String });
    };
    reader.readAsDataURL(file);
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
      const { error } = await supabase.from("teachers").update({ has_bills_feature: newStatus }).eq("id", teacherId);
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
      const { error } = await supabase.from("teachers").update({ has_attendance_feature: newStatus }).eq("id", teacherId);
      if (error) throw error;

      setTeachers(teachers.map(t => t.id === teacherId ? { ...t, has_attendance_feature: newStatus } : t));
      showToast("تم تحديث ميزة الحضور والغياب بنجاح.");
    } catch (err: any) {
      showToast("حدث خطأ أثناء تحديث ميزة الحضور.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleCenterMode = async (teacherId: string, currentStatus: boolean) => {
    setUpdatingId(teacherId);
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase.from("teachers").update({ is_center_mode: newStatus }).eq("id", teacherId);
      if (error) throw error;

      setTeachers(teachers.map(t => t.id === teacherId ? { ...t, is_center_mode: newStatus } : t));
      showToast("تم تحديث نظام السنتر بنجاح.");
    } catch (err: any) {
      showToast("حدث خطأ أثناء تحديث ميزة السنتر.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignPlan = async (teacher: Teacher, planId: string) => {
    setUpdatingId(teacher.id);
    try {
      if (planId === "") {
        const { error } = await supabase.from("teachers").update({ plan_id: null }).eq("id", teacher.id);
        if (error) throw error;

        setTeachers(teachers.map(t => t.id === teacher.id ? { ...t, plan_id: null } : t));
        showToast("تم إلغاء تعيين الباقة.");
        return;
      }
      const plan = plans.find((p: any) => p.id === planId);
      if (!plan) return;
      const newExpiry = new Date();
      newExpiry.setMonth(newExpiry.getMonth() + plan.duration_months);
      
      const updates = { 
        is_active: true,
        plan_id: plan.id,
        has_bills_feature: plan.has_bills,
        has_attendance_feature: plan.has_attendance,
        is_center_mode: plan.has_center_mode || false,
        subscription_started_at: new Date().toISOString(),
        subscription_expires_at: newExpiry.toISOString()
      };
      
      const { error } = await supabase.from("teachers").update(updates).eq("id", teacher.id);
      if (error) throw error;

      setTeachers(teachers.map(t => t.id === teacher.id ? { 
        ...t, 
        ...updates
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
      const { error } = await supabase.from("teachers").update({ subscription_expires_at: expirationDate }).eq("id", teacherId);
      if (error) throw error;

      setTeachers(teachers.map(t => t.id === teacherId ? { ...t, subscription_expires_at: expirationDate } : t));
      showToast("تم تحديث تاريخ انتهاء الاشتراك بنجاح.");
    } catch (err: any) {
      showToast("حدث خطأ أثناء تحديث التاريخ.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateStartDate = async (teacherId: string, newDateStr: string) => {
    if (!newDateStr) return;
    setUpdatingId(teacherId);
    try {
      const startDate = new Date(newDateStr).toISOString();
      const { error } = await supabase.from("teachers").update({ subscription_started_at: startDate }).eq("id", teacherId);
      if (error) throw error;

      setTeachers(teachers.map(t => t.id === teacherId ? { ...t, subscription_started_at: startDate } : t));
      showToast("تم تحديث تاريخ بداية الاشتراك بنجاح.");
    } catch (err: any) {
      showToast("حدث خطأ أثناء تحديث التاريخ.", "error");
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
      // Call the secure backend API to delete the user from auth.users (which cascades to teachers)
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ targetUserId: teacher.id })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to delete user");
      }

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

          {/* System Settings Panel */}
          <div className="glass-panel panel-content" style={{ marginTop: "1.5rem" }}>
            <h2 className="panel-title">
              <Settings size={18} className="stat-icon-teal" style={{ background: "none", border: "none" }} />
              <span>إعدادات المنصة العامة</span>
            </h2>

            <form onSubmit={handleUpdateSystemSettings}>
              <div className="form-group">
                <label className="form-label" htmlFor="siteName">اسم المنصة (يظهر في تابة المتصفح)</label>
                <input
                  id="siteName"
                  type="text"
                  required
                  placeholder="الاسم الكامل (مثال: منصة الطالب للتعليم)"
                  className="search-input"
                  dir="auto"
                  value={systemSettings.site_name}
                  onChange={(e) => setSystemSettings({ ...systemSettings, site_name: e.target.value })}
                />
              </div>

              {!systemSettings.hide_sidebar_name && (
                <div className="form-group" style={{ marginTop: "1rem" }}>
                  <label className="form-label" htmlFor="sidebarName">الاسم في القائمة الجانبية (يُفضل أن يكون قصيراً)</label>
                  <input
                    id="sidebarName"
                    type="text"
                    placeholder="سيتم استخدام الاسم الكامل إذا تُرك فارغاً"
                    className="search-input"
                    dir="auto"
                    value={systemSettings.sidebar_name || ""}
                    onChange={(e) => setSystemSettings({ ...systemSettings, sidebar_name: e.target.value })}
                  />
                </div>
              )}

              <div className="form-group" style={{ marginTop: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer", color: "var(--text-secondary)" }}>
                  <input 
                    type="checkbox" 
                    checked={systemSettings.hide_sidebar_name || false}
                    onChange={(e) => setSystemSettings({ ...systemSettings, hide_sidebar_name: e.target.checked })}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  إخفاء الاسم من القائمة الجانبية (للاكتفاء باللوجو كبانر)
                </label>
              </div>

              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label className="form-label">لوجو المنصة</label>
                
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                  {systemSettings.site_logo && (
                    <img 
                      src={systemSettings.site_logo} 
                      alt="Logo Preview" 
                      style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover", flexShrink: 0, border: "1px solid var(--border-color)" }} 
                    />
                  )}
                  <label htmlFor="siteLogoFile" className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", cursor: "pointer" }}>
                    رفع صورة من الجهاز
                  </label>
                  <input
                    id="siteLogoFile"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: "none" }}
                  />
                </div>
                
                <input
                  type="text"
                  placeholder="أو ضع رابط URL للصورة هنا"
                  className="search-input"
                  value={systemSettings.site_logo}
                  onChange={(e) => setSystemSettings({ ...systemSettings, site_logo: e.target.value })}
                  style={{ direction: "ltr", textAlign: "right" }}
                />
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  اترك الحقل فارغاً لاستخدام الأيقونة الافتراضية. الحجم الأقصى للرفع 500 كيلوبايت.
                </p>
              </div>

              <div className="form-group" style={{ marginTop: "1.5rem" }}>
                <label className="form-label">أيقونة المتصفح (Favicon)</label>
                
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                  {systemSettings.site_favicon && (
                    <img 
                      src={systemSettings.site_favicon} 
                      alt="Favicon Preview" 
                      style={{ width: "32px", height: "32px", borderRadius: "4px", objectFit: "cover", flexShrink: 0, border: "1px solid var(--border-color)", background: "#fff" }} 
                    />
                  )}
                  <label htmlFor="siteFaviconFile" className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", cursor: "pointer" }}>
                    رفع أيقونة مربعة (للتابة)
                  </label>
                  <input
                    id="siteFaviconFile"
                    type="file"
                    accept="image/*"
                    onChange={handleFaviconUpload}
                    style={{ display: "none" }}
                  />
                </div>
                
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem", lineHeight: "1.5" }}>
                  هذه الأيقونة ستظهر بالأعلى في تابة المتصفح. يُفضل رفع صورة مربعة (مثال: 512x512 بيكسل) بدون تفاصيل كثيرة لتكون واضحة. الحجم الأقصى 200 كيلوبايت.
                </p>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "1rem" }}
                disabled={actionLoading}
              >
                <Check size={18} />
                <span>{actionLoading ? "جاري الحفظ..." : "حفظ الإعدادات"}</span>
              </button>
            </form>
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
                  <th>إحصائيات المجموعات والطلاب</th>
                  <th>المميزات</th>
                  <th>حالة الاشتراك</th>
                  <th>تاريخ بداية الاشتراك</th>
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

                  const formattedStart = teacher.subscription_started_at 
                    ? new Date(teacher.subscription_started_at).toISOString().split("T")[0]
                    : "";

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
                            {teacher.phone && (
                              <a 
                                href={`https://wa.me/${teacher.phone.replace(/[^0-9]/g, '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                title={`التواصل عبر واتساب: ${teacher.phone}`}
                                style={{ 
                                  display: "flex", 
                                  alignItems: "center", 
                                  justifyContent: "center",
                                  width: "24px", 
                                  height: "24px", 
                                  borderRadius: "50%", 
                                  background: "rgba(20, 184, 166, 0.15)", 
                                  color: "var(--color-teal)",
                                  transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "var(--color-teal)";
                                  e.currentTarget.style.color = "#000";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "rgba(20, 184, 166, 0.15)";
                                  e.currentTarget.style.color = "var(--color-teal)";
                                }}
                              >
                                <Phone size={12} />
                              </a>
                            )}
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
                            مجموعات: <strong className="monospace" style={{ color: "var(--color-info)" }}>{teacherGroupsCount}</strong>
                          </p>
                          <p style={{ display: "inline-block" }}>
                            طلاب: <strong className="monospace" style={{ color: "var(--color-teal)" }}>{teacherStudentsCount}</strong>
                          </p>
                        </div>
                      </td>

                      {/* Features Button */}
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
                          onClick={() => setFeatureModalTeacher(teacher)}
                          disabled={isUpdating}
                        >
                          <Settings size={14} style={{ marginLeft: "4px" }} />
                          المميزات
                        </button>
                      </td>

                      {/* Subscription Status Toggle */}
                      <td>
                        <button
                          className="toggle-button"
                          onClick={() => handleToggleActive(teacher.id, teacher.is_active)}
                          disabled={isUpdating}
                          style={{ color: (!teacher.is_active && !teacher.subscription_started_at) ? "#f59e0b" : ((teacher.is_active && !isExpired) ? "#10b981" : "#ef4444") }}
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
                              <span style={{ fontSize: "0.85rem", color: (!teacher.is_active && !teacher.subscription_started_at) ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>
                                {(!teacher.is_active && !teacher.subscription_started_at) ? "مراجعة" : (isExpired ? "منتهي" : "معطل")}
                              </span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Start Date Editor */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Calendar size={14} style={{ color: "var(--text-muted)" }} />
                          <input
                            type="date"
                            className="search-input"
                            value={formattedStart}
                            disabled={isUpdating}
                            onChange={(e) => handleUpdateStartDate(teacher.id, e.target.value)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.85rem",
                              border: "1px solid var(--border-color)",
                              background: "rgba(0,0,0,0.2)",
                              color: "#ffffff",
                              borderRadius: "4px",
                              width: "135px"
                            }}
                          />
                        </div>
                      </td>

                      {/* Expiration Date Editor */}
                      <td>
                        {teacher.email === "3bdeniovlr@gmail.com" ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                            <span className="private-badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "4px 8px", fontSize: "0.8rem" }}>
                              مدى الحياة
                            </span>
                          </div>
                        ) : (
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
                        )}
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

      {/* Features Modal */}
      {featureModalTeacher && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center",
          alignItems: "center", zIndex: 1000, padding: "1rem", backdropFilter: "blur(4px)"
        }}>
          <div className="glass-panel panel-content" style={{ width: "100%", maxWidth: "500px", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Settings size={20} style={{ color: "var(--color-teal)" }} />
                صلاحيات ومميزات ({featureModalTeacher.name})
              </h2>
              <button 
                onClick={() => setFeatureModalTeacher(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
              {/* Plan Assignment */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", marginBottom: "4px", color: "var(--color-teal)" }}>تخصيص الباقة</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>اختيار الباقة سيقوم بتفعيل مميزاتها تلقائياً.</p>
                </div>
                <div>
                  {plans.length > 0 ? (
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => !updatingId && setIsPlanDropdownOpen(!isPlanDropdownOpen)}
                        disabled={updatingId === featureModalTeacher.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "rgba(0,0,0,0.25)",
                          border: featureModalTeacher.plan_id
                            ? `1px solid ${plans.find(p => p.id === featureModalTeacher.plan_id)?.color || "var(--border-color)"}`
                            : "1px solid var(--border-color)",
                          borderRadius: "8px",
                          color: featureModalTeacher.plan_id
                            ? (plans.find(p => p.id === featureModalTeacher.plan_id)?.color || "#fff")
                            : "var(--text-muted)",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          padding: "0.5rem 1rem",
                          cursor: updatingId === featureModalTeacher.id ? "not-allowed" : "pointer",
                          minWidth: "180px",
                          gap: "0.5rem"
                        }}
                      >
                        <span>
                          {featureModalTeacher.plan_id 
                            ? `${plans.find(p => p.id === featureModalTeacher.plan_id)?.name} (${plans.find(p => p.id === featureModalTeacher.plan_id)?.price}ج)`
                            : "— بدون باقة —"
                          }
                        </span>
                        <ChevronDown size={14} style={{ opacity: 0.7, transform: isPlanDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                      </button>

                      {isPlanDropdownOpen && (
                        <div style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          marginTop: "0.5rem",
                          background: "#0f172a",
                          border: "1px solid var(--border-color)",
                          borderRadius: "8px",
                          overflow: "hidden",
                          zIndex: 10,
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                          display: "flex",
                          flexDirection: "column"
                        }}>
                          <button
                            onClick={() => {
                              handleAssignPlan(featureModalTeacher, "");
                              setFeatureModalTeacher({ ...featureModalTeacher, plan_id: null });
                              setIsPlanDropdownOpen(false);
                            }}
                            style={{
                              padding: "0.75rem 1rem",
                              textAlign: "right",
                              background: "none",
                              border: "none",
                              borderBottom: "1px solid rgba(255,255,255,0.05)",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                              fontSize: "0.85rem"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                          >
                            — بدون باقة —
                          </button>
                          {plans.map(p => (
                            <button
                              key={p.id}
                              onClick={() => {
                                handleAssignPlan(featureModalTeacher, p.id);
                                setFeatureModalTeacher({ ...featureModalTeacher, plan_id: p.id });
                                setIsPlanDropdownOpen(false);
                              }}
                              style={{
                                padding: "0.75rem 1rem",
                                textAlign: "right",
                                background: "none",
                                border: "none",
                                borderBottom: "1px solid rgba(255,255,255,0.05)",
                                color: p.color,
                                cursor: "pointer",
                                fontSize: "0.85rem",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                            >
                              <span style={{ fontWeight: 600 }}>{p.name}</span>
                              <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>({p.price}ج)</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>لا توجد باقات</span>
                  )}
                </div>
              </div>

              {/* Bills Feature Toggle */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", marginBottom: "4px" }}>ميزة الفواتير المالية</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>تفعيل نظام الحسابات وإصدار فواتير الدفع للطلاب.</p>
                </div>
                <button
                  className="toggle-button"
                  onClick={() => {
                    handleToggleBills(featureModalTeacher.id, featureModalTeacher.has_bills_feature);
                    setFeatureModalTeacher({ ...featureModalTeacher, has_bills_feature: !featureModalTeacher.has_bills_feature });
                  }}
                  disabled={updatingId === featureModalTeacher.id}
                  style={{ color: featureModalTeacher.has_bills_feature ? "var(--color-teal)" : "var(--text-muted)" }}
                >
                  {featureModalTeacher.has_bills_feature ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                </button>
              </div>

              {/* Attendance Feature Toggle */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", marginBottom: "4px" }}>ميزة الحضور والغياب</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>تفعيل نظام مسح الـ QR وتسجيل حصص الطلاب.</p>
                </div>
                <button
                  className="toggle-button"
                  onClick={() => {
                    const current = featureModalTeacher.has_attendance_feature ?? true;
                    handleToggleAttendance(featureModalTeacher.id, current);
                    setFeatureModalTeacher({ ...featureModalTeacher, has_attendance_feature: !current });
                  }}
                  disabled={updatingId === featureModalTeacher.id}
                  style={{ color: (featureModalTeacher.has_attendance_feature ?? true) ? "var(--color-teal)" : "var(--text-muted)" }}
                >
                  {(featureModalTeacher.has_attendance_feature ?? true) ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                </button>
              </div>

              {/* Center Mode Toggle */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", marginBottom: "4px" }}>نظام السنتر (المعلمين المساعدين)</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>السماح بإنشاء حسابات فرعية لمساعدي المعلم.</p>
                </div>
                <button
                  className="toggle-button"
                  onClick={() => {
                    const current = featureModalTeacher.is_center_mode ?? false;
                    handleToggleCenterMode(featureModalTeacher.id, current);
                    setFeatureModalTeacher({ ...featureModalTeacher, is_center_mode: !current });
                  }}
                  disabled={updatingId === featureModalTeacher.id}
                  style={{ color: (featureModalTeacher.is_center_mode ?? false) ? "var(--color-info)" : "var(--text-muted)" }}
                >
                  {(featureModalTeacher.is_center_mode ?? false) ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                </button>
              </div>
            </div>

            {(!featureModalTeacher.is_active && !featureModalTeacher.subscription_started_at) ? (
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
                <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", border: "1px solid rgba(16, 185, 129, 0.2)", fontSize: "0.9rem" }}>
                  هذا الحساب جديد وبانتظار موافقتك لتفعيله لأول مرة.
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ width: "100%", justifyContent: "center", background: "#10b981", borderColor: "#10b981" }}
                  onClick={() => {
                    // To approve, we toggle active and set start date to today
                    handleToggleActive(featureModalTeacher.id, false);
                    handleUpdateStartDate(featureModalTeacher.id, new Date().toISOString().split("T")[0]);
                    
                    // Update local modal state immediately
                    setFeatureModalTeacher({ 
                      ...featureModalTeacher, 
                      is_active: true,
                      subscription_started_at: new Date().toISOString()
                    });
                  }}
                  disabled={updatingId === featureModalTeacher.id}
                >
                  <Check size={18} />
                  موافقة وتفعيل الحساب الآن
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-secondary" 
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => setFeatureModalTeacher(null)}
              >
                إغلاق
              </button>
            )}
          </div>
        </div>
      )}

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
