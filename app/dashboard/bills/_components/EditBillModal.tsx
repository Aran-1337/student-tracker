"use client";

import { useState, useEffect } from "react";
import { Bill } from "@/lib/types";
import { X, Save } from "./Icons";
import { arabicMonths, CATEGORIES, Category } from "../_hooks/useBills";

interface Props {
  bill: Bill;
  actionLoading: boolean;
  onSave: (id: string, updates: Partial<Omit<Bill, "id" | "created_at" | "teacher_id">>) => void;
  onClose: () => void;
}

export default function EditBillModal({ bill, actionLoading, onSave, onClose }: Props) {
  const [title, setTitle] = useState(bill.title);
  const [amount, setAmount] = useState(String(bill.amount));
  const [category, setCategory] = useState<Category>(bill.category);
  const [billingMonth, setBillingMonth] = useState(bill.billing_month);
  const [billingYear, setBillingYear] = useState(bill.billing_year);
  const [isRecurring, setIsRecurring] = useState(bill.is_recurring);

  useEffect(() => {
    setTitle(bill.title);
    setAmount(String(bill.amount));
    setCategory(bill.category);
    setBillingMonth(bill.billing_month);
    setBillingYear(bill.billing_year);
    setIsRecurring(bill.is_recurring);
  }, [bill]);

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) return;
    onSave(bill.id, {
      title, amount: parsedAmount, category,
      billing_month: billingMonth, billing_year: billingYear, is_recurring: isRecurring,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "460px" }}>
        <div className="modal-header">
          <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>تعديل الفاتورة</h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "1.5rem" }}>
          <div className="form-group">
            <label className="form-label">بيان الفاتورة</label>
            <input
              type="text" required className="form-input"
              value={title} onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">التصنيف</label>
            <select className="form-input" value={category} onChange={e => setCategory(e.target.value as Category)}>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">القيمة (ج.م)</label>
              <input
                type="number" min="0" required className="form-input"
                value={amount} onChange={e => setAmount(e.target.value)}
                style={{ direction: "ltr", textAlign: "right" }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">الشهر</label>
              <select className="form-input" value={billingMonth} onChange={e => setBillingMonth(Number(e.target.value))}>
                {arabicMonths.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">السنة المالية</label>
            <select className="form-input" value={billingYear} onChange={e => setBillingYear(Number(e.target.value))}>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div
            onClick={() => setIsRecurring(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.75rem 1rem", borderRadius: "10px", cursor: "pointer",
              border: isRecurring ? "1px solid rgba(16,185,129,0.4)" : "1px solid var(--border-color)",
              background: isRecurring ? "rgba(16,185,129,0.07)" : "rgba(255,255,255,0.02)",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{
              width: "42px", height: "24px", borderRadius: "12px", flexShrink: 0,
              background: isRecurring ? "#10b981" : "rgba(255,255,255,0.1)",
              position: "relative", transition: "background 0.25s ease",
            }}>
              <div style={{
                position: "absolute", top: "3px",
                right: isRecurring ? "3px" : "calc(100% - 21px)",
                width: "18px", height: "18px", borderRadius: "50%",
                background: "#fff", transition: "right 0.25s ease",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }} />
            </div>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: isRecurring ? "#10b981" : "var(--text-primary)" }}>
              فاتورة متكررة شهرياً
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={actionLoading}>
              <Save size={16} />
              <span>{actionLoading ? "جاري الحفظ..." : "حفظ التعديلات"}</span>
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={actionLoading}>
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
