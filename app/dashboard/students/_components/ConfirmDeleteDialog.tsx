"use client";

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteDialog({ message, onConfirm, onCancel }: Props) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
    }}>
      <div style={{
        background: "var(--bg-card, #1e293b)", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "14px", padding: "1.75rem", maxWidth: "380px", width: "90%",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)", textAlign: "center",
      }}>
        <p style={{ margin: "0 0 1.5rem", fontSize: "1rem", color: "#fff", lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "var(--text-secondary, #94a3b8)", cursor: "pointer", fontSize: "0.9rem" }}
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: "0.6rem 1rem", borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600 }}
          >
            حذف
          </button>
        </div>
      </div>
    </div>
  );
}
