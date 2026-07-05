"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
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
  ClipboardCheck
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        router.replace("/login");
        return;
      }
      
      const user = session.user;
      
      let { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("name, is_active, has_bills_feature, has_attendance_feature, is_admin, subscription_expires_at")
        .eq("id", user.id)
        .single();

      // Fallback: if query failed (e.g. missing column), fetch minimal fields
      if (teacherError) {
        const { data: fallback } = await supabase
          .from("teachers")
          .select("name, is_active, has_bills_feature, is_admin, subscription_expires_at")
          .eq("id", user.id)
          .single();
        if (fallback) {
          teacherData = { ...fallback, has_attendance_feature: true };
          teacherError = null;
        }
      }
        
      if (teacherError || !teacherData) {
        const defaultName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "المعلم";
        const { data: newProfile } = await supabase
          .from("teachers")
          .insert([{ id: user.id, name: defaultName, email: user.email }])
          .select("name, is_active, has_bills_feature, is_admin, subscription_expires_at")
          .single();
        
        if (newProfile) {
          teacherData = { ...newProfile, has_attendance_feature: true };
        }
      }
      
      if (teacherData) {
        setTeacherName(teacherData.name || user.email?.split("@")[0] || "المعلم");
        
        const active = teacherData.is_active !== false;
        const expired = teacherData.subscription_expires_at 
          ? new Date(teacherData.subscription_expires_at) < new Date()
          : false;
          
        if (!active || expired) {
          setIsBlocked(true);
        }
        
        const billsEnabled = teacherData.has_bills_feature !== false;
        setHasBills(billsEnabled);
        const attendanceEnabled = teacherData.has_attendance_feature !== false;
        setHasAttendance(attendanceEnabled);
        setIsAdmin(teacherData.is_admin === true);

        if (pathname === "/dashboard/bills" && !billsEnabled) {
          router.replace("/dashboard");
          return;
        }
        if ((pathname === "/dashboard/attendance" || pathname === "/dashboard/attendance/scan") && !attendanceEnabled) {
          router.replace("/dashboard");
          return;
        }
      }
      
      setLoading(false);
    }
    
    checkSession();
  }, [router, pathname]);

  // Close mobile menu on route change
  useEffect(() => {
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
    { name: "إدارة الطلاب", path: "/dashboard/students", icon: Users },
    ...(hasBills ? [{ name: "المصروفات والفواتير", path: "/dashboard/bills", icon: Receipt }] : []),
    ...(hasAttendance ? [{ name: "الحضور والغياب", path: "/dashboard/attendance", icon: ClipboardCheck }] : []),
    { name: "التقارير المالية", path: "/dashboard/reports", icon: TrendingUp },
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
            <div className="logo">
              <div className="stat-icon-wrapper stat-icon-teal" style={{ width: "2.5rem", height: "2.5rem", flexShrink: 0 }}>
                <BookOpen size={20} />
              </div>
              <span className="logo-text monospace" style={{ fontWeight: 700 }}>Student Tracker</span>
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

            {/* Logout button inside menu on mobile */}
            <button 
              className={`btn btn-secondary sidebar-logout-mobile ${mobileMenuOpen ? "open" : ""}`}
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span>تسجيل الخروج</span>
            </button>
          </nav>

          {/* Logout Button – desktop only */}
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
