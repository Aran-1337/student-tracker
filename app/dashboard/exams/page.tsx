"use client";

import { useExamsPage } from "./_hooks/useExamsPage";
import { ExamsHeader } from "./_components/ExamsHeader";
import { ExamsList } from "./_components/ExamsList";
import { GradeEntryTable } from "./_components/GradeEntryTable";
import { CheckCircle2, XCircle } from "lucide-react";

export default function ExamsPage() {
  const {
    loading, userId, groups,
    selectedGroupId, setSelectedGroupId,
    exams, students,
    selectedExam, setSelectedExam,
    toast, showToast,
    handleAddExam, handleEditExam, handleDeleteExam,
  } = useExamsPage();

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner" />
      </div>
    );
  }

  if (!userId) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", padding: "1rem" }}>
      {!selectedExam && (
        <ExamsHeader
          groups={groups}
          selectedGroupId={selectedGroupId}
          onGroupChange={(id) => { setSelectedGroupId(id); setSelectedExam(null); }}
        />
      )}

      {selectedGroupId && !selectedExam && (
        <ExamsList
          exams={exams}
          teacherId={userId}
          groupId={selectedGroupId}
          onSelectExam={setSelectedExam}
          onAddExam={handleAddExam}
          onDeleteExam={handleDeleteExam}
          onEditExam={handleEditExam}
        />
      )}

      {!selectedGroupId && !selectedExam && (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📚</div>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem", margin: 0 }}>
            اختر مجموعة من الأعلى لعرض امتحاناتها
          </p>
        </div>
      )}

      {selectedExam && (
        <GradeEntryTable
          exam={selectedExam}
          students={students}
          groupName={groups.find(g => g.id === selectedGroupId)?.name || ""}
          onBack={() => setSelectedExam(null)}
          showToast={showToast}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
          padding: "0.85rem 1.5rem", borderRadius: "12px", zIndex: 9999,
          display: "flex", alignItems: "center", gap: "0.6rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          background: toast.type === "success" ? "#064e3b" : "#7f1d1d",
          border: `1px solid ${toast.type === "success" ? "#059669" : "#dc2626"}`,
          color: toast.type === "success" ? "#ecfdf5" : "#fef2f2",
          fontSize: "0.9rem", fontWeight: 500,
          animation: "slideUp 0.3s ease forwards",
          whiteSpace: "nowrap"
        }}>
          {toast.type === "success"
            ? <CheckCircle2 size={16} style={{ color: "#10b981", flexShrink: 0 }} />
            : <XCircle size={16} style={{ color: "#ef4444", flexShrink: 0 }} />
          }
          {toast.message}
        </div>
      )}
    </div>
  );
}
