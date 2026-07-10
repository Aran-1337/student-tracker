"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Mail, ShieldAlert, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg("تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.");
        setEmail("");
      }
    } catch {
      setErrorMsg("حدث خطأ أثناء الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <div className="stat-icon-wrapper" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
              <ShieldAlert size={24} />
            </div>
          </div>
          <h1 className="auth-title">نسيت كلمة المرور</h1>
          <p className="auth-subtitle">أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة التعيين</p>
        </div>

        {successMsg ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div className="alert-toast alert-success" style={{ position: "static", transform: "none", marginBottom: "1.5rem", animation: "none", width: "100%", justifyContent: "center", boxSizing: "border-box" }}>
              <span style={{ textAlign: "center" }}>{successMsg}</span>
            </div>
            <Link href="/login" className="btn btn-primary" style={{ width: "100%" }}>
              العودة لتسجيل الدخول
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset}>
            <div className="form-group" style={{ marginBottom: "2rem" }}>
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

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginBottom: "1rem" }}
              disabled={loading}
            >
              {loading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
            </button>
            
            <Link href="/login" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
              <ArrowRight size={16} style={{ marginLeft: "0.5rem" }} />
              العودة لتسجيل الدخول
            </Link>
          </form>
        )}

        {errorMsg && (
          <div className="alert-toast alert-error" style={{ position: "static", marginTop: "1.5rem", animation: "none" }}>
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
