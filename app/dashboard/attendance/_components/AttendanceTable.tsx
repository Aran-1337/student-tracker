"use client";

import { Student, AttendanceRecord, Group } from "@/lib/types";
import { CheckCircle2, AlertCircle, QrCode, CheckSquare, XSquare, XCircle, CalendarX } from "lucide-react";

interface Props {
  students: Student[];
  allDates: string[];
  attendance: AttendanceRecord[];
  saving: boolean;
  selectedGroupId: string;
  groups: Group[];
  isPastWeek: boolean;
  getRecordStatus: (sid: string, date: string) => string | null;
  getAttendancePercent: (sid: string, dates: string[]) => number;
  onToggle: (student: Student, date: string) => void;
  onMarkAll: (date: string) => void;
  onMarkAllAbsent: (date: string) => void;
  onClearSession: (date: string) => void;
  onShowQR: (student: Student) => void;
}

const arabicDaysShort = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function TableHeaders({ allDates, today, saving, isPastWeek, onMarkAll, onMarkAllAbsent, onClearSession }: {
  allDates: string[]; today: string; saving: boolean; isPastWeek: boolean;
  onMarkAll: (d: string) => void; onMarkAllAbsent: (d: string) => void; onClearSession: (d: string) => void;
}) {
  return (
    <thead>
      <tr>
        <th style={{ width: 40, textAlign: "center" }}>#</th>
        <th style={{ minWidth: 60, textAlign: "center" }}>الكود</th>
        <th style={{ minWidth: 160 }}>الطالب</th>
        {allDates.map(dateStr => {
          const isFuture = dateStr > today;
          const isLocked = isFuture || isPastWeek;
          const dateObj = new Date(dateStr);
          const dayName = arabicDaysShort[dateObj.getDay()];
          const shortDate = dateStr.slice(5).split("-").reverse().join("/");
          return (
            <th key={dateStr} className="session-col-header" style={{ minWidth: "90px" }}>
              <div className="session-header-inner">
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <span className="session-date-label" style={{ fontSize: "0.85rem", opacity: 0.8 }}>{dayName}</span>
                  <span className="session-date-label">{shortDate}</span>
                  {isFuture && (
                    <span style={{ fontSize: "0.65rem", color: "#60a5fa", background: "rgba(59,130,246,0.1)", padding: "1px 6px", borderRadius: "4px", marginTop: "2px" }}>قادمة</span>
                  )}
                </div>
                <div className="session-header-actions">
                  <button className="session-action-btn session-action-check" onClick={() => onMarkAll(dateStr)} disabled={saving || isLocked} title={isFuture ? "تسجيل حضور مسبق غير مسموح" : isPastWeek ? "الأسبوع منتهي لا يمكن التعديل" : "تحضير الكل"}>
                    <CheckSquare size={11} />
                  </button>
                  <button className="session-action-btn session-action-clear" onClick={() => onMarkAllAbsent(dateStr)} disabled={saving || isLocked} title={isFuture ? "تسجيل حضور مسبق غير مسموح" : isPastWeek ? "الأسبوع منتهي لا يمكن التعديل" : "تسجيل غياب الكل"}>
                    <XSquare size={11} />
                  </button>
                  <button className="session-action-btn session-action-clear" onClick={() => onClearSession(dateStr)} disabled={saving || isLocked} title={isFuture ? "تسجيل حضور مسبق غير مسموح" : isPastWeek ? "الأسبوع منتهي لا يمكن التعديل" : "إلغاء الحصة (حذف السجل)"}>
                    <CalendarX size={11} />
                  </button>
                </div>
              </div>
            </th>
          );
        })}
        <th style={{ textAlign: "center", minWidth: 80 }}>النسبة</th>
        <th style={{ textAlign: "center", minWidth: 56 }}>QR</th>
      </tr>
    </thead>
  );
}

function StudentRows({ students, allDates, today, saving, isPastWeek, getRecordStatus, getAttendancePercent, onToggle, onShowQR }: {
  students: Student[]; allDates: string[]; today: string; saving: boolean; isPastWeek: boolean;
  getRecordStatus: (sid: string, date: string) => string | null;
  getAttendancePercent: (sid: string, dates: string[]) => number;
  onToggle: (student: Student, date: string) => void;
  onShowQR: (student: Student) => void;
}) {
  return (
    <>
      {students.map((student, index) => {
        const percent = getAttendancePercent(student.id, allDates);
        const percentColor = percent >= 75 ? "#10b981" : percent >= 50 ? "#f59e0b" : "#ef4444";
        const rowDanger = percent < 75 && allDates.length > 0;
        
        const studentCreatedDate = student.created_at ? student.created_at.split("T")[0] : null;

        return (
          <tr key={student.id} className={rowDanger ? "row-danger" : ""}>
            <td style={{ textAlign: "center", color: "var(--text-muted)", fontWeight: 600 }}>{index + 1}</td>
            <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600 }}>
              {student.code || "—"}
            </td>
            <td>
              <div className="student-name-cell">
                <span className="student-name">{student.name}</span>
              </div>
            </td>
            {allDates.map(dateStr => {
              // LATE JOINER LOGIC
              if (studentCreatedDate && dateStr < studentCreatedDate) {
                return (
                  <td key={dateStr} style={{ textAlign: "center", padding: "0.5rem 0.25rem" }}>
                    <div style={{ color: "var(--text-muted)", opacity: 0.5, fontWeight: "bold" }}>-</div>
                  </td>
                );
              }

              const status = getRecordStatus(student.id, dateStr);
              const isFuture = dateStr > today;
              const isLocked = isFuture || isPastWeek;
              
              return (
                <td key={dateStr} style={{ textAlign: "center", padding: "0.5rem 0.25rem" }}>
                  <button
                    className={`attendance-cell-btn ${status === 'present' ? 'present' : status === 'absent' ? 'absent-cell' : 'empty-cell'} ${isLocked ? 'locked' : ''}`}
                    onClick={() => !isLocked && onToggle(student, dateStr)}
                    disabled={isLocked}
                    title={isFuture ? "تسجيل حضور مسبق غير مسموح" : isPastWeek ? "الأسبوع منتهي لا يمكن التعديل" : status === 'present' ? `تغيير إلى غياب ${student.name}` : status === 'absent' ? `مسح سجل ${student.name}` : `تسجيل حضور ${student.name}`}
                    style={status === 'absent' ? { color: "var(--color-danger)", borderColor: "var(--color-danger)", background: "rgba(239, 68, 68, 0.1)" } : {}}
                  >
                    {status === 'present' ? <CheckCircle2 size={16} /> : status === 'absent' ? <XCircle size={16} /> : null}
                  </button>
                </td>
              );
            })}
            <td style={{ textAlign: "center" }}>
              <div className="percent-cell">
                <span className="percent-value" style={{ color: percentColor }}>{percent}%</span>
                <div className="percent-bar-bg">
                  <div className="percent-bar-fill" style={{ width: `${percent}%`, background: percentColor }} />
                </div>
              </div>
            </td>
            <td style={{ textAlign: "center" }}>
              <button className="qr-cell-btn" onClick={() => onShowQR(student)} title="عرض QR">
                <QrCode size={15} />
              </button>
            </td>
          </tr>
        );
      })}
    </>
  );
}

export function AttendanceTable({
  students, allDates, saving, selectedGroupId, groups, isPastWeek,
  getRecordStatus, getAttendancePercent,
  onToggle, onMarkAll, onMarkAllAbsent, onClearSession, onShowQR,
}: Props) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  if (selectedGroupId === "all") {
    return (
      <div className="empty-state">
        <AlertCircle size={48} className="empty-state-icon" />
        <p>يرجى اختيار مجموعة من الأعلى لعرض كشف الحضور الأسبوعي.</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="empty-state">
        <AlertCircle size={48} className="empty-state-icon" />
        <p>لا يوجد طلاب في هذه المجموعة.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="students-table attendance-table">
        <TableHeaders allDates={allDates} today={today} saving={saving} isPastWeek={isPastWeek} onMarkAll={onMarkAll} onMarkAllAbsent={onMarkAllAbsent} onClearSession={onClearSession} />
        <tbody>
          <StudentRows 
            students={students} 
            allDates={allDates} 
            today={today} 
            saving={saving}
            isPastWeek={isPastWeek}
            getRecordStatus={getRecordStatus} 
            getAttendancePercent={getAttendancePercent} 
            onToggle={onToggle} 
            onShowQR={onShowQR} 
          />
        </tbody>
      </table>
    </div>
  );
}
