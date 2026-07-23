"use client";

import { Receipt, Plus, ChevronRight, ChevronLeft } from "./Icons";

interface Props {
  totalYear: number;
  activeYear: number;
  availableYears: number[];
  onYearChange: (y: number) => void;
  onAddClick: () => void;
  activeTab: "overview" | "table" | "templates";
  onTabChange: (t: "overview" | "table" | "templates") => void;
}

export default function BillsHeader({
  totalYear, activeYear, availableYears, onYearChange, onAddClick, activeTab, onTabChange,
}: Props) {
  const prevYear = activeYear - 1;
  const nextYear = activeYear + 1;

  return (
    <div style={{ marginBottom: "1.75rem" }}>
      {/* Top row */}
      <div className="bills-header-top">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div className="bills-header-icon">
            <Receipt size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: "clamp(1.15rem, 4vw, 1.75rem)", marginBottom: "0.1rem" }}>المصروفات والفواتير</h1>
            <p className="bills-header-subtitle">
              تتبع الإيجار، الرواتب، والالتزامات المالية
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          {/* Year navigator */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0",
            background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "10px",
            overflow: "hidden",
          }}>
            <button
              onClick={() => onYearChange(prevYear)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.5rem 0.6rem", display: "flex", alignItems: "center" }}
            >
              <ChevronRight size={16} />
            </button>
            <span style={{ padding: "0.5rem 0.75rem", fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "JetBrains Mono, monospace", borderRight: "1px solid var(--border-color)", borderLeft: "1px solid var(--border-color)" }}>
              {activeYear}
            </span>
            <button
              onClick={() => onYearChange(nextYear)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.5rem 0.6rem", display: "flex", alignItems: "center" }}
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          <button className="btn btn-primary" onClick={onAddClick} style={{ gap: "0.4rem", whiteSpace: "nowrap" }}>
            <Plus size={18} />
            <span className="bills-add-btn-text">فاتورة جديدة</span>
          </button>
        </div>
      </div>

      {/* Total + Tabs row */}
      <div className="bills-header-bottom">
        {/* Total spend bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: "1rem",
          background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
          borderRadius: "10px", padding: "0.6rem 1.25rem",
        }}>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>إجمالي {activeYear}</span>
          <span className="monospace" style={{ fontSize: "1.35rem", fontWeight: 700, color: "#f87171" }}>
            {Number(totalYear).toLocaleString()} ج.م
          </span>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", background: "var(--bg-card)",
          border: "1px solid var(--border-color)", borderRadius: "10px", padding: "3px", gap: "3px",
        }}>
          {(["overview", "table", "templates"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              style={{
                padding: "0.4rem 1rem", borderRadius: "7px", border: "none", cursor: "pointer",
                fontSize: "0.85rem", fontWeight: 600, fontFamily: "inherit",
                background: activeTab === tab ? "rgba(20,184,166,0.15)" : "transparent",
                color: activeTab === tab ? "var(--color-teal)" : "var(--text-muted)",
                transition: "all 0.2s ease",
              }}
            >
              {tab === "overview" ? "نظرة عامة" : tab === "table" ? "جدول الفواتير" : "القوالب المتكررة"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
