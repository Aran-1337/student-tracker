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
  Lock
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        router.replace("/login");
        return;
      }
      
      const user = session.user;
      
      // Get teacher profile, self-heal if missing
      let { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("name, is_active, has_bills_feature, is_admin, subscription_expires_at")
        .eq("id", user.id)
        .single();
        
      if (teacherError || !teacherData) {
        const defaultName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "المعلم";
        const { data: newProfile, error: insertError } = await supabase
          .from("teachers")
          .insert([{ id: user.id, name: defaultName, email: user.email }])
          .select("name, is_active, has_bills_feature, is_admin, subscription_expires_at")
          .single();
        
        if (!insertError && newProfile) {
          teacherData = newProfile;
        }
      }
      
      if (teacherData) {
        setTeacherName(teacherData.name || user.email?.split("@")[0] || "المعلم");
        
        // Subscription check
        const active = teacherData.is_active !== false;
        const expired = teacherData.subscription_expires_at 
          ? new Date(teacherData.subscription_expires_at) < new Date()
          : false;
          
        if (!active || expired) {
          setIsBlocked(true);
        }
        
        const billsEnabled = teacherData.has_bills_feature !== false;
        setHasBills(billsEnabled);
        setIsAdmin(teacherData.is_admin === true);

        // Security check: if trying to access bills page but it's disabled
        if (pathname === "/dashboard/bills" && !billsEnabled) {
          router.replace("/dashboard");
          return;
        }
      }
      
      setLoading(false);
    }
    
    checkSession();
  }, [router, pathname]);

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

  // Account Blocked Screen
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
    // Show bills link only if feature flag is active
    ...(hasBills ? [{ name: "المصروفات والفواتير", path: "/dashboard/bills", icon: Receipt }] : []),
    { name: "التقارير المالية", path: "/dashboard/reports", icon: TrendingUp },
    { name: "الإعدادات", path: "/dashboard/settings", icon: Settings },
    // Show Admin Link if user is an admin
    ...(isAdmin ? [{ name: "لوحة المدير العام", path: "/admin", icon: Shield }] : [])
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar (Right side in RTL) */}
      <aside className="sidebar">
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Logo */}
          <div className="logo" style={{ marginBottom: "2rem" }}>
            <div className="stat-icon-wrapper stat-icon-teal" style={{ width: "2.5rem", height: "2.5rem" }}>
              <BookOpen size={20} />
            </div>
            <span className="logo-text monospace" style={{ fontWeight: 700 }}>Student Tracker</span>
          </div>

          {/* Teacher Profile Quick Info */}
          <div style={{ padding: "0 0.5rem 1.25rem 0.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>أهلاً بك،</p>
            <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "#ffffff", marginTop: "4px" }}>{teacherName}</p>
          </div>

          {/* Navigation Links */}
          <nav className="sidebar-menu">
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

          {/* Logout Button */}
          <div style={{ marginTop: "auto", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
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

      {/* Content Area (Left side) */}
      <main className="content-area">
        {children}
      </main>
    </div>
  );
}
