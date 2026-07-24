"use client";

import { useState } from "react";
import { Exam } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Trash2, FileText, Edit2, Check, X, Calendar, Hash } from "lucide-react";

interface ExamCardProps {
  exam: Exam;
  onSelect: (exam: Exam) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<Omit<Exam, "id" | "created_at">>) => void;
}

export function ExamCard({ exam, onSelect, onDelete, onEdit }: ExamCardProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(exam.title);
  const [maxScore, setMaxScore] = useState(exam.max_score);
  const [examDate, setExamDate] = useState(exam.exam_date);

  const handleSave = () => {
    if (!title.trim()) return;
    onEdit(exam.id, { title, max_score: maxScore, exam_date: examDate });
    setEditing(false);
  };

  const handleCancel = () => {
    setTitle(exam.title);
    setMaxScore(exam.max_score);
    setExamDate(exam.exam_date);
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={{
        padding: "1.25rem", borderRadius: "14px",
        background: "rgba(20,184,166,0.05)",
        border: "1px solid rgba(20,184,166,0.4)",
        display: "flex", flexDirection: "column", gap: "0.75rem"
      }}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="اسم الامتحان" />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Input type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} min={1} placeholder="الدرجة" />
          <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button onClick={handleSave} disabled={!title.trim()} style={{ flex: 1, height: "36px", fontSize: "0.85rem" }} leftIcon={<Check size={14} />}>حفظ</Button>
          <Button variant="secondary" onClick={handleCancel} style={{ height: "36px", padding: "0 12px" }}><X size={14} /></Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: "1.25rem", borderRadius: "14px",
      background: "rgba(20,184,166,0.04)",
      border: "1px solid rgba(20,184,166,0.15)",
      display: "flex", flexDirection: "column", gap: "0.75rem",
      transition: "var(--transition-smooth)",
      cursor: "default"
    }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(20,184,166,0.35)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(20,184,166,0.15)")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h3 style={{ fontSize: "1rem", margin: 0, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.4 }}>
          {exam.title}
        </h3>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          <button
            onClick={() => setEditing(true)}
            style={{
              width: "28px", height: "28px", borderRadius: "6px", border: "none",
              background: "rgba(255,255,255,0.05)", color: "var(--text-muted)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "var(--transition-smooth)"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(20,184,166,0.15)"; e.currentTarget.style.color = "var(--color-teal)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => onDelete(exam.id)}
            style={{
              width: "28px", height: "28px", borderRadius: "6px", border: "none",
              background: "rgba(255,255,255,0.05)", color: "var(--text-muted)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "var(--transition-smooth)"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "var(--color-danger)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
          <Hash size={13} style={{ color: "var(--color-teal)" }} />
          {exam.max_score} درجة
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
          <Calendar size={13} style={{ color: "var(--color-amber)" }} />
          {exam.exam_date}
        </span>
      </div>

      <Button
        variant="primary"
        style={{ height: "38px", fontSize: "0.88rem", width: "100%" }}
        onClick={() => onSelect(exam)}
        leftIcon={<FileText size={15} />}
      >
        رصد الدرجات
      </Button>
    </div>
  );
}
