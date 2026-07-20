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
  GraduationCap,
  MessageCircle
} from "lucide-react";

import { TeachersService } from "@/lib/services/teachersService";
import { GradesService } from "@/lib/services/gradesService";
import { StudentsService } from "@/lib/services/studentsService";
import { Grade, BookDef, Student } from "@/lib/types";

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
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [books, setBooks] = useState<BookDef[]>([]);
  const [deletedBookIds, setDeletedBookIds] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [grades, setGrades] = useState<Grade[]>([]);
  const [deletedGradeIds, setDeletedGradeIds] = useState<string[]>([]);
  const [newGradeName, setNewGradeName] = useState("");
  const [newGradePrice, setNewGradePrice] = useState("");
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
        setEmail(session.user.email || "");

        const [teacher, gradesData, studentsData] = await Promise.all([
          TeachersService.getTeacherProfile(session.user.id),
          GradesService.getGradesByTeacherId(session.user.id),
          StudentsService.getStudentsByTeacherId(session.user.id)
        ]);

        if (teacher) {
          setName(teacher.name || "");
          setPhone(teacher.phone || "");
          setBooks(teacher.books || []);
        }

        setGrades(gradesData);
        setStudents(studentsData);
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
      // 1. Delete Grades
      if (deletedGradeIds.length > 0) {
        await Promise.all(deletedGradeIds.map(id => GradesService.deleteGrade(id)));
        setDeletedGradeIds([]);
      }

      // 2. Add New Grades and Keep a Mapping of Temp ID to Real ID
      const tempToRealIdMap: Record<string, string> = {};
      const updatedGradesList = [...grades];

      for (let i = 0; i < updatedGradesList.length; i++) {
        const g = updatedGradesList[i];
        if (g.id.startsWith("temp_")) {
          const addedGrade = await GradesService.addGrade({
            name: g.name,
            start_code: g.start_code || 1,
            prefix: g.prefix || '',
            monthly_price: g.monthly_price,
            teacher_id: userId
          });
          tempToRealIdMap[g.id] = addedGrade.id;
          updatedGradesList[i] = addedGrade;
        } else {
          // 3. Update Existing Grades (we assume they might be modified, so we just update their price/name)
          await GradesService.updateGrade(g.id, {
            name: g.name,
            monthly_price: g.monthly_price,
            prefix: g.prefix || ''
          });
        }
      }
      setGrades(updatedGradesList);

      // 4. Map Books to Real Grade IDs
      const mappedBooks = books.map(b => {
        if (b.grade_id && b.grade_id.startsWith("temp_") && tempToRealIdMap[b.grade_id]) {
          return { ...b, grade_id: tempToRealIdMap[b.grade_id] };
        }
        return b;
      });

      // 5. Update Teacher Profile
      await TeachersService.updateTeacherProfile(userId, {
        name: name,
        phone: phone,
        books: mappedBooks
      });

      setBooks(mappedBooks);

      if (deletedBookIds.length > 0) {
        const affectedStudents = students.filter(s => s.received_books?.some(bId => deletedBookIds.includes(bId)));
        const updatePromises = affectedStudents.map(student => {
          const newBooks = student.received_books?.filter(bId => !deletedBookIds.includes(bId)) || [];
          return StudentsService.updateStudent(student.id, { received_books: newBooks });
        });
        await Promise.all(updatePromises);
        setDeletedBookIds([]);
        
        // Update local students state
        setStudents(students.map(s => {
          if (affectedStudents.some(a => a.id === s.id)) {
            const newBooks = s.received_books?.filter(bId => !deletedBookIds.includes(bId)) || [];
            return { ...s, received_books: newBooks };
          }
          return s;
        }));
      }

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

  const handleUpdateBook = (id: string, field: "name" | "price" | "grade_id", value: string | number) => {
    setBooks(books.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleRemoveBook = (id: string) => {
    const affectedCount = students.filter(s => s.received_books?.includes(id)).length;
    if (affectedCount > 0) {
      if (!confirm(`سيتم حذف هذا الكتاب من سجلات ${affectedCount} طالب مستلمين له عند حفظ الإعدادات، هل أنت متأكد؟`)) {
        return;
      }
    }
    setBooks(books.filter(b => b.id !== id));
    setDeletedBookIds([...deletedBookIds, id]);
  };

  const handleAddGrade = () => {
    if (!newGradeName || !newGradePrice) {
      showToast("يرجى إدخال اسم السنة وسعرها الشهري", "error");
      return;
    }
    if (!userId) return;

    const newGrade: Grade = {
      id: `temp_${Date.now()}`,
      name: newGradeName,
      start_code: 1,
      prefix: newGradePrefix,
      monthly_price: Number(newGradePrice),
      teacher_id: userId
    };

    setGrades([...grades, newGrade]);
    setNewGradeName("");
    setNewGradePrice("");
    setNewGradePrefix("");
  };

  const handleDeleteGrade = (gradeId: string) => {
    if (confirm("هل أنت متأكد من حذف هذه السنة الدراسية؟ (سيتم الحذف نهائياً عند حفظ التعديلات)")) {
      if (!gradeId.startsWith("temp_")) {
        setDeletedGradeIds([...deletedGradeIds, gradeId]);
      }
      setGrades(grades.filter(g => g.id !== gradeId));
    }
  };

  if (loading) {
    return <Spinner fullScreen />;
  }

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>الإعدادات</h1>
        <p style={{ color: "var(--text-secondary)" }}>تخصيص الحساب والقيم المالية للاشتراكات والكتب</p>
      </div>

      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 700px", maxWidth: "800px" }}>

      <div className="glass-panel panel-content" style={{ padding: "2.5rem 2rem" }}>
        <h2 className="panel-title">
          <Settings size={18} style={{ color: "var(--color-teal)" }} />
          <span>تعديل الإعدادات العامة والمالية</span>
        </h2>

        <form onSubmit={handleSaveSettings} style={{ marginTop: "2rem" }}>
          {/* Teacher Section */}
          <div style={{ paddingBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ flex: "1 1 100%" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--color-info)" }}>البيانات الشخصية</h3>
            </div>
            <div className="form-group" style={{ flex: "1 1 200px" }}>
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
            </div>
            <div className="form-group" style={{ flex: "1 1 200px" }}>
              <Input
                label="رقم الهاتف (واتساب)"
                id="tPhone"
                type="tel"
                placeholder="01012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ direction: "ltr", textAlign: "right" }}
                leftIcon={<span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-secondary)" }}>+20</span>}
              />
            </div>
            <div className="form-group" style={{ flex: "1 1 200px" }}>
              <Input
                label="البريد الإلكتروني"
                id="tEmail"
                type="email"
                value={email}
                disabled
                style={{ direction: "ltr", textAlign: "right", opacity: 0.7 }}
              />
            </div>
          </div>

          {/* Grades Settings Section */}
          <div style={{ paddingBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1.5rem" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.25rem", color: "var(--color-info)" }}>السنين الدراسية والسعر</h3>
              <p className="settings-description">أضف السنين الدراسية التي تُدرّس لها مع تحديد سعر الاشتراك الشهري لكل سنة.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {grades.map(grade => (
                <div key={grade.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{grade.name}</h3>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <div style={{ width: "120px" }}>
                      <Input
                        type="text"
                        placeholder="الكود (اختياري)"
                        value={grade.prefix || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newGrades = grades.map(g => g.id === grade.id ? { ...g, prefix: val } : g);
                          setGrades(newGrades);
                        }}
                      />
                    </div>
                    <div style={{ width: "150px" }}>
                      <Input 
                        type="number"
                        placeholder="السعر (شهرياً)"
                        value={grade.monthly_price === null || grade.monthly_price === undefined ? "" : grade.monthly_price}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : null;
                          const newGrades = grades.map(g => g.id === grade.id ? { ...g, monthly_price: val } : g);
                          setGrades(newGrades);
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteGrade(grade.id)}
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column" }}>
                  <select
                    className="form-input"
                    value={newGradeName}
                    onChange={(e) => setNewGradeName(e.target.value)}
                    style={{ width: "100%", height: "42px", color: newGradeName ? "inherit" : "var(--text-muted)" }}
                  >
                    <option value="" disabled>اختر السنة الدراسية...</option>
                    <option value="الصف الأول الابتدائي">الصف الأول الابتدائي</option>
                    <option value="الصف الثاني الابتدائي">الصف الثاني الابتدائي</option>
                    <option value="الصف الثالث الابتدائي">الصف الثالث الابتدائي</option>
                    <option value="الصف الرابع الابتدائي">الصف الرابع الابتدائي</option>
                    <option value="الصف الخامس الابتدائي">الصف الخامس الابتدائي</option>
                    <option value="الصف السادس الابتدائي">الصف السادس الابتدائي</option>
                    <option value="الصف الأول الإعدادي">الصف الأول الإعدادي</option>
                    <option value="الصف الثاني الإعدادي">الصف الثاني الإعدادي</option>
                    <option value="الصف الثالث الإعدادي">الصف الثالث الإعدادي</option>
                    <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                    <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                    <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
                  </select>
                </div>
                <div style={{ flex: "1 1 120px" }}>
                  <Input
                    type="text"
                    placeholder="كود السنة (اختياري)"
                    value={newGradePrefix}
                    onChange={(e) => setNewGradePrefix(e.target.value)}
                    style={{ border: "1px solid var(--border-color)" }}
                  />
                </div>
                <div style={{ flex: "1 1 150px" }}>
                  <Input
                    type="number"
                    placeholder="السعر (ج.م/شهرياً) *"
                    value={newGradePrice}
                    onChange={(e) => setNewGradePrice(e.target.value)}
                    style={{ border: "1px solid var(--color-teal)" }}
                  />
                </div>
                <div style={{ flex: "0 0 auto" }}>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAddGrade}
                    leftIcon={<Plus size={18} />}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    إضافة سنة
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Books Section */}
          <div style={{ paddingBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", marginBottom: "0.25rem", color: "var(--color-info)" }}>الكتب والمذكرات</h3>
                <p className="settings-description">أضف الكتب مع تحديد سعرها وارتباطها بالسنة الدراسية.</p>
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
                  <div key={book.id} style={{ display: "flex", gap: "1rem", alignItems: "flex-end", background: "rgba(15,23,42,0.4)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-color)", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 200px" }}>
                      <Input
                        label={`اسم الكتاب (${index + 1})`}
                        value={book.name}
                        onChange={(e) => handleUpdateBook(book.id, "name", e.target.value)}
                        placeholder="مثال: مذكرة الشرح"
                        required
                        leftIcon={<BookOpen size={18} />}
                      />
                    </div>
                    <div style={{ flex: "1 1 150px" }}>
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
                    <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>السنة الدراسية (اختياري)</label>
                      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <select
                          className="form-input"
                          value={book.grade_id || ""}
                          onChange={(e) => handleUpdateBook(book.id, "grade_id", e.target.value)}
                          style={{ width: "100%" }}
                        >
                          <option value="">كتاب عام (لا يرتبط بسنة)</option>
                          {grades.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      </div>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", background: "rgba(20, 184, 166, 0.05)", padding: "1.5rem", borderRadius: "10px", border: "1px solid rgba(20, 184, 166, 0.2)" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--color-teal)" }}>حفظ جميع التغييرات</h3>
              <p className="settings-description" style={{ margin: 0 }}>سيتم حفظ البيانات الشخصية، السنين الدراسية، والكتب دفعة واحدة.</p>
            </div>
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
      </div>
      </div>

      <div style={{ flex: "1 1 300px", maxWidth: "380px", position: "sticky", top: "2rem", minWidth: "300px" }}>
        {/* Support Card */}
        <div className="glass-panel panel-content" style={{ padding: "2.5rem 2rem", textAlign: "center", background: "linear-gradient(145deg, rgba(16,185,129,0.05) 0%, rgba(16,185,129,0.1) 100%)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto", boxShadow: "0 10px 25px -5px rgba(16,185,129,0.4)" }}>
            <MessageCircle size={35} color="white" />
          </div>
          <h3 style={{ fontSize: "1.3rem", marginBottom: "0.75rem", fontWeight: 700 }}>هل تحتاج إلى مساعدة؟</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "2rem", lineHeight: "1.6" }}>
            فريق الدعم الفني متواجد دائماً لمساعدتك في أي استفسار أو مشكلة تواجهك في المنصة.
          </p>
          <a href="https://wa.me/201028583616" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", backgroundColor: "#25D366", borderColor: "#25D366", color: "white", padding: "0.75rem", fontSize: "1rem" }}>
            <MessageCircle size={20} />
            تواصل معنا عبر واتساب
          </a>
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
    </div>
  );
}
