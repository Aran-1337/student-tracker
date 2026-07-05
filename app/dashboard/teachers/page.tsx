"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Users, Plus, Trash2, Edit3, Save, X, AlertCircle } from "lucide-react";

interface SubTeacher {
  id: string;
  name: string;
  created_at: string;
}

export default function CenterTeachersPage() {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<SubTeacher[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("sub_teachers")
        .select("*")
        .eq("center_id", session.user.id)
        .order("created_at", { ascending: true });

      if (error) {
        // Fallback to local storage if DB is missing table
        const local = JSON.parse(localStorage.getItem("sub_teachers_local") || "[]");
        setTeachers(local);
        throw error;
      }

      setTeachers(data || []);
    } catch (err: any) {
      console.error(err);
      const local = JSON.parse(localStorage.getItem("sub_teachers_local") || "[]");
      setTeachers(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;

    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const newId = `sub-${Date.now()}`;
      const newTeacherObj = { id: newId, center_id: session.user.id, name: newTeacherName.trim() };

      const { error } = await supabase
        .from("sub_teachers")
        .insert([newTeacherObj]);

      if (error) {
        // Use local storage fallback
        const local = JSON.parse(localStorage.getItem("sub_teachers_local") || "[]");
        local.push(newTeacherObj);
        localStorage.setItem("sub_teachers_local", JSON.stringify(local));
      }

      setNewTeacherName("");
      setShowAddForm(false);
      showToast("تم إضافة المعلم بنجاح!");
      fetchTeachers();
    } catch (err: any) {
      showToast("فشل إضافة المعلم.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف المعلم "${name}"؟`)) return;

    try {
      const { error } = await supabase
        .from("sub_teachers")
        .delete()
        .eq("id", id);

      if (error) {
        const local = JSON.parse(localStorage.getItem("sub_teachers_local") || "[]");
        const filtered = local.filter((t: any) => t.id !== id);
        localStorage.setItem("sub_teachers_local", JSON.stringify(filtered));
      }
      
      showToast("تم حذف المعلم.");
      fetchTeachers();
    } catch (err: any) {
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
        <div className={`toast ${toast.type}`}>
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
          <form onSubmit={handleAddTeacher} style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
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
            <div style={{ display: "flex", gap: "0.5rem" }}>
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
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(teacher => (
                <tr key={teacher.id}>
                  <td style={{ fontWeight: 600 }}>{teacher.name}</td>
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
