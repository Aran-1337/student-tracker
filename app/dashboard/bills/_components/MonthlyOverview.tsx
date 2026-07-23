"use client";

import { Bill, BillTemplate } from "@/lib/types";
import { arabicMonths } from "../_hooks/useBills";
import { Zap, Check, TrendingDown } from "./Icons";

interface Props {
  bills: Bill[];
  activeYear: number;
  templates: BillTemplate[];
  actionLoading: boolean;
  onMonthClick: (month: number) => void;
  onGenerate: (month: number, year: number) => void;
}

export default function MonthlyOverview({
  bills, activeYear, templates, actionLoading, onMonthClick, onGenerate,
}: Props) {
  const activeTemplates = templates.filter(t => t.is_active);
  const yearBills = bills.filter(b => b.billing_year === activeYear);
  const maxMonthTotal = Math.max(
    ...arabicMonths.map((_, i) =>
      yearBills.filter(b => b.billing_month === i + 1).reduce((s, b) => s + Number(b.amount), 0)
    ),
    1
  );

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  return (
    <div className="glass-panel panel-content" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <h2 className="panel-title" style={{ margin: 0 }}>
          <TrendingDown size={18} style={{ color: "#f87171" }} />
          <span>نظرة شهرية — {activeYear}</span>
        </h2>
        {activeTemplates.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
            <Zap size={13} style={{ color: "#10b981" }} />
            <span>{activeTemplates.length} قالب نشط</span>
          </div>
        )}
      </div>

      <div className="monthly-overview-grid">
        {arabicMonths.map((m, idx) => {
          const monthNum = idx + 1;
          const monthBills = yearBills.filter(b => b.billing_month === monthNum);
          const total = monthBills.reduce((s, b) => s + Number(b.amount), 0);
          const barPct = maxMonthTotal > 0 ? (total / maxMonthTotal) * 100 : 0;
          const isCurrentMonth = monthNum === currentMonth && activeYear === currentYear;

          const existingFromTemplates = monthBills.filter(b => b.template_id);
          const isFull = activeTemplates.length > 0 && activeTemplates.every(t =>
            existingFromTemplates.some(b => b.template_id === t.id)
          );
          const isPartial = existingFromTemplates.length > 0 && !isFull;

          // color intensity based on spend
          const intensity = barPct / 100;
          const cardBg = total > 0
            ? `rgba(239,68,68,${0.03 + intensity * 0.08})`
            : "rgba(255,255,255,0.02)";
          const cardBorder = isCurrentMonth
            ? "rgba(20,184,166,0.5)"
            : total > 0
              ? `rgba(239,68,68,${0.1 + intensity * 0.2})`
              : "var(--border-color)";

          return (
            <div
              key={idx}
              onClick={() => onMonthClick(monthNum)}
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: "12px",
                padding: "0.875rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
            >
              {/* Current month glow */}
              {isCurrentMonth && (
                <div style={{
                  position: "absolute", top: 0, right: 0,
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: "var(--color-teal)", margin: "6px",
                  boxShadow: "0 0 6px var(--color-teal)",
                }} />
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <span style={{
                  fontSize: "0.82rem", fontWeight: 700,
                  color: isCurrentMonth ? "var(--color-teal)" : "var(--text-secondary)",
                }}>
                  {m}
                </span>
                {/* Recurring status icon */}
                {activeTemplates.length > 0 && (
                  <button
                    onClick={e => { e.stopPropagation(); if (!isFull) onGenerate(monthNum, activeYear); }}
                    disabled={actionLoading || isFull}
                    title={isFull ? `تم توليد ${m}` : `توليد فواتير ${m}`}
                    style={{
                      background: "none", border: "none", cursor: isFull ? "default" : "pointer", padding: "2px",
                      color: isFull ? "#10b981" : isPartial ? "#f59e0b" : "var(--text-muted)",
                      opacity: actionLoading ? 0.5 : 1,
                    }}
                  >
                    {isFull ? <Check size={13} /> : <Zap size={13} />}
                  </button>
                )}
              </div>

              {/* Amount */}
              <div className="monospace" style={{
                fontSize: total > 0 ? "0.95rem" : "0.8rem",
                fontWeight: 700,
                color: total > 0 ? "#f87171" : "var(--text-muted)",
                marginBottom: "0.5rem",
              }}>
                {total > 0 ? `-${Number(total).toLocaleString()}` : "—"}
              </div>

              {/* Progress bar */}
              <div style={{
                height: "3px", borderRadius: "2px",
                background: "rgba(255,255,255,0.06)", overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", borderRadius: "2px",
                  width: `${barPct}%`,
                  background: barPct > 70
                    ? "linear-gradient(90deg, #f87171, #ef4444)"
                    : barPct > 40
                      ? "linear-gradient(90deg, #f59e0b, #f87171)"
                      : "var(--color-teal)",
                  transition: "width 0.4s ease",
                }} />
              </div>

              {/* Bills count */}
              {monthBills.length > 0 && (
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                  {monthBills.length} فاتورة
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
