import { CheckCircle, XCircle } from "lucide-react";
import { Student } from "@/lib/types";

const arabicMonths = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const currentMonthIdx = new Date().getMonth();

interface Props {
  student: Student;
  onToggleMonth: (idx: number) => void;
}

export function StudentPaymentCard({ student, onToggleMonth }: Props) {
  const months = student.months || Array(12).fill(false);
  const paidMonths = months.filter(Boolean).length;
  const paidThisMonth = months[currentMonthIdx] === true;

  return (
    <div className="glass-panel panel-content">
      <h3 className="panel-title" style={{ marginBottom: "1rem" }}>
        <CheckCircle size={16} style={{ color: "var(--color-teal)" }} />
        <span>سجل الدفع</span>
        <span style={{ marginRight: "auto", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 400 }}>
          {paidMonths}/12 شهر
        </span>
      </h3>

      {/* Current month status */}
      <div style={{
        marginBottom: "1rem", padding: "0.65rem 1rem", borderRadius: "10px",
        background: paidThisMonth ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
        border: `1px solid ${paidThisMonth ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
        display: "flex", alignItems: "center", gap: "0.5rem",
      }}>
        {paidThisMonth
          ? <CheckCircle size={16} style={{ color: "#10b981" }} />
          : <XCircle size={16} style={{ color: "#ef4444" }} />}
        <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>
          {arabicMonths[currentMonthIdx]}: {paidThisMonth ? "مدفوع ✓" : "لم يدفع بعد"}
        </span>
      </div>

      {/* Month grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "0.4rem" }}>
        {months.map((isPaid, idx) => (
          <button
            key={idx}
            onClick={() => onToggleMonth(idx)}
            title={`${arabicMonths[idx]} - ${isPaid ? "مدفوع" : "غير مدفوع"}`}
            style={{
              padding: "0.5rem 0",
              borderRadius: "8px",
              border: idx === currentMonthIdx ? "2px solid var(--color-teal)" : "1px solid rgba(255,255,255,0.08)",
              background: isPaid ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.03)",
              color: isPaid ? "#10b981" : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "0.72rem",
              fontWeight: idx === currentMonthIdx ? 700 : 400,
              transition: "all 0.2s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
            }}
          >
            <span style={{ fontSize: "0.65rem", opacity: 0.7 }}>{arabicMonths[idx].slice(0, 3)}</span>
            {isPaid
              ? <CheckCircle size={12} />
              : <XCircle size={12} style={{ opacity: 0.3 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}
