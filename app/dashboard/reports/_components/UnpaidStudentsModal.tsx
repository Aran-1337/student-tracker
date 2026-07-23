"use client";

import { Modal } from "@/components/ui/Modal";
import { AlertTriangle } from "lucide-react";

interface UnpaidStudent {
  id: string;
  name: string;
  gradeName?: string;
  groupName?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: UnpaidStudent[];
  currentMonthName: string;
}

export function UnpaidStudentsModal({ isOpen, onClose, students, currentMonthName }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`طلاب لم يدفعوا — ${currentMonthName}`} maxWidth="560px">
      {students.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
          🎉 جميع الطلاب دفعوا هذا الشهر!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "420px", overflowY: "auto" }}>
          {students.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.65rem 0.875rem", borderRadius: "8px",
                background: "rgba(239,68,68,0.04)",
                border: "1px solid rgba(239,68,68,0.12)",
              }}
            >
              <AlertTriangle size={14} style={{ color: "#f87171", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{s.name}</p>
                {(s.gradeName || s.groupName) && (
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                    {s.gradeName && <span>{s.gradeName}</span>}
                    {s.gradeName && s.groupName && <span> · </span>}
                    {s.groupName && <span>{s.groupName}</span>}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
