"use client";

import { useState } from "react";
import { X, Plus, Repeat, Calendar } from "./Icons";
import { arabicMonths, CATEGORIES, Category } from "../_hooks/useBills";
import { BillTemplate } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  actionLoading: boolean;
  defaultYear: number;
  onAdd: (
    title: string, amount: string, category: Category,
    billingMonth: number, billingYear: number, isRecurring: boolean
  ) => Promise<boolean>;
  onAddTemplate: (data: Omit<BillTemplate, "id" | "created_at">) => Promise<boolean>;
  userId: string | null;
}

export default function AddBillDrawer({ open, onClose, actionLoading, defaultYear, onAdd, onAddTemplate, userId }: Props) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("إيجار");
  const [billingMonth, setBillingMonth] = useState(new Date().getMonth() + 1);
  const [billingYear, setBillingYear] = useState(defaultYear);
  const [isRecurring, setIsRecurring] = useState(false);
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState("");

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const reset = () => {
    setTitle(""); setAmount(""); setCategory("إيجار");
    setBillingMonth(new Date().getMonth() + 1); setBillingYear(defaultYear);
    setIsRecurring(false); setEndMonth(""); setEndYear("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    if (isRecurring && userId) {
      const ok = await onAddTemplate({
        teacher_id: userId,
        title,
        amount: Number(amount),
        category,
        is_active: true,
        end_month: endMonth ? Number(endMonth) : null,
        end_year: endYear ? Number(endYear) : null,
      });
      if (ok) { reset(); onClose(); }
    } else {
      const ok = await onAdd(title, amount, category, billingMonth, billingYear, false);
      if (ok) { reset(); onClose(); }
    }
  };

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ alignItems: "flex-start", justifyContent: "flex-start", padding: 0 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(420px, 100vw)", height: "100vh",
          background: "var(--bg-secondary)", borderLeft: "1px solid var(--border-color)",
          display: "flex", flexDirection: "column",
          animation: "slideInRight 0.25s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "rgba(0,0,0,0.2)",
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>
            {isRecurring ? "إضافة فاتورة متكررة" : "تسجيل فاتورة جديدة"}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0" }}>

          {/* Recurring Toggle */}
          <div
            onClick={() => setIsRecurring(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.75rem 1rem", borderRadius: "10px", cursor: "pointer",
              border: isRecurring ? "1px solid rgba(16,185,129,0.4)" : "1px solid var(--border-color)",
              background: isRecurring ? "rgba(16,185,129,0.07)" : "rgba(255,255,255,0.02)",
              transition: "all 0.2s ease", marginBottom: "1.25rem",
            }}
          >
            <div style={{
              width: "38px", height: "22px", borderRadius: "11px", flexShrink: 0,
              background: isRecurring ? "#10b981" : "rgba(255,255,255,0.1)",
              position: "relative", transition: "background 0.2s ease",
            }}>
              <div style={{
                position: "absolute", top: "3px",
                right: isRecurring ? "3px" : "calc(100% - 19px)",
                width: "16px", height: "16px", borderRadius: "50%",
                background: "#fff", transition: "right 0.2s ease",
              }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Repeat size={14} style={{ color: isRecurring ? "#10b981" : "var(--text-muted)" }} />
              <span style={{ fontWeight: 600, fontSize: "0.88rem", color: isRecurring ? "#10b981" : "var(--text-secondary)" }}>
                فاتورة متكررة شهرياً
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">بيان الفاتورة</label>
            <input
              type="text" required placeholder="مثال: إيجار قاعة أ"
              className="form-input" value={title} onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">التصنيف</label>
            <select className="form-input" value={category} onChange={e => setCategory(e.target.value as Category)}>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">القيمة (ج.م)</label>
            <input
              type="number" min="0" required placeholder="0"
              className="form-input" value={amount} onChange={e => setAmount(e.target.value)}
              style={{ direction: "ltr", textAlign: "right" }}
            />
          </div>

          {/* One-time only fields */}
          {!isRecurring && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">الشهر</label>
                <select className="form-input" value={billingMonth} onChange={e => setBillingMonth(Number(e.target.value))}>
                  {arabicMonths.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">السنة</label>
                <select className="form-input" value={billingYear} onChange={e => setBillingYear(Number(e.target.value))}>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Recurring end date */}
          {isRecurring && (
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
                  <select className="form-input" value={endMonth} onChange={e => setEndMonth(e.target.value)}>
                    <option value="">بلا نهاية</option>
                    {arabicMonths.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">السنة</label>
                  <select className="form-input" value={endYear} onChange={e => setEndYear(e.target.value)}>
                    <option value="">—</option>
                    {[currentYear, currentYear + 1, currentYear + 2].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                بعد هذا التاريخ لن يتم توليد الفاتورة تلقائياً
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }} disabled={actionLoading}>
            <Plus size={18} />
            <span>{actionLoading ? "جاري التسجيل..." : isRecurring ? "إضافة كقالب متكرر" : "تسجيل الفاتورة"}</span>
          </button>
        </form>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
      `}</style>
    </div>
  );
}
