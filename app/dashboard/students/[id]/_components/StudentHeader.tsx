"use client";

import Link from "next/link";
import { ArrowRight, Edit3, Save, FileDown, GraduationCap, Users } from "lucide-react";
import { Student, Group, Grade } from "@/lib/types";
import { Button } from "@/components/ui/Button";

interface Props {
  student: Student;
  group: Group | undefined;
  grade: Grade | undefined;
  isEditing: boolean;
  saving: boolean;
  paidMonths: number;
  paidThisMonth: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onExportPDF: () => void;
}

export function StudentHeader({
  student, group, grade, isEditing, saving,
  paidMonths, paidThisMonth,
  onEdit, onCancel, onSave, onExportPDF,
}: Props) {
  const payPercent = Math.round((paidMonths / 12) * 100);

  return (
    <div style={{ marginBottom: "2rem" }}>
      {/* Back + actions row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <Link href="/dashboard/students" style={{ textDecoration: "none" }}>
          <Button variant="secondary" size="sm" leftIcon={<ArrowRight size={16} />}>رجوع</Button>
        </Link>
        <div style={{ marginRight: "auto", display: "flex", gap: "0.5rem" }}>
          <Button variant="secondary" size="sm" onClick={onExportPDF} leftIcon={<FileDown size={15} />}>
            تصدير PDF
          </Button>
          {isEditing ? (
            <>
              <Button variant="secondary" size="sm" onClick={onCancel}>إلغاء</Button>
              <Button variant="primary" size="sm" isLoading={saving} leftIcon={<Save size={15} />} onClick={onSave}>حفظ</Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" leftIcon={<Edit3 size={15} />} onClick={onEdit}>تعديل</Button>
          )}
        </div>
      </div>

      {/* Hero card */}
      <div className="glass-panel panel-content" style={{
        background: "linear-gradient(135deg, rgba(20,184,166,0.08), rgba(59,130,246,0.05))",
        borderColor: "rgba(20,184,166,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(20,184,166,0.3), rgba(59,130,246,0.3))",
            border: "2px solid rgba(20,184,166,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.75rem", fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {student.name.charAt(0)}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: "1.6rem", marginBottom: "0.35rem" }}>{student.name}</h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ fontFamily: "monospace", fontSize: "0.85rem", padding: "2px 10px", borderRadius: "6px", background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.25)", color: "var(--color-teal)" }}>
                {student.code || "—"}
              </span>
              {grade && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.82rem", padding: "2px 10px", borderRadius: "6px", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#a5b4fc" }}>
                  <GraduationCap size={13} /> {grade.name}
                </span>
              )}
              {group && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.82rem", padding: "2px 10px", borderRadius: "6px", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", color: "#93c5fd" }}>
                  <Users size={13} /> {group.name}
                </span>
              )}
            </div>
          </div>

          {/* Payment summary */}
          <div style={{ textAlign: "center", minWidth: "120px" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: paidThisMonth ? "#10b981" : "#ef4444", lineHeight: 1 }}>
              {paidMonths}<span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>/12</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>شهر مدفوع</div>
            <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${payPercent}%`, background: paidMonths >= 10 ? "#10b981" : paidMonths >= 6 ? "#f59e0b" : "#ef4444", borderRadius: "3px", transition: "width 0.6s ease" }} />
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{payPercent}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
