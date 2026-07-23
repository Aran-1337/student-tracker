"use client";

import { useState, useEffect } from "react";
import { UserPlus, Plus, ChevronDown } from "lucide-react";
import { Student, Group, Grade } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const formatTimeTo12H = (timeStr: string) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const ampm = hours >= 12 ? "م" : "ص";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
};

interface Props {
  groups: Group[];
  grades: Grade[];
  hasCenterMode: boolean;
  subTeachers: any[];
  isLoading: boolean;
  onSubmit: (data: {
    name: string;
    gradeId: string;
    groupId: string;
    parentPhone: string;
    subTeacherId: string;
  }) => Promise<void>;
}

export function AddStudentForm({ groups, grades, hasCenterMode, subTeachers, isLoading, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [subTeacherId, setSubTeacherId] = useState("");
  const [collapsed, setCollapsed] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, gradeId, groupId, parentPhone, subTeacherId });
    setName("");
    setGradeId("");
    setGroupId("");
    setParentPhone("");
    setSubTeacherId("");
  };

  const filteredGroups = groups
    .filter((g) => !gradeId || g.grade_id === gradeId)
    .filter((g) => !hasCenterMode || !subTeacherId || g.sub_teacher_id === subTeacherId);

  return (
    <div className="glass-panel panel-content">
      <h2
        className="panel-title"
        onClick={() => setCollapsed((c) => !c)}
        style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <UserPlus size={18} className="stat-icon-teal" style={{ background: "none", border: "none" }} />
          <span>إضافة طالب جديد</span>
        </span>
        <ChevronDown
          size={18}
          style={{ transition: "transform 0.25s", transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", color: "var(--text-muted)" }}
        />
      </h2>
      {!collapsed && <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Input
          label="اسم الطالب"
          required
          placeholder="الاسم الكامل للطالب"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="رقم هاتف ولي الأمر (اختياري)"
          type="tel"
          placeholder="01012345678"
          value={parentPhone}
          onChange={(e) => setParentPhone(e.target.value)}
          style={{ direction: "ltr", textAlign: "right" }}
        />
        <div className="form-group">
          <label className="form-label">السنة الدراسية</label>
          <select
            required
            className="form-input"
            value={gradeId}
            onChange={(e) => { setGradeId(e.target.value); setGroupId(""); }}
          >
            <option value="">-- اختر السنة الدراسية --</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        {hasCenterMode && (
          <div className="form-group">
            <label className="form-label">المعلم</label>
            <select
              className="form-input"
              value={subTeacherId}
              onChange={(e) => { setSubTeacherId(e.target.value); setGroupId(""); }}
            >
              <option value="">-- اختر المعلم --</option>
              {subTeachers
                .filter((st) => !gradeId || groups.some((g) => g.grade_id === gradeId && g.sub_teacher_id === st.id))
                .map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">المجموعة (اختياري)</label>
          <select
            className="form-input"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            <option value="">بدون مجموعة</option>
            {filteredGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} {g.is_private ? "(خاصة) " : ""}({g.day_of_week} - {formatTimeTo12H(g.time)})
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" variant="primary" isLoading={isLoading} leftIcon={<Plus size={18} />} style={{ width: "100%", marginTop: "0.5rem" }}>
          إضافة الطالب
        </Button>
      </form>}
    </div>
  );
}
