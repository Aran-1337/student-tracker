"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardCheck, ScanLine, Printer } from "lucide-react";

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
  const [newSessionDate, setNewSessionDate] = useState(new Date().toISOString().split("T")[0]);

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  const data = useAttendanceData();

  useOnlineSync((count) => {
    if (count > 0) data.loadAttendance();
  });

  const actions = useAttendanceActions({
    userId: data.userId,
    attendance: data.attendance,
    setAttendance: data.setAttendance,
    filteredStudents: data.filteredStudents,
    showToast,
  });

  const selectedGroup = data.groups.find(g => g.id === data.selectedGroupId);

  const handleAddSession = () => {
    if (data.selectedGroupId === "all") {
      showToast("يرجى اختيار مجموعة محددة أولاً", "error");
      return;
    }
    if (!newSessionDate) return;
    if (data.allDates.includes(newSessionDate)) {
      showToast("هذا التاريخ موجود بالفعل");
      return;
    }
    data.setManualDates([...data.manualDates, newSessionDate]);
    showToast(`تم فتح حصة بتاريخ ${newSessionDate.split("-").reverse().join("/")}`);
  };

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
        selectedMonth={data.selectedMonth}
        selectedYear={data.selectedYear}
        newSessionDate={newSessionDate}
        onGradeChange={v => { data.setSelectedGradeId(v); data.setSelectedGroupId("all"); }}
        onGroupChange={data.setSelectedGroupId}
        onMonthChange={data.setSelectedMonth}
        onYearChange={data.setSelectedYear}
        onSessionDateChange={setNewSessionDate}
        onAddSession={handleAddSession}
      />

      {/* ── Stats ── */}
      <AttendanceStats
        students={data.filteredStudents}
        allDates={data.allDates}
        attendance={data.attendance}
        month={data.selectedMonth}
        year={data.selectedYear}
      />

      {/* ── Table Panel ── */}
      <div className="glass-panel panel-content">
        <div className="attendance-table-header">
          <div className="attendance-table-title">
            <ClipboardCheck size={17} style={{ color: "var(--color-teal)" }} />
            <span>
              كشف الحضور — {arabicMonths[data.selectedMonth - 1]} {data.selectedYear}
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
                  data.selectedMonth, data.selectedYear, selectedGroup?.name || "الكل"
                )}
                title="طباعة الكشف"
              >
                <Printer size={15} />
                <span>طباعة</span>
              </button>
            </div>
          )}
        </div>

        <AttendanceTable
          students={data.filteredStudents}
          allDates={data.allDates}
          attendance={data.attendance}
          saving={actions.saving}
          isPresent={actions.isPresent}
          getAttendancePercent={actions.getAttendancePercent}
          onToggle={actions.handleToggle}
          onMarkAll={actions.handleMarkAllSession}
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
