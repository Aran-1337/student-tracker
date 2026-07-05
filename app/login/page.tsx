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
    // Check if user is already logged in
    async function checkUser() {
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
    } catch (err: any) {
      setErrorMsg("حدث خطأ أثناء الاتصال بالخادم.");
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
          <p className="auth-subtitle">مرحباً بك في Student Tracker</p>
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
          <div className="alert-toast alert-error" style={{ position: "static", marginTop: "1.5rem", animation: "none" }}>
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
