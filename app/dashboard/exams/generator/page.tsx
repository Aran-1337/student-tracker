"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { QuestionBank, Question } from "@/lib/types";
import { questionsService } from "@/lib/services/questionsService";
import { QuestionsEditor } from "./_components/QuestionsEditor";
import { FormsPreview } from "./_components/FormsPreview";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Trash2 } from "lucide-react";

export default function GeneratorPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newBankTitle, setNewBankTitle] = useState("");
  const [isCreatingBank, setIsCreatingBank] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setUserId(session.user.id);

        const loadedBanks = await questionsService.getBanksByTeacherId(session.user.id);
        setBanks(loadedBanks);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedBank) {
      setQuestions([]);
      return;
    }
    async function loadQs() {
      try {
        const qs = await questionsService.getQuestionsByBankId(selectedBank!.id);
        setQuestions(qs);
      } catch (e) {
        console.error(e);
      }
    }
    loadQs();
  }, [selectedBank]);

  const handleCreateBank = async () => {
    if (!newBankTitle.trim() || !userId) return;
    try {
      const bank = await questionsService.addBank({
        title: newBankTitle,
        teacher_id: userId,
        grade_id: null
      });
      setBanks(prev => [bank, ...prev]);
      setSelectedBank(bank);
      setNewBankTitle("");
      setIsCreatingBank(false);
    } catch (e) {
      alert("خطأ أثناء إنشاء بنك الأسئلة");
    }
  };

  const handleDeleteBank = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف بنك الأسئلة وكل الأسئلة التي بداخله؟")) return;
    try {
      await questionsService.deleteBank(id);
      setBanks(prev => prev.filter(b => b.id !== id));
      if (selectedBank?.id === id) setSelectedBank(null);
    } catch (e) {
      alert("خطأ أثناء החذف");
    }
  };

  const handleAddQuestion = async (q: Omit<Question, "id" | "bank_id" | "created_at">) => {
    if (!selectedBank) return;
    try {
      const newQ = await questionsService.addQuestion({
        ...q,
        bank_id: selectedBank.id
      });
      setQuestions(prev => [...prev, newQ]);
    } catch (e) {
      alert("خطأ في إضافة السؤال");
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await questionsService.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (e) {
      alert("خطأ في الحذف");
    }
  };

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>جاري التحميل...</div>;
  if (!userId) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.5rem", margin: 0 }}>نماذج الامتحانات (توليد ذكي)</h1>
      </div>

      <div className="glass-panel panel-content" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <h2 style={{ fontSize: "1.2rem", margin: 0 }}>بنوك الأسئلة</h2>
          <Button onClick={() => setIsCreatingBank(!isCreatingBank)} leftIcon={<Plus size={16} />}>
            إنشاء بنك أسئلة جديد
          </Button>
        </div>

        {isCreatingBank && (
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
            <Input 
              value={newBankTitle} 
              onChange={e => setNewBankTitle(e.target.value)} 
              placeholder="اسم البنك (مثال: بنك أسئلة الباب الأول)" 
              style={{ maxWidth: "300px" }}
            />
            <Button onClick={handleCreateBank} disabled={!newBankTitle.trim()}>حفظ</Button>
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          {banks.map(bank => (
            <div 
              key={bank.id}
              onClick={() => setSelectedBank(bank)}
              style={{
                padding: "1rem",
                borderRadius: "12px",
                border: selectedBank?.id === bank.id ? "1px solid var(--color-teal)" : "1px solid var(--border-color)",
                background: selectedBank?.id === bank.id ? "rgba(20, 184, 166, 0.1)" : "rgba(255,255,255,0.02)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                minWidth: "200px"
              }}
            >
              <div style={{ flex: 1, fontWeight: "bold" }}>{bank.title}</div>
              <Button 
                variant="secondary" 
                style={{ padding: "4px 8px", height: "auto", color: "var(--color-danger)", border: "none" }}
                onClick={(e) => { e.stopPropagation(); handleDeleteBank(bank.id); }}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {selectedBank && (
        <>
          <QuestionsEditor 
            questions={questions}
            onAddQuestion={handleAddQuestion}
            onDeleteQuestion={handleDeleteQuestion}
          />
          
          <FormsPreview 
            questions={questions}
            bankTitle={selectedBank.title}
          />
        </>
      )}
    </div>
  );
}
