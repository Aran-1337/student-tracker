"use client";

import { BookOpen, ChevronDown } from "lucide-react";
import { Group } from "../_hooks/useExamsPage";

interface ExamsHeaderProps {
  groups: Group[];
  selectedGroupId: string;
  onGroupChange: (id: string) => void;
}

export function ExamsHeader({ groups, selectedGroupId, onGroupChange }: ExamsHeaderProps) {
  return (
    <div className="glass-panel" style={{ padding: "1.5rem 2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "42px", height: "42px", borderRadius: "10px",
            background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--color-teal)"
          }}>
            <BookOpen size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              إدارة الامتحانات
            </h1>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
              رصد وإدارة درجات الطلاب
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <label style={{ fontSize: "0.9rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
            المجموعة:
          </label>
          <div style={{ position: "relative" }}>
            <select
              value={selectedGroupId}
              onChange={(e) => onGroupChange(e.target.value)}
              className="form-input"
              style={{ minWidth: "200px", paddingLeft: "2.5rem", appearance: "none", cursor: "pointer" }}
            >
              <option value="">-- اختر المجموعة --</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <ChevronDown size={16} style={{
              position: "absolute", left: "10px", top: "50%",
              transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none"
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
