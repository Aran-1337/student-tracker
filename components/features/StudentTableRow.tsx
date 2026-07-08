import React from 'react';
import { Trash2, CheckSquare, Square } from 'lucide-react';
import { Student, Group, BookDef } from '@/lib/types';
import { Button } from '@/components/ui/Button';

// Replaces the `<tr>` inside the students table in app/dashboard/students/page.tsx
// Specifically handles toggling months, books, and editing student assignment.

export interface StudentTableRowProps {
  student: Student;
  groups: Group[];
  teacherBooks: BookDef[];
  arabicMonths: string[];
  formatTimeTo12H: (time: string) => string;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleMonth: (student: Student, monthIndex: number) => void;
  onToggleBook: (student: Student, bookId: string) => void;
  onDelete: (id: string) => void;
  onUpdateGroup: (id: string, groupId: string) => void;
}

export function StudentTableRow({
  student,
  groups,
  teacherBooks,
  arabicMonths,
  formatTimeTo12H,
  isSelected,
  onToggleSelect,
  onToggleMonth,
  onToggleBook,
  onDelete,
  onUpdateGroup
}: StudentTableRowProps) {

  return (
    <tr className={isSelected ? "row-selected" : ""}>
      <td data-label="تحديد">
        <button 
          onClick={() => onToggleSelect(student.id)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex" }}
        >
          {isSelected ? <CheckSquare size={18} className="color-teal" /> : <Square size={18} />}
        </button>
      </td>
      <td data-label="الكود" style={{ textAlign: "center" }}>{student.code || "-"}</td>
      <td data-label="الاسم" style={{ fontWeight: 600 }}>{student.name}</td>
      <td data-label="المجموعة" style={{ textAlign: "center" }}>
        <div style={{ display: "inline-block", position: "relative" }}>
          <select
            className="form-input"
            value={student.group_id || ""}
            onChange={(e) => onUpdateGroup(student.id, e.target.value)}
            style={{ 
              paddingRight: "10px", 
              paddingLeft: "30px", 
              paddingTop: "0",
              paddingBottom: "0",
              height: "32px",
              fontSize: "0.85rem",
              minWidth: "160px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#ffffff",
              cursor: "pointer"
            }}
          >
            <option value="" style={{ background: "#0f172a" }}>بدون مجموعة</option>
            {groups.map(g => (
              <option key={g.id} value={g.id} style={{ background: "#0f172a" }}>
                {g.name} ({g.day_of_week} - {formatTimeTo12H(g.time)})
              </option>
            ))}
          </select>
        </div>
      </td>
      <td data-label="الشهور المدفوعة (١ - ١٢)" style={{ textAlign: "center" }}>
        <div className="months-grid" style={{ justifyContent: "center" }}>
          {student.months?.map((isPaid, idx) => (
            <button
              key={idx}
              className={`month-toggle ${isPaid ? "paid" : ""}`}
              onClick={() => onToggleMonth(student, idx)}
              title={`${arabicMonths[idx]} (شهر ${idx + 1}) - اضغط للتبديل`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </td>
      <td data-label="الكتب المستلمة" style={{ textAlign: "center" }}>
        <div className="book-toggles" style={{ justifyContent: "center" }}>
          {teacherBooks.map(book => {
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
      <td data-label="إجراءات" style={{ textAlign: "center" }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onDelete(student.id)}
          title="حذف الطالب"
          style={{ border: "none", background: "none", margin: "0 auto" }}
        >
          <Trash2 size={16} className="color-danger" />
        </Button>
      </td>
    </tr>
  );
}
