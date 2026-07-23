"use client";

import { GraduationCap, AlertTriangle, BookOpen, ChevronLeft } from "lucide-react";

export interface GradeStat {
  id: string;
  name: string;
  paidThisMonth: number;
  earnings: number;
}

export interface BookStat {
  id: string;
  name: string;
  price: number;
  count: number;
  earnings: number;
  gradeName?: string;
}

interface Props {
  topGrade: GradeStat | null;
  unpaidCount: number;
  topBook: BookStat | null;
  totalStudents: number;
  currentMonthName: string;
  onShowUnpaid: () => void;
}

export function InsightsStrip({ topGrade, unpaidCount, topBook, totalStudents, currentMonthName, onShowUnpaid }: Props) {
  return (
    <div className="reports-insights-grid">

      {/* Top Grade */}
      <div className="glass-panel" style={{ padding: "1.25rem", display: "flex", gap: "1rem", alignItems: "center" }}>
        <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "10px", background: "rgba(59,130,246,0.12)", color: "var(--color-info)", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <GraduationCap size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>أعلى سنة ربحاً — {currentMonthName}</p>
          {topGrade ? (
            <>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{topGrade.name}</p>
              <p className="monospace" style={{ fontSize: "0.82rem", color: "var(--color-info)", marginTop: "0.15rem" }}>{topGrade.earnings.toLocaleString()} ج.م</p>
            </>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>لا توجد بيانات</p>
          )}
        </div>
      </div>

      {/* Unpaid Students */}
      <button
        onClick={onShowUnpaid}
        style={{ all: "unset", cursor: "pointer", display: "block", width: "100%" }}
      >
        <div className="glass-panel" style={{
          padding: "1.25rem", display: "flex", gap: "1rem", alignItems: "center",
          borderColor: unpaidCount > 0 ? "rgba(239,68,68,0.25)" : "var(--border-color)",
          background: unpaidCount > 0 ? "rgba(239,68,68,0.04)" : undefined,
          transition: "var(--transition-smooth)",
        }}>
          <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "10px", background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertTriangle size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>طلاب لم يدفعوا — {currentMonthName}</p>
            <p style={{ fontWeight: 700, fontSize: "0.95rem", color: unpaidCount > 0 ? "#f87171" : "var(--text-primary)" }}>
              {unpaidCount} طالب من {totalStudents}
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>اضغط لعرض القائمة</p>
          </div>
          <ChevronLeft size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        </div>
      </button>

      {/* Top Book */}
      <div className="glass-panel" style={{ padding: "1.25rem", display: "flex", gap: "1rem", alignItems: "center" }}>
        <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "10px", background: "rgba(245,158,11,0.12)", color: "var(--color-amber)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <BookOpen size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>أعلى كتاب مبيعاً</p>
          {topBook ? (
            <>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{topBook.name}</p>
              <p className="monospace" style={{ fontSize: "0.82rem", color: "var(--color-amber)", marginTop: "0.15rem" }}>{topBook.count} نسخة · {topBook.earnings.toLocaleString()} ج.م</p>
            </>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>لا توجد كتب</p>
          )}
        </div>
      </div>

    </div>
  );
}
