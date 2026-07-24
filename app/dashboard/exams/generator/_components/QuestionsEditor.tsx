"use client";

import { useState } from "react";
import { Question } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Trash2, Save, Type, AlignLeft, CheckCircle2, Image as ImageIcon, Upload } from "lucide-react";

interface QuestionsEditorProps {
  questions: Question[];
  onAddQuestion: (q: Omit<Question, "id" | "bank_id" | "created_at">) => void;
  onDeleteQuestion: (id: string) => void;
}

export function QuestionsEditor({ questions, onAddQuestion, onDeleteQuestion }: QuestionsEditorProps) {
  const [content, setContent] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [questionType, setQuestionType] = useState<"mcq" | "essay">("mcq");
  const [essayLines, setEssayLines] = useState<number>(3);

  const [sectionName, setSectionName] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const handleAdd = () => {
    if (!content.trim() && !imageBase64) return;
    
    const validOptions = options.filter(opt => opt.trim() !== "");
    
    onAddQuestion({
      content,
      options: questionType === "mcq" && validOptions.length > 0 ? validOptions : null,
      correct_answer: questionType === "mcq" ? (correctAnswer.trim() || null) : null,
      question_type: questionType,
      essay_lines: questionType === "essay" ? essayLines : 0,
      section_name: sectionName.trim() || null,
      image_base64: imageBase64
    });
    
    setContent("");
    setOptions(Array(options.length).fill(""));
    setCorrectAnswer("");
    setImageBase64(null);
    // Keep the same questionType to make adding multiple of the same type easier
  };



  const updateOption = (index: number, val: string) => {
    const newOptions = [...options];
    const oldVal = newOptions[index];
    newOptions[index] = val;
    setOptions(newOptions);
    if (correctAnswer === oldVal) {
      setCorrectAnswer(val);
    }
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return; // prevent having less than 2 options
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
    
    if (correctAnswer === options[index]) {
      setCorrectAnswer("");
    }
  };

  return (
    <div className="glass-panel panel-content" style={{ padding: "1.5rem" }}>
      <h3 style={{ margin: "0 0 1rem 0", color: "var(--text-primary)" }}>إضافة سؤال جديد</h3>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Section Name */}
        <div>
          <label className="form-label">عنوان القسم (مثال: السؤال الأول - اختر الإجابة الصحيحة)</label>
          <Input 
            value={sectionName} 
            onChange={(e) => setSectionName(e.target.value)} 
            placeholder="اتركه فارغاً إذا كنت لا ترغب بتقسيم الامتحان" 
          />
        </div>

        <div>
          <label className="form-label" style={{ margin: 0, display: "block", marginBottom: "0.5rem" }}>نص السؤال *</label>
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="اكتب السؤال هنا... (يمكنك إدراج صور لحل مسائل معقدة بالأسفل)"
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

        {/* Image Upload */}
        <div>
          <label className="form-label">صورة مرفقة مع السؤال (اختياري)</label>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <label style={{ 
              display: "flex", alignItems: "center", gap: "0.5rem", 
              padding: "0.5rem 1rem", background: "rgba(255,255,255,0.05)", 
              border: "1px dashed var(--border-color)", borderRadius: "8px", 
              cursor: "pointer", color: "var(--text-secondary)"
            }}>
              <Upload size={16} />
              <span>{imageBase64 ? "تم اختيار صورة (اضغط لتغييرها)" : "اضغط لرفع صورة"}</span>
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setImageBase64(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
            {imageBase64 && (
              <Button variant="secondary" onClick={() => setImageBase64(null)} style={{ padding: "0 10px", color: "var(--color-danger)", height: "38px" }}>
                <Trash2 size={16} />
              </Button>
            )}
          </div>
          {imageBase64 && (
            <div style={{ marginTop: "1rem", maxWidth: "200px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
              <img src={imageBase64} alt="مرفق" style={{ width: "100%", height: "auto", display: "block" }} />
            </div>
          )}
        </div>

        {/* Question Type Selection */}
        <div>
          <label className="form-label">نوع السؤال</label>
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
            <Button 
              variant={questionType === "mcq" ? "primary" : "secondary"} 
              onClick={() => setQuestionType("mcq")}
              leftIcon={<CheckCircle2 size={16} />}
              style={questionType !== "mcq" ? { background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" } : {}}
            >
              اختيار من متعدد
            </Button>
            <Button 
              variant={questionType === "essay" ? "primary" : "secondary"} 
              onClick={() => setQuestionType("essay")}
              leftIcon={<AlignLeft size={16} />}
              style={questionType !== "essay" ? { background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" } : {}}
            >
              مقالى
            </Button>
          </div>
        </div>

        {questionType === "mcq" ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {options.map((opt, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <label className="form-label" style={{ margin: 0 }}>خيار {i + 1}</label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {options.length > 2 && (
                        <button onClick={() => removeOption(i)} style={{ background: "transparent", border: "none", color: "var(--color-danger)", cursor: "pointer", display: "flex", alignItems: "center", padding: "2px" }} title="حذف الخيار">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {opt.startsWith("data:image/") ? (
                      <div style={{ position: "relative", width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "0.5rem", display: "flex", justifyContent: "center" }}>
                        <img src={opt} alt="خيار" style={{ maxHeight: "60px", maxWidth: "100%" }} />
                        <button onClick={() => updateOption(i, "")} style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(239,68,68,0.2)", border: "none", color: "var(--color-danger)", borderRadius: "50%", padding: "4px", cursor: "pointer" }} title="حذف الصورة">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <Input 
                        value={opt} 
                        onChange={(e) => updateOption(i, e.target.value)} 
                        placeholder={`الخيار ${i + 1} (اختياري)`} 
                      />
                    )}
                    
                    {!opt.startsWith("data:image/") && (
                      <label style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.5rem", background: "rgba(255,255,255,0.05)", border: "1px dashed var(--border-color)", borderRadius: "8px", color: "var(--text-secondary)" }} title="إرفاق صورة كخيار">
                        <ImageIcon size={16} />
                        <input 
                          type="file" 
                          accept="image/*" 
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => updateOption(i, reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
              
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <Button variant="secondary" onClick={addOption} leftIcon={<Plus size={16} />} style={{ width: "100%", borderStyle: "dashed" }}>
                  إضافة خيار جديد
                </Button>
              </div>
            </div>

            <div>
              <label className="form-label">الإجابة الصحيحة (مفتاح التقييم)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "0.5rem" }}>
                {options.filter(o => o.trim()).length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                    {options.map((opt, i) => (opt.trim() !== "" ? (
                      <label key={i} style={{ 
                        display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer",
                        padding: "0.5rem 1rem", borderRadius: "8px",
                        background: correctAnswer === opt ? "rgba(16, 185, 129, 0.1)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${correctAnswer === opt ? "var(--color-teal)" : "var(--border-color)"}`
                      }}>
                        <input 
                          type="radio" 
                          name="correct_answer" 
                          checked={correctAnswer === opt}
                          onChange={() => setCorrectAnswer(opt)}
                          style={{ accentColor: "var(--color-teal)" }}
                        />
                        {opt.startsWith("data:image/") ? <img src={opt} style={{ height: "30px" }} alt="صورة الإجابة" /> : <span>{opt}</span>}
                      </label>
                    ) : null))}
                  </div>
                ) : (
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>قم بإضافة الخيارات أولاً لتحديد الإجابة الصحيحة</span>
                )}
                {correctAnswer && (
                  <Button variant="secondary" onClick={() => setCorrectAnswer("")} style={{ padding: "4px 8px", height: "auto", fontSize: "0.8rem" }}>
                    مسح التحديد
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div>
            <label className="form-label">المساحة المطلوبة للإجابة (عدد الأسطر)</label>
            <Input 
              type="number"
              min={1}
              max={20}
              value={essayLines}
              onChange={(e) => setEssayLines(Number(e.target.value))}
              style={{ maxWidth: "200px" }}
            />
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
              سيتم ترك مساحة فارغة في ورقة الامتحان للطالب لكي يكتب إجابته.
            </p>
          </div>
        )}

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
                {q.section_name && (
                  <div style={{ fontSize: "0.8rem", color: "var(--color-teal)", marginBottom: "0.25rem", fontWeight: "bold" }}>
                    القسم: {q.section_name}
                  </div>
                )}
                <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
                  {idx + 1}. {q.content}
                </div>
                {q.image_base64 && (
                  <div style={{ margin: "0.5rem 0", maxWidth: "150px", border: "1px solid var(--border-color)", borderRadius: "4px", overflow: "hidden" }}>
                    <img src={q.image_base64} style={{ width: "100%", display: "block" }} alt="مرفق" />
                  </div>
                )}
                {q.question_type === "essay" ? (
                  <div style={{ margin: "0.5rem 0 0 0", color: "var(--color-teal)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <AlignLeft size={14} /> مقالى - مساحة {q.essay_lines} أسطر
                  </div>
                ) : (
                  q.options && q.options.length > 0 && (
                    <ul style={{ margin: 0, paddingRight: "1.5rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                      {q.options.map((opt, i) => (
                        <li key={i} style={q.correct_answer === opt ? { color: "var(--color-teal)", fontWeight: "bold" } : {}}>{opt} {q.correct_answer === opt && "✓"}</li>
                      ))}
                    </ul>
                  )
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
