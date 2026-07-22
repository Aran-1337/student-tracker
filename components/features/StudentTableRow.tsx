import React from "react";
import Link from "next/link";
import { Trash2, CheckSquare, Square, User, CheckCircle, XCircle } from "lucide-react";
import { Student, Group, BookDef, Grade } from "@/lib/types";
import { Button } from "@/components/ui/Button";

const formatTimeTo12H = (timeStr: string) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const ampm = hours >= 12 ? "م" : "ص";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
};

const arabicMonths = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const currentMonthIdx = new Date().getMonth();

export interface StudentTableRowProps {
  student: Student;
  groups: Group[];
  grades: Grade[];
  teacherBooks: BookDef[];
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleMonth: (student: Student, monthIndex: number) => void;
  onToggleBook: (student: Student, bookId: string) => void;
  onDelete: (id: string) => void;
  onUpdateGroup: (id: string, groupId: string) => void;
}

export function StudentTableRow({
  student, groups, grades, teacherBooks,
  isSelected, onToggleSelect, onToggleMonth, onToggleBook, onDelete, onUpdateGroup,
}: StudentTableRowProps) {
  const gradeGroups = groups.filter((g) => !student.grade_id || g.grade_id === student.grade_id);
  const grade = grades.find((g) => g.id === (student.grade_id || groups.find((gr) => gr.id === student.group_id)?.grade_id));
  const paidThisMonth = student.months?.[currentMonthIdx] === true;
  const studentBooks = teacherBooks.filter((b) => !b.grade_id || b.grade_id === student.grade_id);

  return (
    <tr className={isSelected ? "row-selected" : ""}>
      {/* Checkbox */}
      <td style={{ textAlign: "center", width: "40px" }}>
        <button onClick={() => onToggleSelect(student.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", margin: "0 auto" }}>
          {isSelected ? <CheckSquare size={18} className="color-teal" /> : <Square size={18} />}
        </button>
      </td>

      {/* Code */}
      <td style={{ textAlign: "center" }}>
        <span style={{ fontFamily: "monospace", fontSize: "0.85rem", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "6px" }}>
          {student.code || "—"}
        </span>
      </td>

      {/* Grade */}
      <td style={{ textAlign: "center" }}>
        {grade ? (
          <span style={{ fontSize: "0.8rem", padding: "2px 10px", borderRadius: "20px", background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.2)", whiteSpace: "nowrap" }}>
            {grade.name}
          </span>
        ) : <span style={{ color: "var(--text-secondary)" }}>—</span>}
      </td>

      {/* Name + payment badge */}
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontWeight: 600 }}>{student.name}</span>
          <span title={paidThisMonth ? "دفع هذا الشهر" : "لم يدفع هذا الشهر"} style={{ display: "flex", flexShrink: 0 }}>
            {paidThisMonth
              ? <CheckCircle size={14} style={{ color: "#10b981" }} />
              : <XCircle size={14} style={{ color: "#ef4444" }} />}
          </span>
        </div>
      </td>

      {/* Group (grade-filtered) */}
      <td style={{ textAlign: "center" }}>
        <select
          className="form-input"
          value={student.group_id || ""}
          onChange={(e) => onUpdateGroup(student.id, e.target.value)}
          style={{ padding: "0 10px", height: "32px", fontSize: "0.82rem", minWidth: "150px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", borderRadius: "6px" }}
        >
          <option value="" style={{ background: "#0f172a" }}>بدون مجموعة</option>
          {gradeGroups.map((g) => (
            <option key={g.id} value={g.id} style={{ background: "#0f172a" }}>
              {g.name} ({g.day_of_week} - {formatTimeTo12H(g.time)})
            </option>
          ))}
        </select>
      </td>

      {/* Months */}
      <td style={{ textAlign: "center" }}>
        <div className="months-grid" style={{ justifyContent: "center" }}>
          {student.months?.map((isPaid, idx) => (
            <button
              key={idx}
              className={`month-toggle ${isPaid ? "paid" : ""} ${idx === currentMonthIdx ? "current-month" : ""}`}
              onClick={() => onToggleMonth(student, idx)}
              title={`${arabicMonths[idx]} - ${isPaid ? "مدفوع" : "غير مدفوع"}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </td>

      {/* Books */}
      <td style={{ textAlign: "center" }}>
        <div className="book-toggles" style={{ justifyContent: "center" }}>
          {studentBooks.length === 0
            ? <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>—</span>
            : studentBooks.map((book) => {
                const hasBook = student.received_books?.includes(book.id);
                return (
                  <button
                    key={book.id}
                    className={`book-toggle ${hasBook ? "active" : ""}`}
                    onClick={() => onToggleBook(student, book.id)}
                    title={book.name}
                  >
                    {book.name}
                  </button>
                );
              })}
        </div>
      </td>

      {/* Actions */}
      <td style={{ textAlign: "center" }}>
        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
          <Link href={`/dashboard/students/${student.id}`} style={{ textDecoration: "none" }}>
            <Button variant="secondary" size="sm" title="ملف الطالب" style={{ border: "none", background: "rgba(59,130,246,0.1)" }}>
              <User size={15} className="color-primary" />
            </Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={() => onDelete(student.id)} title="حذف الطالب" style={{ border: "none", background: "rgba(239,68,68,0.1)" }}>
            <Trash2 size={15} className="color-danger" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
