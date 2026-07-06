"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { UserPlus, Mail, Lock, User, BookOpen } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
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
            <div className="alert-toast alert-success" style={{ position: "static", marginBottom: "1.5rem", animation: "none" }}>
              <span>تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.</span>
            </div>
            <Link href="/login" className="btn btn-primary" style={{ width: "100%" }}>
              توجه لصفحة تسجيل الدخول
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
