"use client";

import { Trash2, X } from "./Icons";

interface Props {
  count: number;
  actionLoading: boolean;
  onDelete: () => void;
  onClear: () => void;
}

export default function BulkActionBar({ count, actionLoading, onDelete, onClear }: Props) {
  if (count === 0) return null;

  return (
    <div style={{
      position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)",
      background: "rgba(15,23,42,0.95)", backdropFilter: "blur(12px)",
      border: "1px solid var(--border-color)", borderRadius: "12px",
      padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 100,
      maxWidth: "calc(100vw - 2rem)", flexWrap: "wrap", justifyContent: "center",
    }}>
      <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500 }}>
        تم تحديد {count} فاتورة
      </span>
      <button
        className="btn"
        onClick={onDelete}
        disabled={actionLoading}
        style={{
          background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
          color: "#f87171", padding: "0.45rem 1rem", fontSize: "0.88rem",
        }}
      >
        <Trash2 size={15} />
        حذف المحدد
      </button>
      <button
        className="btn btn-secondary"
        onClick={onClear}
        style={{ padding: "0.45rem 1rem", fontSize: "0.88rem" }}
      >
        <X size={15} />
        إلغاء
      </button>
    </div>
  );
}
