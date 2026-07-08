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
import { Grade, BookDef } from "@/lib/types";

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
  const [books, setBooks] = useState<BookDef[]>([]);

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
          GradesService.getGradesByTeacherId(session.user.id)
        ]);

        if (teacher) {
          setName(teacher.name || "");
          setMonthlyPrice(String(teacher.monthly_price ?? 100));
          setBooks(teacher.books || []);
        }

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

    // Validate books
    for (let b of books) {
      if (!b.name.trim()) {
        showToast("يرجى التأكد من ملء جميع أسماء الكتب.", "error");
        return;
      }
    }

    setSaveLoading(true);
    try {
      await TeachersService.updateTeacherProfile(userId, {
        name: name,
        monthly_price: Number(monthlyPrice) || 0,
        books: books
      });

      showToast("تم حفظ الإعدادات بنجاح.");
    } catch (err: any) {
      showToast(err.message || "فشل حفظ الإعدادات.", "error");
    } finally {
      setSaveLoading(false);
    }
  };


  const handleAddBook = () => {
    const newBook = {
      id: `book_${Date.now()}`,
      name: "",
      price: 50
    };
    setBooks([...books, newBook]);
  };

  const handleUpdateBook = (id: string, field: "name" | "price", value: string | number) => {
    setBooks(books.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleRemoveBook = (id: string) => {
    setBooks(books.filter(b => b.id !== id));
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
          <div style={{ paddingBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--color-info)" }}>قيمة الاشتراك الشهري</h3>
            <div className="form-group" style={{ maxWidth: "250px" }}>
              <Input
                label="قيمة الاشتراك الشهري"
                id="mPrice"
                type="number"
                min="0"
                required
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                style={{ direction: "ltr", textAlign: "right" }}
                leftIcon={<span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-secondary)" }}>ج.م</span>}
              />
              <p className="settings-description" style={{ marginTop: "0.5rem" }}>سعر الاشتراك الشهري الافتراضي للطالب (بالجنيه)</p>
            </div>
          </div>

          {/* Dynamic Books Section */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", marginBottom: "0.25rem", color: "var(--color-info)" }}>الكتب والمذكرات</h3>
                <p className="settings-description">أضف الكتب التي تسلمها للطلاب مع تحديد سعر كل كتاب.</p>
              </div>
              <Button type="button" variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={handleAddBook}>
                إضافة كتاب جديد
              </Button>
            </div>

            {books.length === 0 ? (
              <div style={{ padding: "1.5rem", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px dashed var(--border-color)" }}>
                <BookOpen size={32} style={{ opacity: 0.3, margin: "0 auto 0.5rem" }} />
                <p style={{ color: "var(--text-muted)" }}>لا توجد كتب مضافة حالياً.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {books.map((book, index) => (
                  <div key={book.id} style={{ display: "flex", gap: "1rem", alignItems: "flex-end", background: "rgba(15,23,42,0.4)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                    <div style={{ flex: 2 }}>
                      <Input
                        label={`اسم الكتاب (${index + 1})`}
                        value={book.name}
                        onChange={(e) => handleUpdateBook(book.id, "name", e.target.value)}
                        placeholder="مثال: مذكرة الشرح"
                        required
                        leftIcon={<BookOpen size={18} />}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Input
                        label="السعر"
                        type="number"
                        min="0"
                        value={book.price}
                        onChange={(e) => handleUpdateBook(book.id, "price", Number(e.target.value))}
                        required
                        style={{ direction: "ltr", textAlign: "right" }}
                        leftIcon={<span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-secondary)" }}>ج.م</span>}
                      />
                    </div>
                    <div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleRemoveBook(book.id)}
                        style={{ height: "42px", color: "var(--color-danger)", borderColor: "rgba(239, 68, 68, 0.3)" }}
                        title="حذف الكتاب"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
