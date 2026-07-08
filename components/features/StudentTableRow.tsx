import React from 'react';
import { Trash2, CheckSquare, Square } from 'lucide-react';
import { Student, Group } from '@/lib/types';
import { Button } from '@/components/ui/Button';

// Replaces the `<tr>` inside the students table in app/dashboard/students/page.tsx
// Specifically handles toggling months, books, and editing student assignment.

export interface StudentTableRowProps {
  student: Student;
  groups: Group[];
  arabicMonths: string[];
  formatTimeTo12H: (time: string) => string;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleMonth: (student: Student, monthIndex: number) => void;
  onToggleBook: (student: Student, bookField: "book_1" | "book_2") => void;
  onDelete: (id: string) => void;
  onUpdateGroup: (id: string, groupId: string) => void;
}

export function StudentTableRow({
  student,
  groups,
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
          <button
            className={`book-toggle ${student.book_1 ? "active" : ""}`}
            onClick={() => onToggleBook(student, "book_1")}
          >
            {student.book_1 ? "✓ كتاب ١" : "كتاب ١"}
          </button>
          <button
            className={`book-toggle ${student.book_2 ? "active" : ""}`}
            onClick={() => onToggleBook(student, "book_2")}
          >
            {student.book_2 ? "✓ كتاب ٢" : "كتاب ٢"}
          </button>
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
