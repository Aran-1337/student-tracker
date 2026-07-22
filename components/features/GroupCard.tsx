import React from 'react';
import { Users, Calendar, Clock, Trash2, Wallet, BookOpen, Pencil } from 'lucide-react';
import { Group, Student, SubTeacher } from '@/lib/types';

// Replaces the individual group card rendering in app/dashboard/page.tsx
// Specifically the `div` inside `gradeGroups.map(group => ...)`

export interface GroupCardProps {
  group: Group;
  students: Student[];
  gradeName?: string;
  subTeacher?: SubTeacher;
  hasCenterMode: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (group: Group) => void;
}

const formatTimeTo12H = (timeStr: string) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const ampm = hours >= 12 ? "م" : "ص";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, "0");
  return `${strHours}:${minutes} ${ampm}`;
};

export function GroupCard({
  group,
  students,
  gradeName,
  subTeacher,
  hasCenterMode,
  onDelete,
  onEdit,
}: GroupCardProps) {
  const groupStudentCount = students.filter(s => s.group_id === group.id).length;

  return (
    <div className={`glass-panel panel-content ${group.is_private ? "group-card-private" : ""}`} style={{ background: "rgba(255,255,255,0.02)", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{group.name}</h3>
          {group.is_private && <span className="private-badge">خاصة</span>}
        </div>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {onEdit && (
            <button
              className="btn btn-secondary btn-icon"
              onClick={() => onEdit(group)}
              style={{ border: "none", background: "none", width: "1.75rem", height: "1.75rem", padding: 0 }}
              title="تعديل المجموعة"
            >
              <Pencil size={15} style={{ color: "var(--color-teal)" }} />
            </button>
          )}
          {onDelete && (
            <button
              className="btn btn-secondary btn-icon"
              onClick={() => onDelete(group.id)}
              style={{ border: "none", background: "none", width: "1.75rem", height: "1.75rem", padding: 0 }}
              title="حذف المجموعة"
            >
              <Trash2 size={15} className="color-danger" />
            </button>
          )}
        </div>
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
        {hasCenterMode && subTeacher && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", color: "var(--color-teal)" }}>
            <Users size={14} style={{ flexShrink: 0, marginTop: "0.15rem" }} />
            <span>المعلم: {subTeacher.name}</span>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
          <Calendar size={14} style={{ flexShrink: 0, marginTop: "0.15rem" }} />
          <span>اليوم: {group.day_of_week}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Clock size={14} style={{ flexShrink: 0 }} />
          <span>الوقت: {formatTimeTo12H(group.time)}</span>
        </div>
        {gradeName && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
            <BookOpen size={14} style={{ flexShrink: 0, marginTop: "0.15rem" }} />
            <span>السنة: {gradeName}</span>
          </div>
        )}
        {group.is_private && group.monthly_price !== null && group.monthly_price !== undefined && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#a78bfa" }}>
            <Wallet size={14} style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>الاشتراك: {group.monthly_price}ج / شهرياً</span>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "0.5rem" }}>
          <Users size={14} style={{ flexShrink: 0, color: "var(--color-teal)" }} />
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>عدد الطلاب: {groupStudentCount} طالب</span>
        </div>
      </div>
    </div>
  );
}
