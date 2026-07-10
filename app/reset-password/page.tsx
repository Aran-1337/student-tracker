"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Listen for auth state change to verify the recovery token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // Ready to reset password
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMsg("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccess(true);
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
            <div className="stat-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
              <ShieldCheck size={24} />
            </div>
          </div>
          <h1 className="auth-title">تعيين كلمة مرور جديدة</h1>
          <p className="auth-subtitle">أدخل كلمة المرور الجديدة لحسابك</p>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div className="alert-toast alert-success" style={{ position: "static", transform: "none", marginBottom: "1.5rem", animation: "none", width: "100%", justifyContent: "center", boxSizing: "border-box" }}>
              <span style={{ textAlign: "center" }}>تم تغيير كلمة المرور بنجاح!</span>
            </div>
            <Link href="/dashboard" className="btn btn-primary" style={{ width: "100%" }}>
              التوجه للوحة التحكم
            </Link>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            <div className="form-group" style={{ marginBottom: "2rem" }}>
              <label className="form-label" htmlFor="password">
                كلمة المرور الجديدة
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
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={loading}
            >
              {loading ? "جاري الحفظ..." : "حفظ كلمة المرور"}
            </button>
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
