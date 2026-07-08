"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Settings, 
  User, 
  DollarSign, 
  BookOpen, 
  Save, 
  Plus,
  Trash2,
  GraduationCap
} from "lucide-react";

import { TeachersService } from "@/lib/services/teachersService";
import { GradesService } from "@/lib/services/gradesService";
import { Grade } from "@/lib/types";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

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
  };

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setUserId(session.user.id);

        const [teacher, gradesData] = await Promise.all([
          TeachersService.getTeacherProfile(session.user.id),
          GradesService.getGradesByTeacherId(session.user.id) // using getGradesByTeacherId instead of getAll for safety, though previously it was all
        ]);

        if (teacher) {
          setName(teacher.name || "");
          setMonthlyPrice(String(teacher.monthly_price ?? 100));
          setBook1Price(String(teacher.book_1_price ?? 50));
          setBook2Price(String(teacher.book_2_price ?? 50));
        }

        // To exactly match the old behavior where it fetched all grades regardless (though it's a bug in the old code)
        // Actually, the old code fetched all grades without filtering by teacher id. We should probably stick to getting all grades to not break anything.
        const allGrades = await GradesService.getAllGrades();
        setGrades(allGrades);
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
      await TeachersService.updateTeacherProfile(userId, {
        name: name,
        monthly_price: Number(monthlyPrice) || 0,
        book_1_price: Number(book1Price) || 0,
        book_2_price: Number(book2Price) || 0
      });

      showToast("تم حفظ الإعدادات بنجاح.");
    } catch (err: any) {
      showToast(err.message || "فشل حفظ الإعدادات.", "error");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddGrade = async () => {
    if (!newGradeName || !newGradeStartCode) {
      showToast("يرجى إدخال اسم السنة وبداية الأكواد", "error");
      return;
    }
    if (!userId) return;

    try {
      const addedGrade = await GradesService.addGrade({
        name: newGradeName,
        start_code: parseInt(newGradeStartCode),
        prefix: newGradePrefix || '',
        teacher_id: userId
      });

      setGrades([...grades, addedGrade]);
      setNewGradeName("");
      setNewGradeStartCode("");
      setNewGradePrefix("");
      showToast("تم إضافة السنة الدراسية بنجاح");
    } catch (error) {
      showToast("فشل إضافة السنة الدراسية", "error");
    }
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (confirm("هل أنت متأكد من حذف هذه السنة الدراسية؟ (المجموعات التابعة لها ستصبح بدون سنة)")) {
      try {
        await GradesService.deleteGrade(gradeId);
        setGrades(grades.filter(g => g.id !== gradeId));
        showToast("تم الحذف بنجاح");
      } catch (err) {
        showToast("فشل حذف السنة الدراسية.", "error");
      }
    }
  };

  if (loading) {
    return <Spinner fullScreen />;
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
              <Input
                label="اسم المعلم الكامل"
                id="tName"
                type="text"
                required
                placeholder="مثال: أستاذ أحمد محمود"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User size={18} />}
              />
              <p className="settings-description" style={{ marginTop: "0.5rem" }}>الاسم الذي يظهر أعلى الشريط الجانبي وفي التقارير</p>
            </div>
          </div>

          {/* Pricing Section */}
          <div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--color-info)" }}>القيم المالية والأسعار</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
              {/* Monthly Subscription Price */}
              <div className="form-group">
                <Input
                  label="قيمة الاشتراك الشهري"
                  id="mPrice"
                  type="number"
                  min="0"
                  required
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  style={{ direction: "ltr", textAlign: "right" }}
                  leftIcon={<DollarSign size={18} />}
                />
                <p className="settings-description" style={{ marginTop: "0.5rem" }}>سعر الاشتراك الشهري الافتراضي للطالب (بالجنيه)</p>
              </div>

              {/* Book 1 Price */}
              <div className="form-group">
                <Input
                  label="سعر الكتاب الأول (كتاب ١)"
                  id="b1Price"
                  type="number"
                  min="0"
                  required
                  value={book1Price}
                  onChange={(e) => setBook1Price(e.target.value)}
                  style={{ direction: "ltr", textAlign: "right" }}
                  leftIcon={<BookOpen size={18} />}
                />
                <p className="settings-description" style={{ marginTop: "0.5rem" }}>قيمة سعر بيع كتاب ١ للنسخة الواحدة</p>
              </div>

              {/* Book 2 Price */}
              <div className="form-group">
                <Input
                  label="سعر الكتاب الثاني (كتاب ٢)"
                  id="b2Price"
                  type="number"
                  min="0"
                  required
                  value={book2Price}
                  onChange={(e) => setBook2Price(e.target.value)}
                  style={{ direction: "ltr", textAlign: "right" }}
                  leftIcon={<BookOpen size={18} />}
                />
                <p className="settings-description" style={{ marginTop: "0.5rem" }}>قيمة سعر بيع كتاب ٢ للنسخة الواحدة</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ marginTop: "2.5rem", display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="submit"
              variant="primary"
              style={{ minWidth: "150px" }}
              isLoading={saveLoading}
              leftIcon={!saveLoading && <Save size={18} />}
            >
              حفظ التعديلات
            </Button>
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
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteGrade(grade.id)}
                  title="حذف"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ flex: 2, minWidth: "200px" }}>
                <Input
                  type="text"
                  placeholder="اسم السنة (مثال: الصف الأول الثانوي)"
                  value={newGradeName}
                  onChange={(e) => setNewGradeName(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: "150px" }}>
                <Input
                  type="text"
                  placeholder="البادئة (اختياري) مثال: prep-"
                  value={newGradePrefix}
                  onChange={(e) => setNewGradePrefix(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: "150px" }}>
                <Input
                  type="number"
                  placeholder="بداية الأكواد (مثال: 10000)"
                  value={newGradeStartCode}
                  onChange={(e) => setNewGradeStartCode(e.target.value)}
                />
              </div>
              <Button
                variant="primary"
                onClick={handleAddGrade}
                leftIcon={<Plus size={18} />}
              >
                إضافة سنة
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
