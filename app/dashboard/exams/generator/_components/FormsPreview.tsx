"use client";

import { useState, useRef } from "react";
import { Question } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Printer, RefreshCw } from "lucide-react";
// jsPDF and html2canvas are dynamically imported in handleExportPDF

interface FormsPreviewProps {
  questions: Question[];
  bankTitle: string;
}

interface Form {
  id: number;
  questions: Question[];
}

// Fisher-Yates Shuffle
function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

const modelLetters = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي"];

export function FormsPreview({ questions, bankTitle }: FormsPreviewProps) {
  const [numForms, setNumForms] = useState(2);
  const [forms, setForms] = useState<Form[]>([]);
  const [exporting, setExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const generateForms = () => {
    if (questions.length === 0) return;
    
    // Extract unique sections
    const sections: string[] = [];
    questions.forEach(q => {
      const sec = q.section_name || "";
      if (!sections.includes(sec)) sections.push(sec);
    });

    const newForms: Form[] = [];
    for (let i = 0; i < numForms; i++) {
      let finalQs: Question[] = [];
      
      // Shuffle within each section, then append
      sections.forEach(sec => {
        const secQs = questions.filter(q => (q.section_name || "") === sec);
        let shuffledQs = shuffleArray(secQs);
        
        shuffledQs = shuffledQs.map(q => {
          if (q.options && q.options.length > 0) {
            return { ...q, options: shuffleArray(q.options) };
          }
          return q;
        });
        
        finalQs = [...finalQs, ...shuffledQs];
      });
      
      newForms.push({ id: i + 1, questions: finalQs });
    }
    setForms(newForms);
  };

  const handleExportPDF = async () => {
    if (!printRef.current || forms.length === 0) return;
    setExporting(true);
    
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const formElements = printRef.current.querySelectorAll(".exam-form-page");
      
      for (let i = 0; i < formElements.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        const el = formElements[i] as HTMLElement;

        const canvas = await html2canvas(el, {
          scale: 1.5, // Reduced scale to significantly lower file size while keeping text readable
          useCORS: true,
          logging: false
        });
        
        // Use JPEG with 0.8 quality instead of uncompressed PNG to drastically reduce PDF size
        const imgData = canvas.toDataURL("image/jpeg", 0.8);
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
        
        while (heightLeft > 0) {
          position -= pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
      }
      
      pdf.save(`نماذج_امتحان_${bankTitle}.pdf`);
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء تصدير PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="glass-panel panel-content" style={{ padding: "1.5rem" }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-exam, #printable-exam * {
            visibility: visible;
          }
          #printable-exam {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .exam-scroll-wrapper {
            overflow: visible !important;
            max-height: none !important;
            border: none !important;
            background: none !important;
            padding: 0 !important;
          }
          .exam-form-page {
            box-shadow: none !important;
            margin: 0 !important;
            page-break-after: always;
            min-height: auto !important;
            width: 100% !important;
            padding: 0 !important;
          }
          .print-inner-border {
            min-height: auto !important;
          }
          .hide-on-print {
            display: none !important;
          }
        }
      `}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h3 style={{ margin: 0, color: "var(--text-primary)" }}>توليد النماذج للتجميع والطباعة</h3>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: "0.9rem" }}>عدد النماذج المطلوبة:</label>
          <Input 
            type="number" 
            min={1} max={10} 
            value={numForms} 
            onChange={e => setNumForms(Number(e.target.value))} 
            style={{ width: "80px" }}
          />
          <Button onClick={generateForms} leftIcon={<RefreshCw size={16} />} disabled={questions.length === 0}>
            توليد النماذج الآن
          </Button>
          {forms.length > 0 && (
            <>
              <Button onClick={() => window.print()} leftIcon={<Printer size={16} />} variant="secondary">
                طباعة عبر المتصفح
              </Button>
              <Button onClick={handleExportPDF} leftIcon={<Printer size={16} />} variant="primary" disabled={exporting}>
                {exporting ? "جاري التصدير..." : "تصدير كـ PDF"}
              </Button>
            </>
          )}
        </div>
      </div>

      {forms.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <div className="exam-scroll-wrapper" style={{ 
            background: "#525659", 
            padding: "1.5rem", 
            borderRadius: "12px", 
            maxHeight: "700px", 
            overflowY: "auto",
            border: "1px solid var(--border-color)"
          }}>
            <p className="hide-on-print" style={{ textAlign: "center", color: "#fff", marginBottom: "1.5rem", fontWeight: 600 }}>
              📄 معاينة الصفحات الجاهزة للطباعة والتصدير ({forms.length} نماذج + ورقة الإجابات النموذجية)
            </p>
            
            <div id="printable-exam" ref={printRef} style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              {/* Question Models */}
              {forms.map(form => {
                const modelLetter = modelLetters[(form.id - 1) % modelLetters.length];

                return (
                  <div key={form.id} className="exam-form-page" style={{ 
                    background: "#fff", 
                    width: "210mm", 
                    minHeight: "297mm",
                    padding: "5mm", 
                    boxSizing: "border-box",
                    margin: "0 auto",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    direction: "rtl",
                    color: "#000",
                    position: "relative"
                  }}>
                    <div className="print-inner-border" style={{ border: "2px dashed #000", padding: "13mm", minHeight: "calc(297mm - 10mm)", boxSizing: "border-box" }}>
                      {/* Header */}
                      <div style={{ border: "2px solid #000", padding: "10px 14px", borderRadius: "8px", marginBottom: "1.25rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <div style={{ fontSize: "17px", fontWeight: "bold", color: "#000" }}>{bankTitle}</div>
                          <div style={{ fontSize: "18px", fontWeight: "bold", background: "#000", color: "#fff", padding: "2px 14px", borderRadius: "6px" }}>
                            نموذج ({modelLetter})
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px", fontSize: "13px", borderTop: "1px solid #ccc", paddingTop: "6px" }}>
                          <div>اسم الطالب: ................................................</div>
                          <div>الكود: ...............</div>
                          <div>الدرجة: ..... / .....</div>
                        </div>
                      </div>
                      
                      {/* Questions */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {form.questions.map((q, idx) => {
                        const showSectionHeader = q.section_name && (idx === 0 || form.questions[idx - 1].section_name !== q.section_name);
                        return (
                        <div key={q.id} style={{ breakInside: "avoid" }}>
                          {showSectionHeader && (
                            <div style={{ background: "#f1f5f9", padding: "6px 10px", borderRadius: "6px", fontWeight: "bold", fontSize: "14px", marginBottom: "0.8rem", color: "#0f172a", borderRight: "4px solid #059669" }}>
                              {q.section_name}
                            </div>
                          )}
                          <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "0.4rem", color: "#000", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                            س{idx + 1}: {q.content}
                          </div>
                          {q.image_base64 && (
                            <div style={{ margin: "0.75rem 0", maxWidth: "500px", border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden", padding: "4px", backgroundColor: "#fff" }}>
                              <img src={q.image_base64} style={{ width: "100%", maxHeight: "250px", objectFit: "contain", display: "block" }} alt="مرفق" />
                            </div>
                          )}
                          {q.question_type === "essay" ? (
                            <div style={{ marginTop: "1rem", marginBottom: "1rem", border: "2px solid #94a3b8", borderRadius: "8px", padding: "0.5rem 1rem", backgroundColor: "#f8fafc" }}>
                              {Array.from({ length: q.essay_lines || 3 }).map((_, i) => (
                                <div key={i} style={{ borderBottom: "1px dashed #cbd5e1", height: "1.8rem", marginBottom: "0.2rem" }} />
                              ))}
                            </div>
                          ) : (
                            q.options && q.options.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", paddingRight: "1.25rem", marginTop: "0.5rem" }}>
                                {q.options.map((opt, oIdx) => {
                                  // Ignore base64 images when calculating length so they can be placed side by side
                                  const getLen = (o: string) => o.startsWith("data:image/") ? 0 : o.length;
                                  const isVeryLong = q.options!.some(o => getLen(o) > 75);
                                  const isMedium = q.options!.some(o => getLen(o) > 30);
                                  const width = isVeryLong ? "100%" : isMedium ? "calc(50% - 0.5rem)" : "calc(25% - 0.75rem)";
                                  return (
                                    <div key={oIdx} style={{ width, fontSize: "13px", color: "#222", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "1px solid #000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold", flexShrink: 0, marginTop: "2px" }}>
                                        {modelLetters[oIdx % modelLetters.length]}
                                      </div>
                                      <div style={{ flex: 1, wordBreak: "break-word", lineHeight: "1.5" }}>
                                        {opt.startsWith("data:image/") ? <img src={opt} style={{ maxHeight: "60px", maxWidth: "100%", display: "block" }} alt="خيار" /> : opt}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )
                          )}
                        </div>
                        );
                      })}
                    </div>
                    </div>
                  </div>
                );
              })}

              {/* Model Answer Key Sheet for Teacher */}
              <div className="exam-form-page" style={{ 
                background: "#fff", 
                width: "210mm", 
                minHeight: "297mm",
                padding: "5mm", 
                boxSizing: "border-box",
                margin: "0 auto",
                border: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                direction: "rtl",
                color: "#000"
              }}>
                <div className="print-inner-border" style={{ border: "2px dashed #10b981", padding: "13mm", minHeight: "calc(297mm - 10mm)", boxSizing: "border-box" }}>
                  <div style={{ textAlign: "center", marginBottom: "1.5rem", borderBottom: "3px double #10b981", paddingBottom: "10px" }}>
                    <h2 style={{ fontSize: "22px", color: "#059669", margin: "0 0 5px 0", fontWeight: 800 }}>🔑 مفتاح الإجابات النموذجية لكل النماذج (خاص بالمدرس)</h2>
                    <div style={{ fontSize: "14px", color: "#475569" }}>{bankTitle}</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(forms.length, 4)}, 1fr)`, gap: "12px" }}>
                    {forms.map(form => {
                    const modelLetter = modelLetters[(form.id - 1) % modelLetters.length];
                    return (
                      <div key={form.id} style={{ border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden" }}>
                        <div style={{ background: "#059669", color: "#fff", textAlign: "center", padding: "6px", fontWeight: "bold", fontSize: "15px" }}>
                          نموذج ({modelLetter})
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                          <thead>
                            <tr style={{ background: "#f1f5f9" }}>
                              <th style={{ padding: "4px", borderBottom: "1px solid #cbd5e1", width: "40px" }}>س</th>
                              <th style={{ padding: "4px", borderBottom: "1px solid #cbd5e1" }}>الإجابة الصحيحة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {form.questions.map((q, idx) => (
                              <tr key={q.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                <td style={{ padding: "4px", textAlign: "center", fontWeight: "bold" }}>{idx + 1}</td>
                                <td style={{ padding: "4px", textAlign: "center", color: q.correct_answer ? "#059669" : "#64748b", fontWeight: 600 }}>
                                  {q.options && q.correct_answer && q.options.indexOf(q.correct_answer) !== -1 
                                    ? modelLetters[q.options.indexOf(q.correct_answer)] 
                                    : (q.correct_answer?.startsWith("data:image/") ? "صورة (مرفقة)" : (q.correct_answer || "مقالى / غير محددة"))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
