"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Settings, 
  User, 
  DollarSign, 
  BookOpen, 
  Save, 
  AlertCircle,
  Check,
  Plus,
  Trash2,
  GraduationCap
} from "lucide-react";

interface Grade {
  id: string;
  name: string;
  start_code: number;
  prefix?: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("100");
  const [book1Price, setBook1Price] = useState("50");
  const [book2Price, setBook2Price] = useState("50");

  const [grades, setGrades] = useState<Grade[]>([]);
  const [newGradeName, setNewGradeName] = useState("");
  const [newGradeStartCode, setNewGradeStartCode] = useState("");
  const [newGradePrefix, setNewGradePrefix] = useState("");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setUserId(session.user.id);

        const { data: teacher, error } = await supabase
          .from("teachers")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) throw error;

        if (teacher) {
          setName(teacher.name || "");
          setMonthlyPrice(String(teacher.monthly_price ?? 100));
          setBook1Price(String(teacher.book_1_price ?? 50));
          setBook2Price(String(teacher.book_2_price ?? 50));
        }

        const { data: gradesData } = await supabase
          .from("grades")
          .select("*")
          .order("created_at", { ascending: true });
        setGrades(gradesData || []);
      } catch (err: any) {
        showToast("حدث خطأ أثناء تحميل الإعدادات.", "error");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !userId) {
      showToast("يرجى إدخال اسم المعلم.", "error");
      return;
    }

    setSaveLoading(true);
    try {
      const { error } = await supabase
        .from("teachers")
        .update({
          name: name,
          monthly_price: Number(monthlyPrice) || 0,
          book_1_price: Number(book1Price) || 0,
          book_2_price: Number(book2Price) || 0
        })
        .eq("id", userId);

      if (error) throw error;

      showToast("تم حفظ الإعدادات بنجاح.");
      
      // Refresh layout or profile quick info (handled by layout re-fetching on navigation or pathname trigger)
    } catch (err: any) {
      showToast(err.message || "فشل حفظ الإعدادات.", "error");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px" }}>
      {/* Title */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>الإعدادات</h1>
        <p style={{ color: "var(--text-secondary)" }}>تخصيص الحساب والقيم المالية للاشتراكات والكتب</p>
      </div>

      <div className="glass-panel panel-content" style={{ padding: "2.5rem 2rem" }}>
        <h2 className="panel-title">
          <Settings size={18} style={{ color: "var(--color-teal)" }} />
          <span>تعديل الإعدادات العامة والمالية</span>
        </h2>

        <form onSubmit={handleSaveSettings} style={{ marginTop: "2rem" }}>
          {/* Teacher Section */}
          <div style={{ paddingBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--color-info)" }}>البيانات الشخصية</h3>
            <div className="form-group" style={{ maxWidth: "450px" }}>
              <label className="form-label" htmlFor="tName">اسم المعلم الكامل</label>
              <div className="search-input-wrapper" style={{ flex: "none" }}>
                <User className="search-icon" size={18} />
                <input
                  id="tName"
                  type="text"
                  required
                  placeholder="مثال: أستاذ أحمد محمود"
                  className="search-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <p className="settings-description">الاسم الذي يظهر أعلى الشريط الجانبي وفي التقارير</p>
            </div>
          </div>

          {/* Pricing Section */}
          <div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--color-info)" }}>القيم المالية والأسعار</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
              {/* Monthly Subscription Price */}
              <div className="form-group">
                <label className="form-label" htmlFor="mPrice">قيمة الاشتراك الشهري</label>
                <div className="search-input-wrapper" style={{ flex: "none" }}>
                  <DollarSign className="search-icon" size={18} />
                  <input
                    id="mPrice"
                    type="number"
                    min="0"
                    required
                    className="search-input"
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                    style={{ direction: "ltr", textAlign: "right" }}
                  />
                </div>
                <p className="settings-description">سعر الاشتراك الشهري الافتراضي للطالب (بالجنيه)</p>
              </div>

              {/* Book 1 Price */}
              <div className="form-group">
                <label className="form-label" htmlFor="b1Price">سعر الكتاب الأول (كتاب ١)</label>
                <div className="search-input-wrapper" style={{ flex: "none" }}>
                  <BookOpen className="search-icon" size={18} />
                  <input
                    id="b1Price"
                    type="number"
                    min="0"
                    required
                    className="search-input"
                    value={book1Price}
                    onChange={(e) => setBook1Price(e.target.value)}
                    style={{ direction: "ltr", textAlign: "right" }}
                  />
                </div>
                <p className="settings-description">قيمة سعر بيع كتاب ١ للنسخة الواحدة</p>
              </div>

              {/* Book 2 Price */}
              <div className="form-group">
                <label className="form-label" htmlFor="b2Price">سعر الكتاب الثاني (كتاب ٢)</label>
                <div className="search-input-wrapper" style={{ flex: "none" }}>
                  <BookOpen className="search-icon" size={18} />
                  <input
                    id="b2Price"
                    type="number"
                    min="0"
                    required
                    className="search-input"
                    value={book2Price}
                    onChange={(e) => setBook2Price(e.target.value)}
                    style={{ direction: "ltr", textAlign: "right" }}
                  />
                </div>
                <p className="settings-description">قيمة سعر بيع كتاب ٢ للنسخة الواحدة</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ marginTop: "2.5rem", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ minWidth: "150px" }}
              disabled={saveLoading}
            >
              {saveLoading ? (
                <span>جاري الحفظ...</span>
              ) : (
                <>
                  <Save size={18} />
                  <span>حفظ التعديلات</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Grades Settings Section */}
        <div className="glass-panel panel-content" style={{ marginTop: "2rem" }}>
          <h2 className="panel-title">
            <GraduationCap size={18} style={{ color: "var(--color-teal)" }} />
            السنين الدراسية والأكواد
          </h2>
          <p className="settings-description" style={{ marginBottom: "1.5rem" }}>
            أضف السنين الدراسية التي تُدرّس لها لتتمكن من إنشاء مجموعات لكل سنة بأكواد منفصلة.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {grades.map(grade => (
              <div key={grade.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{grade.name}</h3>
                  <p style={{ margin: "0.2rem 0 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    بداية الأكواد: <strong style={{ color: "var(--color-teal)" }}>{grade.start_code}</strong>
                    {grade.prefix && <span style={{ marginLeft: "10px" }}> | البادئة: <strong style={{ color: "var(--color-teal)" }}>{grade.prefix}</strong></span>}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (confirm("هل أنت متأكد من حذف هذه السنة الدراسية؟ (المجموعات التابعة لها ستصبح بدون سنة)")) {
                      await supabase.from("grades").delete().eq("id", grade.id);
                      setGrades(grades.filter(g => g.id !== grade.id));
                      showToast("تم الحذف بنجاح");
                    }
                  }}
                  className="btn btn-danger"
                  style={{ padding: "0.5rem" }}
                  title="حذف"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="اسم السنة (مثال: الصف الأول الثانوي)"
                className="form-input"
                style={{ flex: 2, minWidth: "200px" }}
                value={newGradeName}
                onChange={(e) => setNewGradeName(e.target.value)}
              />
              <input
                type="text"
                placeholder="البادئة (اختياري) مثال: prep-"
                className="form-input"
                style={{ flex: 1, minWidth: "150px" }}
                value={newGradePrefix}
                onChange={(e) => setNewGradePrefix(e.target.value)}
              />
              <input
                type="number"
                placeholder="بداية الأكواد (مثال: 10000)"
                className="form-input"
                style={{ flex: 1, minWidth: "150px" }}
                value={newGradeStartCode}
                onChange={(e) => setNewGradeStartCode(e.target.value)}
              />
              <button
                className="btn btn-primary"
                onClick={async () => {
                  if (!newGradeName || !newGradeStartCode) {
                    showToast("يرجى إدخال اسم السنة وبداية الأكواد", "error");
                    return;
                  }
                  if (!userId) return;
                  const { data, error } = await supabase.from("grades").insert([{
                    name: newGradeName,
                    start_code: parseInt(newGradeStartCode),
                    prefix: newGradePrefix || '',
                    teacher_id: userId
                  }]).select().single();

                  if (error) {
                    showToast("فشل إضافة السنة الدراسية", "error");
                  } else if (data) {
                    setGrades([...grades, data]);
                    setNewGradeName("");
                    setNewGradeStartCode("");
                    setNewGradePrefix("");
                    showToast("تم إضافة السنة الدراسية بنجاح");
                  }
                }}
              >
                <Plus size={18} />
                إضافة سنة
              </button>
            </div>
          </div>
        </div>
      </div>

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
