"use client";

import { useState } from "react";
import { BillTemplate } from "@/lib/types";
import { Plus, Trash2, Pencil, Power, Repeat, Check, X, AlertCircle, Calendar } from "./Icons";
import { CATEGORIES, Category, CAT_STYLE, arabicMonths } from "../_hooks/useBills";

interface Props {
  templates: BillTemplate[];
  userId: string;
  actionLoading: boolean;
  onAdd: (data: Omit<BillTemplate, "id" | "created_at">) => Promise<boolean>;
  onUpdate: (id: string, updates: Partial<Omit<BillTemplate, "id" | "created_at" | "teacher_id">>) => void;
  onToggle: (template: BillTemplate) => void;
  onDelete: (id: string) => void;
}

const EMPTY_FORM = { title: "", amount: "", category: "إيجار" as Category, end_month: "", end_year: "" };

export default function TemplatesManager({
  templates, userId, actionLoading, onAdd, onUpdate, onToggle, onDelete,
}: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear + 1, currentYear + 2];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onAdd({
      teacher_id: userId,
      title: form.title,
      amount: Number(form.amount),
      category: form.category,
      is_active: true,
      end_month: form.end_month ? Number(form.end_month) : null,
      end_year: form.end_year ? Number(form.end_year) : null,
    });
    if (ok) setForm(EMPTY_FORM);
  };

  const startEdit = (t: BillTemplate) => {
    setEditingId(t.id);
    setEditForm({
      title: t.title,
      amount: String(t.amount),
      category: t.category,
      end_month: t.end_month ? String(t.end_month) : "",
      end_year: t.end_year ? String(t.end_year) : "",
    });
  };

  const saveEdit = (id: string) => {
    onUpdate(id, {
      title: editForm.title,
      amount: Number(editForm.amount),
      category: editForm.category,
      end_month: editForm.end_month ? Number(editForm.end_month) : null,
      end_year: editForm.end_year ? Number(editForm.end_year) : null,
    });
    setEditingId(null);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "1.5rem", alignItems: "start" }}>

      {/* Add Template Form */}
      <div className="glass-panel panel-content">
        <h2 className="panel-title">
          <Repeat size={18} style={{ color: "#10b981" }} />
          <span>قالب متكرر جديد</span>
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">اسم القالب</label>
            <input
              type="text" required placeholder="مثال: إيجار قاعة أ"
              className="form-input" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">التصنيف</label>
            <select className="form-input" value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value as Category }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">القيمة الشهرية (ج.م)</label>
            <input
              type="number" min="0" required placeholder="0"
              className="form-input" value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              style={{ direction: "ltr", textAlign: "right" }}
            />
          </div>

          {/* End date — optional */}
          <div style={{
            padding: "0.875rem", borderRadius: "10px", marginBottom: "1rem",
            border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.02)",
          }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Calendar size={13} />
              تاريخ الانتهاء (اختياري)
            </div>
            <div className="form-row" style={{ marginBottom: 0 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">الشهر</label>
                <select className="form-input" value={form.end_month}
                  onChange={e => setForm(p => ({ ...p, end_month: e.target.value }))}>
                  <option value="">بلا نهاية</option>
                  {arabicMonths.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">السنة</label>
                <select className="form-input" value={form.end_year}
                  onChange={e => setForm(p => ({ ...p, end_year: e.target.value }))}>
                  <option value="">—</option>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              بعد هذا التاريخ لن يتم توليد الفاتورة تلقائياً
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={actionLoading}>
            <Plus size={16} />
            {actionLoading ? "جاري الإضافة..." : "إضافة القالب"}
          </button>
        </form>
      </div>

      {/* Templates List */}
      <div className="glass-panel panel-content">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h2 className="panel-title" style={{ margin: 0 }}>
            <Repeat size={18} style={{ color: "#10b981" }} />
            <span>القوالب المتكررة ({templates.length})</span>
          </h2>
          <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.78rem" }}>
            <span style={{ padding: "3px 10px", borderRadius: "999px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}>
              {templates.filter(t => t.is_active).length} نشط
            </span>
            <span style={{ padding: "3px 10px", borderRadius: "999px", background: "rgba(156,163,175,0.1)", border: "1px solid rgba(156,163,175,0.2)", color: "#9ca3af" }}>
              {templates.filter(t => !t.is_active).length} موقوف
            </span>
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={40} className="empty-state-icon" />
            <p>لا توجد قوالب بعد. أضف قالباً من اليسار.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {templates.map(t => (
              <div key={t.id} style={{
                borderRadius: "12px", overflow: "hidden",
                border: t.is_active ? "1px solid rgba(16,185,129,0.25)" : "1px solid var(--border-color)",
                background: t.is_active ? "rgba(16,185,129,0.04)" : "rgba(255,255,255,0.02)",
                opacity: t.is_active ? 1 : 0.6,
                transition: "all 0.2s ease",
              }}>
                {editingId === t.id ? (
                  /* ── Edit inline ── */
                  <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div className="form-row" style={{ marginBottom: 0 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">الاسم</label>
                        <input type="text" className="form-input" value={editForm.title}
                          onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">القيمة</label>
                        <input type="number" min="0" className="form-input" value={editForm.amount}
                          onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))}
                          style={{ direction: "ltr", textAlign: "right" }} />
                      </div>
                    </div>
                    <div className="form-row" style={{ marginBottom: 0 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">التصنيف</label>
                        <select className="form-input" value={editForm.category}
                          onChange={e => setEditForm(p => ({ ...p, category: e.target.value as Category }))}>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">ينتهي في</label>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <select className="form-input" value={editForm.end_month}
                            onChange={e => setEditForm(p => ({ ...p, end_month: e.target.value }))}>
                            <option value="">—</option>
                            {arabicMonths.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                          </select>
                          <select className="form-input" value={editForm.end_year}
                            onChange={e => setEditForm(p => ({ ...p, end_year: e.target.value }))}>
                            <option value="">—</option>
                            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="btn btn-primary" onClick={() => saveEdit(t.id)} disabled={actionLoading}
                        style={{ flex: 1, padding: "0.45rem" }}>
                        <Check size={15} /> حفظ
                      </button>
                      <button className="btn btn-secondary" onClick={() => setEditingId(null)}
                        style={{ padding: "0.45rem 0.75rem" }}>
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Display row ── */
                  <div style={{ padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {/* Active toggle */}
                    <button
                      onClick={() => onToggle(t)}
                      title={t.is_active ? "إيقاف القالب" : "تفعيل القالب"}
                      style={{
                        width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
                        background: t.is_active ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                        border: t.is_active ? "1px solid rgba(16,185,129,0.3)" : "1px solid var(--border-color)",
                        color: t.is_active ? "#10b981" : "var(--text-muted)",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Power size={14} />
                    </button>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "#fff" }}>{t.title}</span>
                        <span style={{ fontSize: "0.75rem", padding: "1px 7px", borderRadius: "4px", ...CAT_STYLE[t.category] }}>
                          {t.category}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        <span className="monospace" style={{ color: "#f87171", fontWeight: 700 }}>
                          -{Number(t.amount).toLocaleString()} ج.م / شهر
                        </span>
                        {t.end_month && t.end_year && (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#f59e0b" }}>
                            <Calendar size={11} />
                            ينتهي {arabicMonths[t.end_month - 1]} {t.end_year}
                          </span>
                        )}
                        {!t.is_active && (
                          <span style={{ color: "#9ca3af" }}>موقوف</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "0.35rem" }}>
                      <button className="btn btn-secondary btn-icon" onClick={() => startEdit(t)}
                        style={{ width: "30px", height: "30px" }} title="تعديل">
                        <Pencil size={13} style={{ color: "var(--color-info)" }} />
                      </button>
                      <button className="btn btn-secondary btn-icon" onClick={() => onDelete(t.id)}
                        style={{ width: "30px", height: "30px" }} title="حذف">
                        <Trash2 size={13} className="color-danger" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
