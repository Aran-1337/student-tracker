"use client";

import { useState, useEffect } from "react";
import { Exam, ExamGrade, Student } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Save, ArrowRight, Search, CheckCircle2, Award, Send, RefreshCw, Printer } from "lucide-react";
import { examsService } from "@/lib/services/examsService";

interface GradeEntryTableProps {
  exam: Exam;
  students: Student[];
  onBack: () => void;
}

export function GradeEntryTable({ exam, students, onBack }: GradeEntryTableProps) {
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load existing grades
  useEffect(() => {
    async function loadGrades() {
      try {
        const data = await examsService.getGradesByExamId(exam.id);
        const gradesMap: Record<string, number> = {};
        data.forEach(g => {
          gradesMap[g.student_id] = g.score;
        });
        setGrades(gradesMap);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadGrades();
  }, [exam.id]);

  const handleGradeChange = (studentId: string, value: string) => {
    const numValue = value === "" ? NaN : Number(value);
    setGrades(prev => {
      const next = { ...prev };
      if (isNaN(numValue)) {
        delete next[studentId];
      } else {
        next[studentId] = numValue;
      }
      return next;
    });
  };

  const handleFillAllMax = () => {
    if (!window.confirm(`هل أنت متأكد من رصد الدرجة النهائية (${exam.max_score}) لجميع الطلاب؟`)) return;
    const newGrades: Record<string, number> = {};
    students.forEach(s => {
      newGrades[s.id] = exam.max_score;
    });
    setGrades(newGrades);
  };

  const handleClearAll = () => {
    if (!window.confirm("هل أنت متأكد من مسح جميع الدرجات المكتوبة؟")) return;
    setGrades({});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const gradesToSave: Omit<ExamGrade, "id" | "created_at">[] = Object.entries(grades).map(([studentId, score]) => ({
        exam_id: exam.id,
        student_id: studentId,
        score
      }));
      await examsService.upsertGrades(gradesToSave);
      alert("تم حفظ الدرجات بنجاح");
    } catch (e) {
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const sendWhatsAppGrade = (student: Student) => {
    if (!student.parent_phone) {
      alert("لا يوجد رقم ولي أمر لهذا الطالب");
      return;
    }
    const score = grades[student.id];
    if (score === undefined) {
      alert("لم يتم رصد درجة هذا الطالب بعد!");
      return;
    }

    const percentage = Math.round((score / exam.max_score) * 100);
    const statusText = score >= (exam.max_score / 2) ? "ناجح ✅" : "يحتاج متابعة ⚠️";
    const msg = `مرحباً ولي أمر الطالب/ة: ${student.name}\nنحيطكم علماً بنتيجة امتحان (${exam.title}):\n- الدرجة: ${score} من ${exam.max_score} (${percentage}%)\n- الحالة: ${statusText}\nشكراً لتعاونكم معنا.`;

    let phone = student.parent_phone.replace(/\D/g, "");
    if (phone.startsWith("0")) phone = "2" + phone;
    if (!phone.startsWith("2")) phone = "20" + phone;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Stats
  const validScores = Object.values(grades).filter(s => typeof s === "number" && !isNaN(s));
  const gradedCount = validScores.length;
  const avgScore = gradedCount > 0 ? (validScores.reduce((a, b) => a + b, 0) / gradedCount).toFixed(1) : 0;
  const maxAchieved = gradedCount > 0 ? Math.max(...validScores) : 0;
  const minAchieved = gradedCount > 0 ? Math.min(...validScores) : 0;

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
    (s.code || "").toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div className="glass-panel panel-content" style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Button variant="secondary" onClick={onBack} style={{ padding: "0 8px" }}>
            <ArrowRight size={20} />
          </Button>
          <div>
            <h2 style={{ fontSize: "1.25rem", margin: 0, color: "var(--text-primary)" }}>{exam.title}</h2>
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              الدرجة النهائية: <strong>{exam.max_score}</strong> | التاريخ: <strong>{exam.exam_date}</strong>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={() => window.print()} leftIcon={<Printer size={16} />}>
            طباعة
          </Button>
          <Button onClick={handleSave} disabled={saving || loading} leftIcon={<Save size={16} />}>
            {saving ? "جاري الحفظ..." : "حفظ الدرجات"}
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", padding: "0.75rem 1rem", borderRadius: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>تم رصد</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-teal)" }}>{gradedCount} / {students.length}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", padding: "0.75rem 1rem", borderRadius: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>المتوسط</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-amber)" }}>{avgScore} / {exam.max_score}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", padding: "0.75rem 1rem", borderRadius: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>أعلى درجة</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#10b981" }}>{maxAchieved}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", padding: "0.75rem 1rem", borderRadius: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>أقل درجة</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ef4444" }}>{minAchieved}</div>
        </div>
      </div>

      {/* Controls & Search Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ width: "250px" }}>
          <Input 
            placeholder="🔍 بحث باسم الطالب..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button variant="secondary" onClick={handleFillAllMax} style={{ fontSize: "0.85rem" }}>
            إعطاء {exam.max_score} للجميع
          </Button>
          <Button variant="secondary" onClick={handleClearAll} style={{ fontSize: "0.85rem", color: "#ef4444" }}>
            تصفير الدرجات
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>جاري التحميل...</div>
      ) : filteredStudents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
          لا يوجد طلاب مطابقين للبحث.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.05)", borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "1rem", textAlign: "right" }}>الطالب</th>
                <th style={{ padding: "1rem", textAlign: "center", width: "160px" }}>الدرجة (من {exam.max_score})</th>
                <th style={{ padding: "1rem", textAlign: "center", width: "120px" }}>النسبة</th>
                <th style={{ padding: "1rem", textAlign: "center", width: "100px" }}>إرسال</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, idx) => {
                const score = grades[student.id];
                const hasScore = score !== undefined && !isNaN(score);
                const percent = hasScore ? Math.round((score / exam.max_score) * 100) : null;

                return (
                  <tr key={student.id} style={{ borderBottom: "1px solid var(--border-color)", background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 600 }}>{student.name}</div>
                      {student.code && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>كود: {student.code}</div>}
                    </td>
                    <td style={{ padding: "0.5rem 1rem", textAlign: "center" }}>
                      <Input 
                        type="number"
                        min={0}
                        max={exam.max_score}
                        value={hasScore ? score : ""}
                        onChange={(e) => handleGradeChange(student.id, e.target.value)}
                        placeholder="--"
                        style={{ textAlign: "center", fontWeight: 700 }}
                      />
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      {hasScore ? (
                        <span style={{
                          fontWeight: 700,
                          color: percent! >= 85 ? "#10b981" : percent! >= 50 ? "var(--color-amber)" : "#ef4444"
                        }}>
                          %{percent}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <button
                        onClick={() => sendWhatsAppGrade(student)}
                        disabled={!student.parent_phone || !hasScore}
                        title={student.parent_phone ? "إرسال النتيجة لولي الأمر على واتساب" : "لا يوجد رقم ولي أمر"}
                        style={{
                          width: "34px", height: "34px", borderRadius: "50%", border: "none",
                          background: (student.parent_phone && hasScore) ? "#25D366" : "rgba(255,255,255,0.05)",
                          color: (student.parent_phone && hasScore) ? "#fff" : "var(--text-muted)",
                          cursor: (student.parent_phone && hasScore) ? "pointer" : "not-allowed",
                          display: "inline-flex", alignItems: "center", justifyContent: "center"
                        }}
                      >
                        <Send size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
