"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { LogIn, Mail, Lock, BookOpen } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkUser() {
      // Offline: if we have cached teacher data, go straight to dashboard
      if (!navigator.onLine) {
        const cached = localStorage.getItem("ot_teacher");
        if (cached) { router.replace("/dashboard"); return; }
        setCheckingAuth(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/dashboard");
      } else {
        setCheckingAuth(false);
      }
    }
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message === "Invalid login credentials" 
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة." 
          : error.message
        );
      } else {
        router.replace("/dashboard");
      }
    } catch {
      setErrorMsg("لا يوجد اتصال بالإنترنت. يرجى الاتصال أولاً لتسجيل الدخول.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="loading-wrapper">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <div className="stat-icon-wrapper stat-icon-teal">
              <BookOpen size={24} />
            </div>
          </div>
          <h1 className="auth-title">تسجيل الدخول</h1>
          <p className="auth-subtitle">مرحباً بك في نظام إدارة السناتر والمعلمين</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              البريد الإلكتروني
            </label>
            <div className="search-input-wrapper" style={{ flex: "none" }}>
              <Mail className="search-icon" size={18} />
              <input
                id="email"
                type="email"
                required
                className="search-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ direction: "ltr", textAlign: "left", paddingRight: "1rem", paddingLeft: "2.5rem" }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "2rem" }}>
            <label className="form-label" htmlFor="password">
              كلمة المرور
            </label>
            <div className="search-input-wrapper" style={{ flex: "none" }}>
              <Lock className="search-icon" size={18} />
              <input
                id="password"
                type="password"
                required
                className="search-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ direction: "ltr", textAlign: "left", paddingRight: "1rem", paddingLeft: "2.5rem" }}
              />
            </div>
            <div style={{ textAlign: "right", marginTop: "0.5rem" }}>
              <Link href="/forgot-password" style={{ fontSize: "0.85rem", color: "var(--color-teal)", textDecoration: "none" }}>
                نسيت كلمة المرور؟
              </Link>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "جاري الدخول..." : "دخول"}
            {!loading && <LogIn size={18} />}
          </button>
        </form>

        {errorMsg && (
          <div style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "#f87171",
            padding: "0.85rem 1rem",
            borderRadius: "8px",
            marginTop: "1.5rem",
            fontSize: "0.9rem",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem"
          }}>
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="auth-footer">
          ليس لديك حساب؟
          <Link href="/signup" className="auth-link">
            إنشاء حساب جديد
          </Link>
        </div>
      </div>
    </div>
  );
}
