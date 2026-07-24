"use client";

import { useState } from "react";
import { Exam } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, ClipboardList, X } from "lucide-react";
import { ExamCard } from "./ExamCard";

interface ExamsListProps {
  exams: Exam[];
  teacherId: string;
  groupId: string;
  onSelectExam: (exam: Exam) => void;
  onAddExam: (data: Omit<Exam, "id" | "created_at">) => void;
  onDeleteExam: (id: string) => void;
  onEditExam: (id: string, updates: Partial<Omit<Exam, "id" | "created_at">>) => void;
}

export function ExamsList({ exams, teacherId, groupId, onSelectExam, onAddExam, onDeleteExam, onEditExam }: ExamsListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [examDate, setExamDate] = useState(new Date().toISOString().split("T")[0]);

  const handleAdd = () => {
    if (!title.trim()) return;
    onAddExam({ title, max_score: Number(maxScore), exam_date: examDate, teacher_id: teacherId, group_id: groupId });
    setTitle("");
    setMaxScore(100);
    setIsAdding(false);
  };

  return (
    <div className="glass-panel" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <ClipboardList size={18} style={{ color: "var(--color-teal)" }} />
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            امتحانات المجموعة
          </h2>
          {exams.length > 0 && (
            <span style={{
              background: "rgba(20,184,166,0.15)", color: "var(--color-teal)",
              border: "1px solid rgba(20,184,166,0.3)", borderRadius: "20px",
              padding: "1px 10px", fontSize: "0.8rem", fontWeight: 600
            }}>
              {exams.length}
            </span>
          )}
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} leftIcon={isAdding ? <X size={15} /> : <Plus size={15} />} variant={isAdding ? "secondary" : "primary"} size="sm">
          {isAdding ? "إلغاء" : "امتحان جديد"}
        </Button>
      </div>

      {isAdding && (
        <div style={{
          background: "rgba(20,184,166,0.04)", padding: "1.25rem",
          borderRadius: "12px", marginBottom: "1.5rem",
          border: "1px solid rgba(20,184,166,0.2)"
        }}>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "2 1 200px" }}>
              <Input label="اسم الامتحان" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: امتحان شهر أكتوبر" />
            </div>
            <div style={{ flex: "1 1 110px" }}>
              <Input label="الدرجة النهائية" type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} min={1} />
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <Input label="التاريخ" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
            <Button onClick={handleAdd} disabled={!title.trim()} style={{ height: "44px", whiteSpace: "nowrap" }}>
              حفظ الامتحان
            </Button>
          </div>
        </div>
      )}

      {exams.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={40} className="empty-state-icon" />
          <p style={{ margin: 0 }}>لا يوجد امتحانات لهذه المجموعة</p>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>اضغط "امتحان جديد" للبدء</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {exams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onSelect={onSelectExam}
              onDelete={onDeleteExam}
              onEdit={onEditExam}
            />
          ))}
        </div>
      )}
    </div>
  );
}
