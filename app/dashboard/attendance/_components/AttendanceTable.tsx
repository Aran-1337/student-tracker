"use client";

import { Student, AttendanceRecord } from "@/lib/types";
import { CheckCircle2, AlertCircle, QrCode, Trash2, CheckSquare, XSquare } from "lucide-react";

interface Props {
  students: Student[];
  allDates: string[];
  attendance: AttendanceRecord[];
  saving: boolean;
  isPresent: (sid: string, date: string) => boolean;
  getAttendancePercent: (sid: string, dates: string[]) => number;
  onToggle: (student: Student, date: string) => void;
  onMarkAll: (date: string) => void;
  onClearSession: (date: string) => void;
  onShowQR: (student: Student) => void;
}

export function AttendanceTable({
  students, allDates, saving,
  isPresent, getAttendancePercent,
  onToggle, onMarkAll, onClearSession, onShowQR,
}: Props) {
  const today = new Date().toISOString().split("T")[0];

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
        <thead>
          <tr>
            <th style={{ width: 40, textAlign: "center" }}>#</th>
            <th style={{ minWidth: 160 }}>الطالب</th>
            {allDates.map(dateStr => {
              const isPast = dateStr < today;
              const shortDate = dateStr.slice(5).split("-").reverse().join("/");
              return (
                <th key={dateStr} className="session-col-header">
                  <div className="session-header-inner">
                    <span className="session-date-label">{shortDate}</span>
                    <div className="session-header-actions">
                      <button
                        className="session-action-btn session-action-check"
                        onClick={() => onMarkAll(dateStr)}
                        disabled={saving || isPast}
                        title={isPast ? "لا يمكن تعديل يوم سابق" : "تحضير الكل"}
                      >
                        <CheckSquare size={11} />
                      </button>
                      <button
                        className="session-action-btn session-action-clear"
                        onClick={() => onClearSession(dateStr)}
                        disabled={saving || isPast}
                        title={isPast ? "لا يمكن تعديل يوم سابق" : "مسح الكل"}
                      >
                        <XSquare size={11} />
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
        <tbody>
          {students.map((student, index) => {
            const percent = getAttendancePercent(student.id, allDates);
            const percentColor = percent >= 75 ? "#10b981" : percent >= 50 ? "#f59e0b" : "#ef4444";
            const rowDanger = percent < 75 && allDates.length > 0;
            return (
              <tr key={student.id} className={rowDanger ? "row-danger" : ""}>
                <td style={{ textAlign: "center", color: "var(--text-muted)", fontWeight: 600 }}>
                  {index + 1}
                </td>
                <td>
                  <div className="student-name-cell">
                    <span className="student-name">{student.name}</span>
                  </div>
                </td>
                {allDates.map(dateStr => {
                  const present = isPresent(student.id, dateStr);
                  const isPast = dateStr < today;
                  return (
                    <td key={dateStr} style={{ textAlign: "center", padding: "0.5rem 0.25rem" }}>
                      <button
                        className={`attendance-cell-btn ${present ? "present" : "absent"} ${isPast ? "locked" : ""}`}
                        onClick={() => !isPast && onToggle(student, dateStr)}
                        disabled={isPast}
                        title={
                          isPast
                            ? "لا يمكن تعديل يوم سابق"
                            : present
                            ? `إلغاء حضور ${student.name}`
                            : `تسجيل حضور ${student.name}`
                        }
                      >
                        {present && <CheckCircle2 size={16} />}
                      </button>
                    </td>
                  );
                })}
                <td style={{ textAlign: "center" }}>
                  <div className="percent-cell">
                    <span className="percent-value" style={{ color: percentColor }}>{percent}%</span>
                    <div className="percent-bar-bg">
                      <div
                        className="percent-bar-fill"
                        style={{ width: `${percent}%`, background: percentColor }}
                      />
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
        </tbody>
      </table>
    </div>
  );
}
