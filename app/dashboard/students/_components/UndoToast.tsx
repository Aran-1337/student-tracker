"use client";

import { useEffect, useState } from "react";
import { RotateCcw, X } from "lucide-react";

interface Props {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export function UndoToast({ message, onUndo, onDismiss, duration = 5000 }: Props) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p <= 0) { clearInterval(interval); return 0; }
        return p - (100 / (duration / 100));
      });
    }, 100);
    return () => clearInterval(interval);
  }, [duration]);

  useEffect(() => {
    if (progress <= 0) onDismiss();
  }, [progress, onDismiss]);

  return (
    <div style={{
      position: "fixed",
      bottom: "2rem",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#1e293b",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "12px",
      padding: "1rem 1.25rem",
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      zIndex: 9999,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      minWidth: "320px",
      maxWidth: "90vw",
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#fff" }}>{message}</p>
        <div style={{ marginTop: "0.5rem", height: "3px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "var(--color-teal)", transition: "width 0.1s linear", borderRadius: "2px" }} />
        </div>
      </div>
      <button
        onClick={onUndo}
        style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.3)", borderRadius: "8px", color: "var(--color-teal)", cursor: "pointer", padding: "0.4rem 0.75rem", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", whiteSpace: "nowrap" }}
      >
        <RotateCcw size={14} /> تراجع
      </button>
      <button
        onClick={onDismiss}
        style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "0.25rem" }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
