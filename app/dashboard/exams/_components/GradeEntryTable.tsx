"use client";

import { useState, useEffect } from "react";
import { Exam, ExamGrade, Student } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Save, ArrowRight, Printer } from "lucide-react";
import { examsService } from "@/lib/services/examsService";
import { ScoreDistributionChart } from "./ScoreDistributionChart";

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

const PRINT_STYLES = `
@media print {
  html, body {
    background: #ffffff !important;
    background-image: none !important;
    color: #000000 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .exam-screen { display: none !important; }
  .exam-print {
    display: block !important;
    padding: 20px !important;
    font-family: 'Tajawal', Arial, sans-serif !important;
    direction: rtl !important;
    color: #000 !important;
    background: #fff !important;
  }
  .exam-print * {
    color: #000 !important;
    background: transparent !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }
  .ep-title {
    font-size: 20px !important;
    font-weight: 700 !important;
    text-align: center !important;
    margin-bottom: 4px !important;
  }
  .ep-sub {
    font-size: 12px !important;
    text-align: center !important;
    color: #555 !important;
    margin-bottom: 14px !important;
  }
  .ep-hr {
    border: none !important;
    border-top: 2px solid #000 !important;
    margin-bottom: 14px !important;
  }
  .ep-table {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 13px !important;
  }
  .ep-table th {
    background: #e0e0e0 !important;
    color: #000 !important;
    padding: 7px 10px !important;
    border: 1px solid #888 !important;
    font-weight: 700 !important;
    text-align: center !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .ep-table td {
    padding: 6px 10px !important;
    border: 1px solid #ccc !important;
    color: #000 !important;
    text-align: center !important;
  }
  .ep-table .ep-name { text-align: right !important; }
  .ep-table tr:nth-child(even) td {
    background: #f5f5f5 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .ep-pass { color: #14532d !important; font-weight: 700 !important; }
  .ep-fail { color: #7f1d1d !important; font-weight: 700 !important; }
}
`;

interface GradeEntryTableProps {
  exam: Exam;
  students: Student[];
  groupName: string;
  onBack: () => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}

export function GradeEntryTable({ exam, students, groupName, onBack, showToast }: GradeEntryTableProps) {
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [savedGrades, setSavedGrades] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isDirty = JSON.stringify(grades) !== JSON.stringify(savedGrades);

  useEffect(() => {
    async function loadGrades() {
      try {
        const data = await examsService.getGradesByExamId(exam.id);
        const map: Record<string, number> = {};
        data.forEach((g) => { map[g.student_id] = g.score; });
        setGrades(map);
        setSavedGrades(map);
      } catch {
        showToast("حدث خطأ أثناء تحميل الدرجات", "error");
      } finally {
        setLoading(false);
      }
    }
    loadGrades();
  }, [exam.id, showToast]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleBack = () => {
    if (isDirty && !window.confirm("لديك تغييرات غير محفوظة. هل تريد المغادرة؟")) return;
    onBack();
  };

  const handleGradeChange = (studentId: string, value: string) => {
    const num = value === "" ? NaN : Number(value);
    setGrades((prev) => {
      const next = { ...prev };
      if (isNaN(num)) { delete next[studentId]; }
      else { next[studentId] = Math.min(Math.max(0, num), exam.max_score); }
      return next;
    });
  };

  const handleFillAllMax = () => {
    if (!window.confirm(`رصد ${exam.max_score} لجميع الطلاب؟`)) return;
    const map: Record<string, number> = {};
    students.forEach((s) => { map[s.id] = exam.max_score; });
    setGrades(map);
  };

  const handleClearAll = () => {
    if (!window.confirm("مسح جميع الدرجات؟")) return;
    setGrades({});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toSave: Omit<ExamGrade, "id" | "created_at">[] = Object.entries(grades).map(([studentId, score]) => ({
        exam_id: exam.id, student_id: studentId, score,
      }));
      await examsService.upsertGrades(toSave);
      setSavedGrades({ ...grades });
      showToast("تم حفظ الدرجات بنجاح ✓");
    } catch {
      showToast("حدث خطأ أثناء الحفظ", "error");
    } finally {
      setSaving(false);
    }
  };

  const sendWhatsApp = (student: Student) => {
    if (!student.parent_phone) { showToast("لا يوجد رقم ولي أمر", "error"); return; }
    const score = grades[student.id];
    if (score === undefined) { showToast("لم يتم رصد درجة هذا الطالب", "error"); return; }
    const pct = Math.round((score / exam.max_score) * 100);
    const status = score >= exam.max_score / 2 ? "ناجح ✅" : "يحتاج متابعة ⚠️";
    const msg = `مرحباً ولي أمر الطالب/ة: ${student.name}\nنتيجة امتحان (${exam.title}):\n- الدرجة: ${score} من ${exam.max_score} (${pct}%)\n- الحالة: ${status}\nشكراً لتعاونكم.`;
    let phone = student.parent_phone.replace(/\D/g, "");
    if (phone.startsWith("0")) phone = "2" + phone;
    if (!phone.startsWith("2")) phone = "20" + phone;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const sendAllWhatsApp = () => {
    const eligible = students.filter((s) => s.parent_phone && grades[s.id] !== undefined);
    if (eligible.length === 0) { showToast("لا يوجد طلاب برقم ولي أمر ودرجة مرصودة", "error"); return; }
    if (!window.confirm(`إرسال النتائج لـ ${eligible.length} ولي أمر؟`)) return;
    eligible.forEach((s, i) => setTimeout(() => sendWhatsApp(s), i * 500));
    showToast(`جاري إرسال ${eligible.length} رسالة...`);
  };

  const validScores = Object.values(grades).filter((s) => typeof s === "number" && !isNaN(s));
  const gradedCount = validScores.length;
  const avg = gradedCount > 0 ? (validScores.reduce((a, b) => a + b, 0) / gradedCount).toFixed(1) : "—";
  const highest = gradedCount > 0 ? Math.max(...validScores) : "—";
  const lowest = gradedCount > 0 ? Math.min(...validScores) : "—";
  const passCount = validScores.filter((s) => (s / exam.max_score) * 100 >= 50).length;

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.code || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: "تم رصد", value: `${gradedCount}/${students.length}`, color: "var(--color-teal)" },
    { label: "المتوسط", value: String(avg), color: "var(--color-amber)" },
    { label: "أعلى درجة", value: String(highest), color: "#10b981" },
    { label: "أقل درجة", value: String(lowest), color: "#ef4444" },
    { label: "ناجحون", value: String(passCount), color: "#10b981" },
  ];

  return (
    <>
      <style>{PRINT_STYLES}</style>

      {/* PRINT ONLY */}
      <div className="exam-print" style={{ display: "none" }}>
        <div className="ep-title">كشف درجات امتحان: {exam.title}</div>
        <div className="ep-sub">المجموعة: {groupName} | الدرجة النهائية: {exam.max_score} | التاريخ: {exam.exam_date} | عدد الطلاب: {students.length}</div>
        <hr className="ep-hr" />
        <table className="ep-table">
          <thead>
            <tr>
              <th>م</th>
              <th>اسم الطالب</th>
              <th>الكود</th>
              <th>الدرجة</th>
              <th>من {exam.max_score}</th>
              <th>النسبة%</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => {
              const score = grades[s.id];
              const hasScore = score !== undefined && !isNaN(score);
              const pct = hasScore ? Math.round((score / exam.max_score) * 100) : null;
              const pass = pct !== null && pct >= 50;
              return (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td className="ep-name">{s.name}</td>
                  <td>{s.code || "—"}</td>
                  <td>{hasScore ? score : "—"}</td>
                  <td>{exam.max_score}</td>
                  <td>{pct !== null ? `${pct}%` : "—"}</td>
                  <td className={hasScore ? (pass ? "ep-pass" : "ep-fail") : ""}>
                    {hasScore ? (pass ? "ناجح" : "راسب") : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SCREEN ONLY */}
      <div className="exam-screen" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Header */}
        <div className="glass-panel" style={{ padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                onClick={handleBack}
                style={{
                  width: "36px", height: "36px", borderRadius: "8px", border: "1px solid var(--border-color)",
                  background: "rgba(255,255,255,0.05)", color: "var(--text-primary)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                }}
              >
                <ArrowRight size={18} />
              </button>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>{exam.title}</h2>
                  {isDirty && (
                    <span style={{
                      fontSize: "0.72rem", padding: "2px 8px", borderRadius: "20px",
                      background: "rgba(245,158,11,0.15)", color: "var(--color-amber)",
                      border: "1px solid rgba(245,158,11,0.3)"
                    }}>
                      غير محفوظ
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                  الدرجة النهائية: {exam.max_score} | {exam.exam_date}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <Button variant="secondary" size="sm" onClick={() => window.print()} leftIcon={<Printer size={14} />}>طباعة</Button>
              <Button variant="secondary" size="sm" onClick={sendAllWhatsApp} leftIcon={<WhatsAppIcon size={14} />}>إرسال للكل</Button>
              <Button size="sm" onClick={handleSave} disabled={saving || loading || !isDirty} leftIcon={<Save size={14} />}>
                {saving ? "جاري الحفظ..." : "حفظ الدرجات"}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "0.75rem" }}>
          {stats.map((s) => (
            <div key={s.label} className="glass-panel" style={{ padding: "0.9rem 1rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>{s.label}</div>
              <div style={{ fontSize: "1.15rem", fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <ScoreDistributionChart grades={grades} maxScore={exam.max_score} totalStudents={students.length} />

        {/* Table */}
        <div className="glass-panel" style={{ padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <Input
              placeholder="بحث باسم الطالب أو الكود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: "260px" }}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button variant="secondary" size="sm" onClick={handleFillAllMax}>
                إعطاء {exam.max_score} للجميع
              </Button>
              <Button variant="secondary" size="sm" onClick={handleClearAll} style={{ color: "#ef4444" }}>
                تصفير
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="loading-wrapper"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><p>لا يوجد طلاب مطابقين</p></div>
          ) : (
            <div className="table-container">
              <table className="students-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "right" }}>الطالب</th>
                    <th style={{ textAlign: "center", width: "150px" }}>الدرجة / {exam.max_score}</th>
                    <th style={{ textAlign: "center", width: "110px" }}>النسبة</th>
                    <th style={{ textAlign: "center", width: "90px" }}>الحالة</th>
                    <th style={{ textAlign: "center", width: "60px" }}>واتساب</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student) => {
                    const score = grades[student.id];
                    const hasScore = score !== undefined && !isNaN(score);
                    const pct = hasScore ? Math.round((score / exam.max_score) * 100) : null;
                    const pass = pct !== null && pct >= 50;
                    const pctColor = pct === null ? "var(--text-muted)" : pct >= 85 ? "#10b981" : pct >= 50 ? "var(--color-amber)" : "#ef4444";

                    return (
                      <tr key={student.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{student.name}</div>
                          {student.code && <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>#{student.code}</div>}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="number"
                            min={0}
                            max={exam.max_score}
                            value={hasScore ? score : ""}
                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            placeholder="—"
                            className="form-input"
                            style={{
                              textAlign: "center", fontWeight: 700, width: "90px",
                              padding: "0.4rem 0.5rem", fontSize: "0.95rem",
                              borderColor: hasScore ? (pass ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)") : "var(--border-color)"
                            }}
                          />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {pct !== null ? (
                            <span style={{ fontWeight: 700, fontSize: "0.95rem", color: pctColor }}>%{pct}</span>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {hasScore ? (
                            <span style={{
                              fontSize: "0.78rem", padding: "3px 10px", borderRadius: "20px", fontWeight: 600,
                              background: pass ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                              color: pass ? "#10b981" : "#ef4444",
                              border: `1px solid ${pass ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`
                            }}>
                              {pass ? "ناجح" : "راسب"}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            onClick={() => sendWhatsApp(student)}
                            disabled={!student.parent_phone || !hasScore}
                            title={!student.parent_phone ? "لا يوجد رقم ولي أمر" : "إرسال النتيجة على واتساب"}
                            style={{
                              width: "32px", height: "32px", borderRadius: "8px", border: "none",
                              background: (student.parent_phone && hasScore) ? "#25D366" : "rgba(255,255,255,0.05)",
                              color: (student.parent_phone && hasScore) ? "#fff" : "var(--text-muted)",
                              cursor: (student.parent_phone && hasScore) ? "pointer" : "not-allowed",
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              transition: "var(--transition-smooth)"
                            }}
                          >
                            <WhatsAppIcon size={15} />
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
      </div>
    </>
  );
}
