"use client";

import { TrendingDown, Home, Users, MoreHorizontal, Repeat } from "./Icons";

interface Props {
  totalYear: number;
  categoryTotals: Record<string, number>;
  activeYear: number;
  billsCount: number;
  recurringCount: number;
}

export default function BillsSummaryCards({ totalYear, categoryTotals, activeYear, billsCount, recurringCount }: Props) {
  const rent = categoryTotals["إيجار"] || 0;
  const salaries = categoryTotals["رواتب سكرتارية"] || 0;
  const other = categoryTotals["أخرى"] || 0;

  const cats = [
    { label: "إيجار", value: rent, color: "#60a5fa", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)", icon: <Home size={16} /> },
    { label: "رواتب سكرتارية", value: salaries, color: "#c084fc", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.2)", icon: <Users size={16} /> },
    { label: "أخرى", value: other, color: "#9ca3af", bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.2)", icon: <MoreHorizontal size={16} /> },
  ];

  return (
    <div className="bills-summary-grid">
      {/* Total card — bigger */}
      <div className="glass-panel" style={{
        padding: "1.25rem 1.5rem",
        background: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.03))",
        borderColor: "rgba(239,68,68,0.2)",
        gridColumn: "span 1",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.25)",
            color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <TrendingDown size={16} />
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>إجمالي {activeYear}</span>
        </div>
        <div className="monospace" style={{ fontSize: "1.6rem", fontWeight: 700, color: "#f87171", lineHeight: 1 }}>
          {Number(totalYear).toLocaleString()}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>جنيه مصري</div>
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>
          <span>{billsCount} فاتورة</span>
          <span>·</span>
          <span style={{ color: "#10b981" }}>{recurringCount} متكررة</span>
        </div>
      </div>

      {/* Category cards */}
      {cats.map(cat => (
        <div key={cat.label} className="glass-panel" style={{
          padding: "1.25rem 1.5rem",
          background: cat.bg.replace("0.1", "0.04"),
          borderColor: cat.border,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: cat.bg, border: `1px solid ${cat.border}`,
              color: cat.color, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {cat.icon}
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{cat.label}</span>
          </div>
          <div className="monospace" style={{ fontSize: "1.35rem", fontWeight: 700, color: cat.color, lineHeight: 1 }}>
            {Number(cat.value).toLocaleString()}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>ج.م</div>
          {/* % of total */}
          {totalYear > 0 && (
            <div style={{ marginTop: "0.75rem" }}>
              <div style={{ height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: "2px",
                  width: `${Math.round((cat.value / totalYear) * 100)}%`,
                  background: cat.color, transition: "width 0.5s ease",
                }} />
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                {Math.round((cat.value / totalYear) * 100)}% من الإجمالي
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
