"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardCheck, ScanLine, FileDown, ChevronRight, ChevronLeft } from "lucide-react";

import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";

import { useAttendanceData } from "./_hooks/useAttendanceData";
import { useAttendanceActions } from "./_hooks/useAttendanceActions";
import { AttendanceFilters } from "./_components/AttendanceFilters";
import { AttendanceStats } from "./_components/AttendanceStats";
import { AttendanceTable } from "./_components/AttendanceTable";
import { QRModal } from "./_components/QRModal";
import { ConfirmDeleteModal } from "./_components/ConfirmDeleteModal";
import { exportAttendancePrint } from "./_utils/exportUtils";
import { useOnlineSync } from "./scan/_hooks/useOnlineSync";
import { Student } from "@/lib/types";

const arabicMonths = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

export default function AttendancePage() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [qrStudent, setQrStudent] = useState<Student | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  const data = useAttendanceData();

  useOnlineSync((count) => {
    if (count > 0 && data.loadAttendance) data.loadAttendance();
  });

  const actions = useAttendanceActions({
    userId: data.userId,
    attendance: data.attendance,
    setAttendance: data.setAttendance,
    filteredStudents: data.filteredStudents,
    showToast,
  });

  const selectedGroup = data.groups.find(g => g.id === data.selectedGroupId);

  const currentSaturday = (() => {
    const d = new Date();
    const diff = d.getDay() === 6 ? 0 : d.getDay() + 1;
    d.setDate(d.getDate() - diff);
    d.setHours(0,0,0,0);
    return d;
  })();
  const isPastWeek = data.selectedWeekStart.getTime() < currentSaturday.getTime();

  if (data.loading) return <Spinner fullScreen />;

  return (
    <div className="attendance-page">
      {/* ── Header ── */}
      <div className="attendance-header">
        <div className="attendance-header-left">
          <div className="attendance-header-icon">
            <ClipboardCheck size={22} />
          </div>
          <div>
            <h1 className="attendance-title">الحضور والغياب</h1>
            <p className="attendance-subtitle">تتبع حضور الطلاب يدوياً أو بالسكان</p>
          </div>
        </div>
        <Link href="/dashboard/attendance/scan" className="btn btn-primary scan-btn">
          <ScanLine size={17} />
          <span>سكان QR</span>
        </Link>
      </div>

      {/* ── Filters ── */}
      <AttendanceFilters
        grades={data.grades}
        groups={data.groups}
        selectedGradeId={data.selectedGradeId}
        selectedGroupId={data.selectedGroupId}
        onGradeChange={v => { data.setSelectedGradeId(v); data.setSelectedGroupId("all"); }}
        onGroupChange={data.setSelectedGroupId}
      />

      {/* ── Stats ── */}
      <AttendanceStats
        students={data.filteredStudents}
        allDates={data.monthlyDates}
        attendance={data.monthlyAttendance}
        selectedWeekStart={data.selectedWeekStart}
      />

      {/* ── Week Navigator ── */}
      {data.selectedGroupId !== "all" && (
        <div className="glass-panel panel-content" style={{ display: "flex", justifyContent: "center", padding: "0.5rem" }}>
          <div className="week-navigation" style={{ display: "flex", alignItems: "center", gap: "2rem", width: "100%", justifyContent: "space-between" }}>
            <button className="btn btn-secondary" style={{ padding: "0.5rem 1rem" }} onClick={() => {
              const d = new Date(data.selectedWeekStart);
              d.setDate(d.getDate() - 7);
              data.setSelectedWeekStart(d);
            }}>
              <ChevronRight size={18} />
            </button>
            
            <div style={{ fontWeight: 600, color: "var(--color-primary)", fontSize: "1.1rem" }}>
              {data.selectedWeekStart.getDate()} - {(() => {
                const e = new Date(data.selectedWeekStart);
                e.setDate(e.getDate() + 6);
                return e.getDate();
              })()} {arabicMonths[data.selectedWeekStart.getMonth()]}
              {data.selectedWeekStart.getTime() === currentSaturday.getTime() ? ' (الأسبوع الحالي)' : ''}
            </div>

            <button className="btn btn-secondary" style={{ padding: "0.5rem 1rem" }} onClick={() => {
              const d = new Date(data.selectedWeekStart);
              d.setDate(d.getDate() + 7);
              data.setSelectedWeekStart(d);
            }}>
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── Table Panel ── */}
      <div className="glass-panel panel-content">
        <div className="attendance-table-header">
          <div className="attendance-table-title">
            <ClipboardCheck size={17} style={{ color: "var(--color-teal)" }} />
            <span>
              كشف الحضور الأسبوعي
              {selectedGroup ? ` — ${selectedGroup.name}` : ""}
            </span>
            <span className="student-count-badge">{data.filteredStudents.length} طالب</span>
          </div>

          {data.filteredStudents.length > 0 && data.allDates.length > 0 && (
            <div className="export-actions">
              <button
                className="export-btn"
                onClick={() => exportAttendancePrint(
                  data.filteredStudents, data.allDates, data.attendance,
                  data.selectedWeekStart.getMonth() + 1, data.selectedWeekStart.getFullYear(), selectedGroup?.name || "الكل",
                  data.selectedGroupId === "all" ? data.groups : undefined
                )}
                title="طباعة الكشف"
              >
                <FileDown size={15} />
                <span>تصدير PDF</span>
              </button>
            </div>
          )}
        </div>

        <AttendanceTable
          students={data.filteredStudents}
          allDates={data.allDates}
          attendance={data.attendance}
          saving={actions.saving}
          selectedGroupId={data.selectedGroupId}
          groups={data.groups}
          isPastWeek={isPastWeek}
          getRecordStatus={actions.getRecordStatus}
          getAttendancePercent={actions.getAttendancePercent}
          onToggle={actions.handleToggle}
          onMarkAll={actions.handleMarkAllSession}
          onMarkAllAbsent={actions.handleMarkAllAbsent}
          onClearSession={actions.handleClearSession}
          onShowQR={setQrStudent}
        />
      </div>

      {/* ── Modals ── */}
      <QRModal student={qrStudent} onClose={() => setQrStudent(null)} />

      {actions.pendingDelete && (
        <ConfirmDeleteModal
          studentName={actions.pendingDelete.studentName}
          onConfirm={actions.confirmDelete}
          onCancel={() => actions.setPendingDelete(null)}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
