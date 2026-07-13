"use client";

import { useState, useEffect } from "react";
import { AuthService } from "@/lib/services/authService";
import { SubTeachersService } from "@/lib/services/subTeachersService";
import { GradesService } from "@/lib/services/gradesService";
import { Grade } from "@/lib/types";
import { Users, Plus, Trash2, Edit3, Save, X, AlertCircle } from "lucide-react";

interface SubTeacher {
  id: string;
  name: string;
  name: string;
  subject?: string;
  grade_ids?: string[];
  created_at: string;
}

export default function CenterTeachersPage() {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<SubTeacher[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherSubject, setNewTeacherSubject] = useState("");
  const [newTeacherGrades, setNewTeacherGrades] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTeachers = async () => {
    try {
      const { data: { session } } = await AuthService.getSession();
      if (!session) return;

      const [data, gradesData] = await Promise.all([
        SubTeachersService.getSubTeachersByCenterId(session.user.id),
        GradesService.getGradesByTeacherId(session.user.id)
      ]);

      setTeachers(data || []);
      setGrades(gradesData || []);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    fetchTeachers();
  }, []);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;

    setActionLoading(true);
    try {
      const { data: { session } } = await AuthService.getSession();
      if (!session) return;

      const newTeacherObj = { 
        center_id: session.user.id, 
        name: newTeacherName.trim(),
        subject: newTeacherSubject.trim() || null,
        grade_ids: newTeacherGrades
      };

      await SubTeachersService.addSubTeacher(newTeacherObj);

      setNewTeacherName("");
      setNewTeacherSubject("");
      setNewTeacherGrades([]);
      setShowAddForm(false);
      showToast("تم إضافة المعلم بنجاح!");
      fetchTeachers();
    } catch (err: any) {
      showToast(err.message || "فشل إضافة المعلم.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف المعلم "${name}"؟`)) return;

    try {
      await SubTeachersService.deleteSubTeacher(id);

      
      showToast("تم حذف المعلم.");
      fetchTeachers();
    } catch {
      showToast("فشل الحذف.", "error");
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
      {toast && (
        <div className={`alert-toast alert-${toast.type}`}>
          {toast.type === "error" ? <AlertCircle size={20} /> : <Save size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>إدارة المعلمين</h1>
          <p style={{ color: "var(--text-secondary)" }}>إضافة وإدارة المعلمين التابعين للسنتر لربطهم بالمجموعات</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddForm(true)}
          style={{ gap: "0.5rem" }}
        >
          <Plus size={18} />
          <span>إضافة معلم جديد</span>
        </button>
      </div>

      {showAddForm && (
        <div className="glass-panel panel-content" style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--color-teal)" }}>إضافة معلم جديد</h3>
          <form onSubmit={handleAddTeacher} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div className="form-group" style={{ margin: 0, flex: "1 1 250px" }}>
                <label className="form-label" htmlFor="tName">اسم المعلم</label>
                <input
                  id="tName"
                  type="text"
                  className="form-input"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  placeholder="أدخل اسم المعلم ثلاثي أو ثنائي"
                  required
                />
              </div>
              <div className="form-group" style={{ margin: 0, flex: "1 1 250px" }}>
                <label className="form-label" htmlFor="tSubject">المادة الدراسية</label>
                <input
                  id="tSubject"
                  type="text"
                  className="form-input"
                  value={newTeacherSubject}
                  onChange={(e) => setNewTeacherSubject(e.target.value)}
                  placeholder="مثال: اللغة العربية، الكيمياء..."
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">السنين الدراسية التي يُدرّس لها</label>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                {grades.map(grade => (
                  <label key={grade.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", background: "rgba(255,255,255,0.05)", padding: "0.5rem 1rem", borderRadius: "8px" }}>
                    <input 
                      type="checkbox" 
                      checked={newTeacherGrades.includes(grade.id)}
                      onChange={(e) => {
                        if (e.target.checked) setNewTeacherGrades([...newTeacherGrades, grade.id]);
                        else setNewTeacherGrades(newTeacherGrades.filter(id => id !== grade.id));
                      }}
                      style={{ accentColor: "var(--color-teal)", width: "1.2rem", height: "1.2rem" }}
                    />
                    <span style={{ fontSize: "0.95rem" }}>{grade.name}</span>
                  </label>
                ))}
                {grades.length === 0 && <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>لم تقم بإضافة أي سنين دراسية في الإعدادات بعد.</span>}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                {actionLoading ? "جاري الحفظ..." : "حفظ"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel panel-content" style={{ padding: 0, overflow: "hidden" }}>
        {teachers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)" }}>
            <Users size={48} style={{ margin: "0 auto 1rem auto", opacity: 0.5 }} />
            <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>لا يوجد معلمين مضافين</p>
            <p style={{ fontSize: "0.9rem" }}>أضف معلمين لربطهم بمجموعات المركز</p>
          </div>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>اسم المعلم</th>
                <th>المادة الدراسية</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(teacher => (
                <tr key={teacher.id}>
                  <td style={{ fontWeight: 600 }}>{teacher.name}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{teacher.subject || "—"}</td>
                  <td>
                    <button
                      onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                      className="btn-icon"
                      style={{ color: "#f87171", border: "none", background: "none", cursor: "pointer" }}
                      title="حذف المعلم"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
