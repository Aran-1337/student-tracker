"use client";

import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  count: number;
  isLoading: boolean;
  onDelete: () => void;
  onClear: () => void;
}

export function BulkActionBar({ count, isLoading, onDelete, onClear }: Props) {
  if (count === 0) return null;
  return (
    <div style={{
      background: "rgba(239,68,68,0.08)",
      border: "1px solid rgba(239,68,68,0.25)",
      borderRadius: "10px",
      padding: "0.75rem 1rem",
      marginBottom: "1rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "1rem",
    }}>
      <span style={{ color: "var(--color-danger)", fontWeight: 600, fontSize: "0.95rem" }}>
        تم تحديد {count} طالب
      </span>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button variant="secondary" size="sm" onClick={onClear} leftIcon={<X size={14} />}>
          إلغاء
        </Button>
        <Button variant="danger" size="sm" onClick={onDelete} isLoading={isLoading} leftIcon={<Trash2 size={14} />}>
          حذف المحدد
        </Button>
      </div>
    </div>
  );
}
