"use client";

import { RiWhatsappLine } from "react-icons/ri";
import { HiOutlineChevronRight, HiOutlineChevronLeft } from "react-icons/hi2";
import { MdOutlineInbox } from "react-icons/md";
import { Student, Grade, Group } from "@/lib/types";
import { PAGE_SIZE } from "../_hooks/useStudentReports";

interface Props {
  students: Student[];
  grades: Grade[];
  groups: Group[];
  getAttendance: (id: string) => { present: number; absent: number };
  selectedMonthIndex: number;
  onSendWhatsApp: (s: Student) => void;
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
  totalFiltered: number;
}

export default function StudentsReportTable({
  students, grades, groups, getAttendance,
  selectedMonthIndex, onSendWhatsApp,
  page, totalPages, setPage, totalFiltered,
}: Props) {
  return (
    <div className="glass-panel sr-table-panel">
      {/* Table */}
      <div className="sr-table-wrap">
        <table className="sr-table">
          <thead>
            <tr>
              <th>#</th>
              <th style={{ textAlign: "right" }}>الطالب</th>
              <th>السنة / المجموعة</th>
              <th>الحضور</th>
              <th>الغياب</th>
              <th>نسبة الحضور</th>
              <th>الدفع</th>
              <th>واتساب</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="sr-empty">
                    <MdOutlineInbox size={40} />
                    <span>لا يوجد طلاب مطابقين للفلتر</span>
                  </div>
                </td>
              </tr>
            ) : (
              students.map((student, idx) => {
                const att = getAttendance(student.id);
                const total = att.present + att.absent;
                const pct = total > 0 ? Math.round((att.present / total) * 100) : 0;
                const isPaid = student.months?.[selectedMonthIndex] === true;
                const hasPhone = !!student.parent_phone;
                const gradeName = grades.find((g) => g.id === student.grade_id)?.name ?? "";
                const groupName = groups.find((g) => g.id === student.group_id)?.name ?? "";
                const rowNum = (page - 1) * PAGE_SIZE + idx + 1;

                return (
                  <tr key={student.id} className={!isPaid ? "sr-row-unpaid" : ""}>
                    <td className="sr-td-num">{rowNum}</td>
                    <td>
                      <div className="sr-student-name">{student.name}</div>
                      {student.code && <div className="sr-student-code">{student.code}</div>}
                    </td>
                    <td>
                      <div className="sr-badges">
                        {gradeName && <span className="sr-badge sr-badge-grade">{gradeName}</span>}
                        {groupName && <span className="sr-badge sr-badge-group">{groupName}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="sr-present">{att.present}</span>
                    </td>
                    <td>
                      <span className={att.absent > 0 ? "sr-absent" : "sr-zero"}>{att.absent}</span>
                    </td>
                    <td>
                      <div className="sr-progress-wrap">
                        <div className="sr-progress-bar">
                          <div
                            className="sr-progress-fill"
                            style={{
                              width: `${pct}%`,
                              background: pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444",
                            }}
                          />
                        </div>
                        <span className="sr-progress-pct">{pct}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`sr-payment-badge ${isPaid ? "paid" : "unpaid"}`}>
                        {isPaid ? "مدفوع" : "غير مدفوع"}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`sr-wa-btn ${hasPhone ? "active" : "disabled"}`}
                        onClick={() => onSendWhatsApp(student)}
                        disabled={!hasPhone}
                        title={hasPhone ? `إرسال لـ ${student.parent_phone}` : "لا يوجد رقم"}
                      >
                        <RiWhatsappLine size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="sr-pagination">
          <span className="sr-page-info">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalFiltered)} من {totalFiltered}
          </span>
          <div className="sr-page-btns">
            <button
              className="sr-page-btn"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <HiOutlineChevronRight size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="sr-page-dots">…</span>
                ) : (
                  <button
                    key={p}
                    className={`sr-page-btn ${page === p ? "active" : ""}`}
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              className="sr-page-btn"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              <HiOutlineChevronLeft size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
