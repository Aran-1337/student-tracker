"use client";

import { DollarSign, TrendingUp, Receipt, BookOpen, ArrowUp, ArrowDown, Minus } from "lucide-react";

interface Props {
  totalNetProfit: number;
  totalGrossEarnings: number;
  totalExpenses: number;
  totalBookEarnings: number;
  prevMonthNetProfit: number;
  prevMonthGrossEarnings: number;
  prevMonthExpenses: number;
  prevMonthBookEarnings: number;
}

function TrendBadge({ current, prev }: { current: number; prev: number }) {
  if (prev === 0 && current === 0) return null;
  const diff = prev === 0 ? 100 : Math.round(((current - prev) / prev) * 100);
  if (diff === 0) return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "0.75rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "999px" }}>
      <Minus size={11} /> لا تغيير
    </span>
  );
  const up = diff > 0;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "0.75rem",
      color: up ? "#10b981" : "#f87171",
      background: up ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
      border: `1px solid ${up ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
      padding: "2px 8px", borderRadius: "999px", fontFamily: "'JetBrains Mono', monospace"
    }}>
      {up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
      {Math.abs(diff)}%
    </span>
  );
}

export function ReportsSummaryCards({
  totalNetProfit, totalGrossEarnings, totalExpenses, totalBookEarnings,
  prevMonthNetProfit, prevMonthGrossEarnings, prevMonthExpenses, prevMonthBookEarnings,
}: Props) {
  const netProfitNegative = Number(totalNetProfit) < 0;
  const cards = [
    {
      label: "صافي الأرباح الكلي",
      value: totalNetProfit,
      prev: prevMonthNetProfit,
      icon: <DollarSign size={22} />,
      color: netProfitNegative ? "#ef4444" : "#10b981",
      bg: netProfitNegative ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
      border: netProfitNegative ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)",
      glow: netProfitNegative ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
      colSpan: true,
    },
    {
      label: "إجمالي الإيرادات",
      value: totalGrossEarnings,
      prev: prevMonthGrossEarnings,
      icon: <TrendingUp size={22} />,
      color: "var(--color-teal)",
      bg: "rgba(20,184,166,0.12)",
      border: "rgba(20,184,166,0.25)",
      glow: "rgba(20,184,166,0.08)",
      colSpan: false,
    },
    {
      label: "إجمالي المصروفات",
      value: totalExpenses,
      prev: prevMonthExpenses,
      icon: <Receipt size={22} />,
      color: "#f87171",
      bg: "rgba(239,68,68,0.12)",
      border: "rgba(239,68,68,0.25)",
      glow: "rgba(239,68,68,0.08)",
      colSpan: false,
    },
    {
      label: "أرباح الكتب",
      value: totalBookEarnings,
      prev: prevMonthBookEarnings,
      icon: <BookOpen size={22} />,
      color: "var(--color-amber)",
      bg: "rgba(245,158,11,0.12)",
      border: "rgba(245,158,11,0.25)",
      glow: "rgba(245,158,11,0.08)",
      colSpan: false,
    },
  ];

  return (
    <div className="reports-kpi-grid">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`glass-panel${card.colSpan ? " kpi-main-card" : ""}`}
          style={{
            padding: "1.25rem",
            borderLeft: `3px solid ${card.color}`,
            background: `linear-gradient(135deg, ${card.glow}, var(--bg-card))`,
            display: "flex",
            flexDirection: "column",
            gap: "0.875rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div
              style={{
                width: "2.5rem", height: "2.5rem", borderRadius: "10px",
                background: card.bg, color: card.color,
                border: `1px solid ${card.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {card.icon}
            </div>
            <TrendBadge current={card.value} prev={card.prev} />
          </div>

          <div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>{card.label}</p>
            <p className="monospace" style={{ fontSize: card.colSpan ? "clamp(1.4rem, 3vw, 2rem)" : "clamp(1.1rem, 2.5vw, 1.5rem)", fontWeight: 900, color: Number(card.value) < 0 ? "#ef4444" : card.color, lineHeight: 1 }}>
              {card.value.toLocaleString()} <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--text-muted)" }}>ج.م</span>
            </p>
          </div>

          <div style={{ height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "2px",
              background: card.color,
              width: card.prev > 0 && card.value > 0 ? `${Math.min(100, Math.round((card.value / Math.max(card.value, card.prev)) * 100))}%` : card.value > 0 ? "100%" : "0%",
              transition: "width 0.8s ease",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}
