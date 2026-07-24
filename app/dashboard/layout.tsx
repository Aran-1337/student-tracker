"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { SystemSettingsService, SystemSettings } from "@/lib/services/systemSettingsService";
import { OfflineCache } from "@/lib/offlineQueue";
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  Settings, 
  LogOut, 
  BookOpen,
  Receipt,
  Shield,
  Lock,
  Menu,
  X,
  ClipboardCheck,
  FileText,
  Award,
  FileQuestion,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState("");
  const [hasBills, setHasBills] = useState(true);
  const [hasAttendance, setHasAttendance] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sysSettings, setSysSettings] = useState<SystemSettings | null>(null);

  const [hasCenterMode, setHasCenterMode] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("no-session");

        const user = session.user;

        let { data: teacherData, error: teacherError } = await supabase
          .from("teachers")
          .select("name, is_active, has_bills_feature, has_attendance_feature, is_center_mode, is_admin, subscription_expires_at, subscription_started_at")
          .eq("id", user.id)
          .single();

        if (teacherError) {
          const { data: fallback } = await supabase
            .from("teachers")
            .select("name, is_active, is_admin")
            .eq("id", user.id)
            .single();
          if (fallback) {
            teacherData = {
              ...fallback,
              has_bills_feature: true,
              has_attendance_feature: true,
              is_center_mode: false,
              subscription_expires_at: "",
              subscription_started_at: "",
            };
            teacherError = null;
          }
        }

        if (teacherError || !teacherData) {
          const defaultName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "المعلم";
          const { data: newProfile } = await supabase
            .from("teachers")
            .insert([{ id: user.id, name: defaultName, email: user.email }])
            .select("name, is_active, is_admin")
            .single();
          if (newProfile) {
            teacherData = {
              ...newProfile,
              has_bills_feature: true,
              has_attendance_feature: true,
              is_center_mode: false,
              subscription_expires_at: "",
              subscription_started_at: "",
            };
          }
        }

        if (teacherData) {
          OfflineCache.saveTeacher(teacherData as any);
          applyTeacherData(teacherData, user.email?.split("@")[0] || "المعلم");
          const settings = await SystemSettingsService.getSettings();
          if (settings) {
            setSysSettings(settings);
            OfflineCache.saveSysSettings(settings);
          }
        }
      } catch {
        // Network failed or no session — try cache
        const cached = OfflineCache.loadTeacher();
        if (!cached) { router.replace("/login"); return; }
        applyTeacherData(cached as any, "");
        const cachedSettings = OfflineCache.loadSysSettings();
        if (cachedSettings) setSysSettings(cachedSettings);
      }

      setLoading(false);
    }

    function applyTeacherData(teacherData: any, fallbackName: string) {
      setTeacherName(teacherData.name || fallbackName || "المعلم");
      const centerMode = teacherData.is_center_mode === true;
      setHasCenterMode(centerMode);
      const billsEnabled = teacherData.has_bills_feature !== false;
      setHasBills(billsEnabled);
      const attendanceEnabled = teacherData.has_attendance_feature !== false;
      setHasAttendance(attendanceEnabled);
      const active = teacherData.is_active !== false;
      const expired = teacherData.subscription_expires_at
        ? new Date(teacherData.subscription_expires_at) < new Date()
        : false;
      if (!active) {
        if (!teacherData.subscription_started_at) setIsPending(true);
        else setIsBlocked(true);
      } else if (expired) {
        setIsBlocked(true);
      }
      setIsAdmin(teacherData.is_admin === true);
      if (pathname === "/dashboard/bills" && !billsEnabled) { router.replace("/dashboard"); return; }
      if ((pathname === "/dashboard/attendance" || pathname === "/dashboard/attendance/scan") && !attendanceEnabled) { router.replace("/dashboard"); return; }
      if (pathname === "/dashboard/teachers" && !centerMode) { router.replace("/dashboard"); return; }
    }
    
    checkSession();
  }, [router, pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner"></div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="login-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div className="glass-panel panel-content" style={{ maxWidth: "450px", textAlign: "center", padding: "3rem 2rem" }}>
          <div className="stat-icon-wrapper" style={{ margin: "0 auto 1.5rem auto", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", width: "4rem", height: "4rem" }}>
            <ClipboardCheck size={32} />
          </div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#ffffff" }}>بانتظار موافقة الإدارة</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "1rem" }}>
            لقد تم تسجيل حسابك بنجاح، وهو الآن قيد المراجعة. يرجى الانتظار حتى يقوم مدير النظام بمراجعة طلبك وتفعيل الحساب.
          </p>
          <div style={{ marginBottom: "2rem", padding: "1rem", background: "rgba(37, 211, 102, 0.1)", borderRadius: "8px", border: "1px solid rgba(37, 211, 102, 0.3)" }}>
            <p style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>أو يمكنك التواصل معنا لتأكيد التسجيل فوراً:</p>
            <a 
              href="https://wa.me/201028583616" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn"
              style={{ background: "#25D366", color: "white", display: "inline-flex", gap: "0.5rem", border: "none" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              01028583616
            </a>
          </div>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ width: "100%", justifyContent: "center" }}>
            <LogOut size={16} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="login-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div className="glass-panel panel-content" style={{ maxWidth: "450px", textAlign: "center", padding: "3rem 2rem" }}>
          <div className="stat-icon-wrapper" style={{ margin: "0 auto 1.5rem auto", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", width: "4rem", height: "4rem" }}>
            <Lock size={32} />
          </div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#ffffff" }}>عذراً، الحساب معطل!</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "2rem" }}>
            انتهت صلاحية اشتراكك السنوي أو تم إيقاف حسابك مؤقتاً من قبل الإدارة العامة. 
            يرجى التواصل مع الدعم الفني أو المدير العام لتفعيل وتجديد الاشتراك.
          </p>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ width: "100%", justifyContent: "center" }}>
            <LogOut size={16} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: "الرئيسية والمجموعات", path: "/dashboard", icon: LayoutDashboard },
    ...(hasCenterMode ? [{ name: "إدارة المعلمين", path: "/dashboard/teachers", icon: Users }] : []),
    { name: "إدارة الطلاب", path: "/dashboard/students", icon: Users },
    ...(hasAttendance ? [{ name: "الحضور والغياب", path: "/dashboard/attendance", icon: ClipboardCheck }] : []),
    ...(hasBills ? [{ name: "المصروفات والفواتير", path: "/dashboard/bills", icon: Receipt }] : []),
    { name: "التقارير المالية", path: "/dashboard/reports", icon: TrendingUp },
    { name: "تقارير الطلاب", path: "/dashboard/reports/students", icon: FileText },
    { name: "درجات الامتحانات", path: "/dashboard/exams", icon: Award },
    { name: "نماذج الامتحانات", path: "/dashboard/exams/generator", icon: FileQuestion },
    { name: "الإعدادات", path: "/dashboard/settings", icon: Settings },
    ...(isAdmin ? [{ name: "لوحة المدير العام", path: "/admin", icon: Shield }] : [])
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar (desktop) / Top nav (mobile) */}
      <aside className="sidebar">
        <div className="sidebar-inner">
          {/* Logo + Hamburger row */}
          <div className="sidebar-top-row">
            <div className="logo" style={sysSettings?.hide_sidebar_name ? { width: "100%", justifyContent: "center" } : {}}>
              {sysSettings?.site_logo ? (
                <img 
                  src={sysSettings.site_logo} 
                  alt={sysSettings.site_name || "Logo"} 
                  style={
                    sysSettings?.hide_sidebar_name 
                      ? { width: "100%", height: "auto", maxHeight: "80px", objectFit: "contain", borderRadius: "8px" }
                      : { width: "3.5rem", height: "3.5rem", objectFit: "contain", borderRadius: "8px", flexShrink: 0 }
                  }
                />
              ) : (
                <div className="stat-icon-wrapper stat-icon-teal" style={{ width: "2.5rem", height: "2.5rem", flexShrink: 0 }}>
                  <BookOpen size={20} />
                </div>
              )}
              {!sysSettings?.hide_sidebar_name && (
                <span className="logo-text monospace" style={{ fontWeight: 700 }}>{sysSettings?.sidebar_name || sysSettings?.site_name || "إدارة السناتر والمعلمين"}</span>
              )}
            </div>

            {/* Hamburger button – mobile only */}
            <button
              className="hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Teacher name – hidden on mobile when menu closed */}
          <div className={`sidebar-profile ${mobileMenuOpen ? "open" : ""}`}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>أهلاً بك،</p>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "#ffffff", marginTop: "4px" }}>{teacherName}</p>
          </div>

          {/* Navigation Links */}
          <nav className={`sidebar-menu ${mobileMenuOpen ? "open" : ""}`}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout button inside menu on mobile */}
          {mobileMenuOpen && (
            <>
              <button 
                className="btn btn-secondary sidebar-logout-mobile open"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>تسجيل الخروج</span>
              </button>
            </>
          )}

          {/* Logout – desktop only */}
          <div className="sidebar-logout-desktop">
            <button 
              className="btn btn-secondary"
              onClick={handleLogout}
              style={{ width: "100%", justifyContent: "center" }}
            >
              <LogOut size={16} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Content Area */}
      <main className="content-area">
        {children}
      </main>
    </div>
  );
}
