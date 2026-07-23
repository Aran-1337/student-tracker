"use client";

import { useState } from "react";
import { Question } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Trash2, Save } from "lucide-react";

interface QuestionsEditorProps {
  questions: Question[];
  onAddQuestion: (q: Omit<Question, "id" | "bank_id" | "created_at">) => void;
  onDeleteQuestion: (id: string) => void;
}

export function QuestionsEditor({ questions, onAddQuestion, onDeleteQuestion }: QuestionsEditorProps) {
  const [content, setContent] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");

  const handleAdd = () => {
    if (!content.trim()) return;
    
    const validOptions = options.filter(opt => opt.trim() !== "");
    
    onAddQuestion({
      content,
      options: validOptions.length > 0 ? validOptions : null,
      correct_answer: correctAnswer.trim() || null
    });
    
    setContent("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer("");
  };

  const updateOption = (index: number, val: string) => {
    const newOptions = [...options];
    newOptions[index] = val;
    setOptions(newOptions);
  };

  return (
    <div className="glass-panel panel-content" style={{ padding: "1.5rem" }}>
      <h3 style={{ margin: "0 0 1rem 0", color: "var(--text-primary)" }}>إضافة سؤال جديد</h3>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label className="form-label">نص السؤال *</label>
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="اكتب السؤال هنا..."
            style={{
              width: "100%",
              minHeight: "80px",
              padding: "0.75rem",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              fontFamily: "inherit",
              resize: "vertical"
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {options.map((opt, i) => (
            <div key={i}>
              <label className="form-label">خيار {i + 1}</label>
              <Input 
                value={opt} 
                onChange={(e) => updateOption(i, e.target.value)} 
                placeholder={`الخيار ${i + 1} (اختياري)`} 
              />
            </div>
          ))}
        </div>

        <div>
          <label className="form-label">الإجابة الصحيحة (اختياري - لمفتاح التقييم)</label>
          <Input 
            value={correctAnswer} 
            onChange={(e) => setCorrectAnswer(e.target.value)} 
            placeholder="اكتب الإجابة الصحيحة هنا أو اسم الخيار الصحيح..." 
          />
        </div>

        <div style={{ alignSelf: "flex-start" }}>
          <Button onClick={handleAdd} leftIcon={<Plus size={16} />} disabled={!content.trim()}>
            إضافة السؤال
          </Button>
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "2rem 0" }} />

      <h3 style={{ margin: "0 0 1rem 0", color: "var(--text-primary)" }}>
        الأسئلة الحالية ({questions.length})
      </h3>

      {questions.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "1rem" }}>
          لا يوجد أسئلة مضافة بعد.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {questions.map((q, idx) => (
            <div key={q.id} style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--border-color)",
              padding: "1rem",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start"
            }}>
              <div>
                <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
                  {idx + 1}. {q.content}
                </div>
                {q.options && q.options.length > 0 && (
                  <ul style={{ margin: 0, paddingRight: "1.5rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                    {q.options.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                )}
              </div>
              <Button 
                variant="secondary" 
                style={{ padding: "0 10px", color: "var(--color-danger)" }}
                onClick={() => onDeleteQuestion(q.id)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
