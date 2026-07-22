"use client";

import { ChevronRight, ChevronLeft } from "lucide-react";

interface Props {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "1rem",
      padding: "0.75rem 0",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      flexWrap: "wrap",
      gap: "0.5rem",
    }}>
      <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
        عرض {start}–{end} من {totalItems} طالب
      </span>
      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={btnStyle(currentPage === 1)}
        >
          <ChevronRight size={16} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .reduce<(number | "...")[]>((acc, p, idx, arr) => {
            if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} style={{ color: "var(--text-secondary)", padding: "0 4px" }}>…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                style={btnStyle(false, p === currentPage)}
              >
                {p}
              </button>
            )
          )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={btnStyle(currentPage === totalPages)}
        >
          <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  );
}

function btnStyle(disabled: boolean, active = false): React.CSSProperties {
  return {
    background: active ? "var(--color-teal)" : "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px",
    color: disabled ? "rgba(255,255,255,0.2)" : active ? "#fff" : "var(--text-secondary)",
    cursor: disabled ? "not-allowed" : "pointer",
    padding: "0.3rem 0.6rem",
    fontSize: "0.875rem",
    display: "flex",
    alignItems: "center",
    minWidth: "32px",
    justifyContent: "center",
    transition: "all 0.2s",
  };
}
