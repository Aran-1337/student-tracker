import { Wallet, Tag, BookOpen } from "lucide-react";
import { Student } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { InfoRow } from "./InfoRow";

interface Props {
  student: Student;
  formData: Partial<Student>;
  isEditing: boolean;
  onChange: (updates: Partial<Student>) => void;
}

export function StudentFinancialCard({ student, formData, isEditing, onChange }: Props) {
  return (
    <div className="glass-panel panel-content">
      <h3 className="panel-title">
        <Wallet size={16} style={{ color: "var(--color-teal)" }} />
        <span>الخصومات</span>
      </h3>
      {isEditing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Input
            label="قيمة الخصم (جنيه)" type="number" min={0}
            value={formData.discount_value ?? ""}
            onChange={(e) => onChange({ discount_value: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
          />
          <Input
            label="سبب الخصم" value={formData.discount_reason || ""}
            onChange={(e) => onChange({ discount_reason: e.target.value })}
            placeholder="أيتام، إخوة..."
          />
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem" }}>
            <input
              type="checkbox"
              checked={formData.apply_discount_to_books || false}
              onChange={(e) => onChange({ apply_discount_to_books: e.target.checked })}
              style={{ width: "16px", height: "16px" }}
            />
            تطبيق الخصم على الكتب أيضاً
          </label>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {student.discount_value ? (
            <div style={{ padding: "0.75rem 1rem", borderRadius: "10px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f59e0b" }}>{student.discount_value} جنيه</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>خصم مطبق</div>
            </div>
          ) : (
            <div style={{ padding: "0.75rem 1rem", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              لا يوجد خصم
            </div>
          )}
          {student.discount_reason && <InfoRow icon={<Tag size={15} />} label="سبب الخصم" value={student.discount_reason} />}
          <InfoRow icon={<BookOpen size={15} />} label="خصم على الكتب" value={student.apply_discount_to_books ? "نعم" : "لا"} />
        </div>
      )}
    </div>
  );
}
