import { User, Tag, BookOpen } from "lucide-react";
import { Student, Group, Grade } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { InfoRow } from "./InfoRow";

const formatTimeTo12H = (t: string) => {
  if (!t) return "";
  const [h, m] = t.split(":");
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? "م" : "ص";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${m || "00"} ${ampm}`;
};

interface Props {
  student: Student;
  formData: Partial<Student>;
  isEditing: boolean;
  groups: Group[];
  grades: Grade[];
  onChange: (updates: Partial<Student>) => void;
}

export function StudentInfoCard({ student, formData, isEditing, groups, grades, onChange }: Props) {
  const group = groups.find((g) => g.id === student.group_id);
  const grade = grades.find((g) => g.id === student.grade_id);

  return (
    <div className="glass-panel panel-content">
      <h3 className="panel-title">
        <User size={16} style={{ color: "var(--color-teal)" }} />
        <span>البيانات الأساسية</span>
      </h3>
      {isEditing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Input label="الاسم" value={formData.name || ""} onChange={(e) => onChange({ name: e.target.value })} />
          <div className="form-group">
            <label className="form-label">السنة الدراسية</label>
            <select className="form-input" value={formData.grade_id || ""} onChange={(e) => onChange({ grade_id: e.target.value, group_id: null })}>
              <option value="">-- اختر --</option>
              {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">المجموعة</label>
            <select className="form-input" value={formData.group_id || ""} onChange={(e) => onChange({ group_id: e.target.value || null })}>
              <option value="">بدون مجموعة</option>
              {groups.filter((g) => !formData.grade_id || g.grade_id === formData.grade_id).map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.day_of_week} - {formatTimeTo12H(g.time)})</option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <InfoRow icon={<User size={15} />} label="الاسم" value={student.name} />
          <InfoRow icon={<Tag size={15} />} label="الكود" value={<span style={{ fontFamily: "monospace", color: "var(--color-teal)" }}>{student.code || "—"}</span>} />
          <InfoRow icon={<BookOpen size={15} />} label="السنة الدراسية" value={grade?.name || "—"} />
          <InfoRow icon={<BookOpen size={15} />} label="المجموعة" value={group ? `${group.name} (${group.day_of_week} - ${formatTimeTo12H(group.time)})` : "بدون مجموعة"} />
        </div>
      )}
    </div>
  );
}
