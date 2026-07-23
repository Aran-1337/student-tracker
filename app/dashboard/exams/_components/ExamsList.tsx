"use client";

import { useState } from "react";
import { Exam } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Trash2, Edit2, FileText, Plus } from "lucide-react";

interface ExamsListProps {
  exams: Exam[];
  onSelectExam: (exam: Exam) => void;
  onAddExam: (examData: Omit<Exam, "id" | "created_at">) => void;
  onDeleteExam: (id: string) => void;
  teacherId: string;
  groupId: string;
}

export function ExamsList({ exams, onSelectExam, onAddExam, onDeleteExam, teacherId, groupId }: ExamsListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [examDate, setExamDate] = useState(new Date().toISOString().split("T")[0]);

  const handleAdd = () => {
    if (!title.trim()) return;
    onAddExam({
      title,
      max_score: Number(maxScore),
      exam_date: examDate,
      teacher_id: teacherId,
      group_id: groupId
    });
    setTitle("");
    setIsAdding(false);
  };

  return (
    <div className="glass-panel panel-content" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}>امتحانات المجموعة</h2>
        <Button onClick={() => setIsAdding(!isAdding)} leftIcon={<Plus size={16} />}>
          إضافة امتحان جديد
        </Button>
      </div>

      {isAdding && (
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 200px" }}>
              <label className="form-label">اسم الامتحان</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: امتحان شهر أكتوبر" />
            </div>
            <div style={{ flex: "1 1 120px" }}>
              <label className="form-label">الدرجة النهائية</label>
              <Input type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} min={1} />
            </div>
            <div style={{ flex: "1 1 150px" }}>
              <label className="form-label">تاريخ الامتحان</label>
              <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
            <div>
              <Button onClick={handleAdd} disabled={!title.trim()}>حفظ الامتحان</Button>
            </div>
          </div>
        </div>
      )}

      {exams.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
          لا يوجد امتحانات لهذه المجموعة. أضف امتحاناً جديداً للبدء.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
          {exams.map(exam => (
            <div key={exam.id} style={{
              padding: "1rem", 
              borderRadius: "12px", 
              background: "rgba(20, 184, 166, 0.05)",
              border: "1px solid rgba(20, 184, 166, 0.2)",
              display: "flex", flexDirection: "column", gap: "0.5rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: 700 }}>{exam.title}</h3>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{exam.exam_date}</span>
              </div>
              <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>الدرجة النهائية: <strong style={{ color: "var(--text-primary)" }}>{exam.max_score}</strong></div>
              
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <Button 
                  variant="primary" 
                  style={{ flex: 1, height: "36px", fontSize: "0.9rem" }}
                  onClick={() => onSelectExam(exam)}
                  leftIcon={<FileText size={16} />}
                >
                  رصد الدرجات
                </Button>
                <Button 
                  variant="secondary" 
                  style={{ height: "36px", padding: "0 10px", color: "var(--color-danger)", borderColor: "rgba(239, 68, 68, 0.3)" }}
                  onClick={() => {
                    if (window.confirm("هل أنت متأكد من حذف هذا الامتحان وكل درجاته؟")) {
                      onDeleteExam(exam.id);
                    }
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
