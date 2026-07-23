"use client";

import { Zap, X } from "./Icons";
import { arabicMonths } from "../_hooks/useBills";

interface Props {
  activeTemplatesCount: number;
  actionLoading: boolean;
  onGenerate: () => void;
  onDismiss: () => void;
}

export default function GenerateBanner({ activeTemplatesCount, actionLoading, onGenerate, onDismiss }: Props) {
  const now = new Date();
  const monthName = arabicMonths[now.getMonth()];
  const year = now.getFullYear();

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "1rem", flexWrap: "wrap",
      padding: "0.875rem 1.25rem", borderRadius: "12px", marginBottom: "1.25rem",
      background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))",
      border: "1px solid rgba(16,185,129,0.3)",
      animation: "slideDown 0.3s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
          background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
          color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Zap size={18} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#d1fae5" }}>
            شهر {monthName} {year} بدأ!
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
            عندك {activeTemplatesCount} قالب نشط — هل تريد توليد فواتير الشهر الجديد؟
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <button
          className="btn"
          onClick={onGenerate}
          disabled={actionLoading}
          style={{
            background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)",
            color: "#10b981", padding: "0.45rem 1.1rem", fontSize: "0.88rem",
            display: "flex", alignItems: "center", gap: "0.4rem",
          }}
        >
          <Zap size={15} />
          {actionLoading ? "جاري التوليد..." : `توليد فواتير ${monthName}`}
        </button>
        <button
          onClick={onDismiss}
          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
        >
          <X size={16} />
        </button>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
