import { Phone, Mail, Briefcase } from "lucide-react";
import { Student } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { InfoRow } from "./InfoRow";

interface Props {
  student: Student;
  formData: Partial<Student>;
  isEditing: boolean;
  onChange: (updates: Partial<Student>) => void;
}

export function StudentContactCard({ student, formData, isEditing, onChange }: Props) {
  return (
    <div className="glass-panel panel-content">
      <h3 className="panel-title">
        <Phone size={16} style={{ color: "var(--color-teal)" }} />
        <span>بيانات التواصل</span>
      </h3>
      {isEditing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Input label="هاتف ولي الأمر" value={formData.parent_phone || ""} onChange={(e) => onChange({ parent_phone: e.target.value })} placeholder="01012345678" />
          <Input label="وظيفة ولي الأمر" value={formData.parent_job || ""} onChange={(e) => onChange({ parent_job: e.target.value })} placeholder="مهندس، دكتور..." />
          <Input label="إيميل الطالب" type="email" value={formData.student_email || ""} onChange={(e) => onChange({ student_email: e.target.value })} placeholder="student@example.com" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <InfoRow icon={<Phone size={15} />} label="هاتف ولي الأمر" value={
            student.parent_phone
              ? <a href={`https://wa.me/2${student.parent_phone.replace(/^0/, "")}`} target="_blank" rel="noopener noreferrer" style={{ color: "#25D366", textDecoration: "none" }}>{student.parent_phone} 💬</a>
              : "—"
          } />
          <InfoRow icon={<Briefcase size={15} />} label="وظيفة ولي الأمر" value={student.parent_job || "—"} />
          <InfoRow icon={<Mail size={15} />} label="إيميل الطالب" value={student.student_email || "—"} />
        </div>
      )}
    </div>
  );
}
