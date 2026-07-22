"use client";

import { AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  studentName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({ studentName, onConfirm, onCancel }: Props) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.25rem",
          }}>
            <AlertCircle size={28} style={{ color: "var(--color-danger)" }} />
          </div>
          <h3 style={{ marginBottom: "0.5rem" }}>تأكيد حذف الحضور</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            هل تريد إلغاء حضور <strong style={{ color: "#fff" }}>{studentName}</strong> في هذه الحصة؟
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Button variant="danger" style={{ flex: 1, justifyContent: "center" }} onClick={onConfirm}>
              <Trash2 size={15} />
              نعم، احذف
            </Button>
            <Button variant="secondary" style={{ flex: 1, justifyContent: "center" }} onClick={onCancel}>
              إلغاء
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
