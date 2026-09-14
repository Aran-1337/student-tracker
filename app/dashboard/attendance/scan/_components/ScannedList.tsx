"use client";

import { CheckCircle2, Users, X } from "lucide-react";
import { ScannedEntry } from "@/lib/types";

interface Props {
  entries: ScannedEntry[];
  totalInGroup: number;
  onRemove: (studentId: string) => void;
}

export function ScannedList({ entries, totalInGroup, onRemove }: Props) {
  if (entries.length === 0) return null;

  const absentCount = Math.max(0, totalInGroup - entries.length);

  return (
    <div className="scanned-list-section">
      <div className="scanned-list-header">
        <Users size={14} />
        <span>حضر {entries.length}</span>
        {absentCount > 0 && (
          <span style={{ color: "var(--color-danger)", marginRight: "0.5rem" }}>
            · غاب {absentCount}
          </span>
        )}
      </div>
      <div className="scanned-list-scroll">
        {/* FIX #6: use studentId as key instead of index */}
        {entries.map((entry) => (
          <div key={entry.studentId} className="scanned-entry">
            <div className="scanned-entry-left" style={{ display: "flex", alignItems: "center", gap: "0.4rem", flex: 1, minWidth: 0 }}>
              <CheckCircle2 size={13} style={{ color: "#10b981", flexShrink: 0 }} />
              <span className="scanned-entry-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {entry.studentName}
              </span>
              {entry.wasAbsentPrevious && (
                <span
                  title={`كان غائباً في الحصة السابقة ${entry.previousAbsentDate || ""}`}
                  style={{
                    fontSize: "0.68rem",
                    color: "#f59e0b",
                    background: "rgba(245, 158, 11, 0.15)",
                    border: "1px solid rgba(245, 158, 11, 0.35)",
                    padding: "1px 6px",
                    borderRadius: "4px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  غاب السابقة
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="scanned-entry-time">{entry.time}</span>
              <button
                onClick={() => onRemove(entry.studentId)}
                title="إلغاء التسجيل"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
