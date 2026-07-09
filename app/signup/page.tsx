"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { UserPlus, Mail, Lock, User, BookOpen } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccess(false);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name, // Passed to user metadata, processed by schema.sql trigger
            full_name: name,
            phone: phone,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        // If auto-confirm is enabled and a session is created immediately
        if (data.session) {
          router.replace("/dashboard");
        } else {
          setSuccess(true);
          setName("");
          setEmail("");
          setPassword("");
        }
      }
    } catch {
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
          <h1 className="auth-title">إنشاء حساب جديد</h1>
          <p className="auth-subtitle">سجل كمعلم للبدء في تتبع طلابك</p>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div className="alert-toast alert-success" style={{ position: "static", marginBottom: "1.5rem", animation: "none", flexDirection: "column", gap: "1rem", textAlign: "center" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>تم تسجيل حسابك بنجاح! 🎉</span>
              <span>يرجى الانتظار حتى يقوم مدير النظام بمراجعة وتفعيل حسابك.</span>
              
              <div style={{ marginTop: "0.5rem", padding: "1rem", background: "rgba(37, 211, 102, 0.1)", borderRadius: "8px", border: "1px solid rgba(37, 211, 102, 0.3)" }}>
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
            </div>
            <Link href="/login" className="btn btn-primary" style={{ width: "100%" }}>
              العودة لصفحة تسجيل الدخول
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                الاسم الكامل
              </label>
              <div className="search-input-wrapper" style={{ flex: "none" }}>
                <User className="search-icon" size={18} />
                <input
                  id="name"
                  type="text"
                  required
                  className="search-input"
                  placeholder="الاسم الكامل للمعلم"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                رقم الهاتف (واتساب)
              </label>
              <div className="search-input-wrapper" style={{ flex: "none" }}>
                <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <input
                  id="phone"
                  type="tel"
                  required
                  className="search-input"
                  placeholder="مثال: 01012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ direction: "ltr", textAlign: "left", paddingRight: "1rem", paddingLeft: "2.5rem" }}
                />
              </div>
            </div>

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
              {loading ? "جاري تسجيل الحساب..." : "إنشاء حساب"}
              {!loading && <UserPlus size={18} />}
            </button>
          </form>
        )}

        {errorMsg && (
          <div className="alert-toast alert-error" style={{ position: "static", marginTop: "1.5rem", animation: "none" }}>
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="auth-footer">
          لديك حساب بالفعل؟
          <Link href="/login" className="auth-link">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
