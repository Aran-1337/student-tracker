"use client";

import { AlertCircle, Calendar } from "lucide-react";
import { Group, Student, Grade } from "@/lib/types";
import { GroupCard } from "@/components/features/GroupCard";

interface GroupsListProps {
  groups: Group[];
  students: Student[];
  grades: Grade[];
  subTeachers: any[];
  hasCenterMode: boolean;
  onDelete: (id: string) => void;
}

export function GroupsList({
  groups,
  students,
  grades,
  subTeachers,
  hasCenterMode,
  onDelete,
}: GroupsListProps) {
  const ungrouped = groups.filter((g) => !g.grade_id);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* All groups */}
      <div className="glass-panel panel-content" style={{ padding: "1.5rem" }}>
        <h2 className="panel-title" style={{ margin: 0, marginBottom: "1.5rem" }}>
          <Calendar size={18} style={{ color: "var(--color-info)" }} />
          <span>إجمالي المجموعات الحالية ({groups.length})</span>
        </h2>

        {groups.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} className="empty-state-icon" />
            <p>لا توجد أي مجموعات حالياً. أضف أول مجموعة لبدء تنظيم طلابك.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                students={students}
                gradeName={grades.find((g) => g.id === group.grade_id)?.name}
                subTeacher={subTeachers.find((t) => t.id === group.sub_teacher_id)}
                hasCenterMode={hasCenterMode}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Grouped by grade */}
      {grades.map((grade) => {
        const gradeGroups = groups.filter((g) => g.grade_id === grade.id);
        if (gradeGroups.length === 0) return null;
        return (
          <div key={grade.id} className="glass-panel panel-content" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.3rem", color: "var(--color-teal)", marginBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
              {grade.name}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
              {gradeGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  students={students}
                  subTeacher={subTeachers.find((t) => t.id === group.sub_teacher_id)}
                  hasCenterMode={hasCenterMode}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Ungrouped */}
      {ungrouped.length > 0 && (
        <div className="glass-panel panel-content" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.3rem", color: "var(--text-muted)", marginBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
            مجموعات أخرى (بدون سنة دراسية)
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
            {ungrouped.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                students={students}
                subTeacher={subTeachers.find((t) => t.id === group.sub_teacher_id)}
                hasCenterMode={hasCenterMode}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
