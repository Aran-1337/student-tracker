"use client";

import { Search, Printer } from "lucide-react";
import { Group, Grade } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Props {
  grades: Grade[];
  groups: Group[];
  hasCenterMode: boolean;
  subTeachers: any[];
  searchQuery: string;
  filterGradeId: string;
  filterSubTeacherId: string;
  activeFilter: string;
  onSearchChange: (v: string) => void;
  onGradeChange: (v: string) => void;
  onSubTeacherChange: (v: string) => void;
  onGroupChange: (v: string) => void;
  onPrint: () => void;
}

export function StudentsFilters({
  grades, groups, hasCenterMode, subTeachers,
  searchQuery, filterGradeId, filterSubTeacherId, activeFilter,
  onSearchChange, onGradeChange, onSubTeacherChange, onGroupChange, onPrint,
}: Props) {
  const filteredGroupsForSelect = groups
    .filter((g) => g.grade_id === filterGradeId)
    .filter((g) => !hasCenterMode || filterSubTeacherId === "all" || g.sub_teacher_id === filterSubTeacherId);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem", alignItems: "flex-end" }}>
      <div style={{ flex: "1 1 220px" }}>
        <Input
          leftIcon={<Search size={16} />}
          placeholder="ابحث بالاسم أو الكود..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div style={{ flex: "1 1 150px" }}>
        <select
          className="form-input"
          value={filterGradeId}
          onChange={(e) => { onGradeChange(e.target.value); onGroupChange("all"); }}
        >
          <option value="all">كل السنين</option>
          {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {hasCenterMode && (
        <div style={{ flex: "1 1 150px" }}>
          <select
            className="form-input"
            value={filterSubTeacherId}
            onChange={(e) => { onSubTeacherChange(e.target.value); onGroupChange("all"); }}
          >
            <option value="all">كل المعلمين</option>
            {subTeachers
              .filter((st) => filterGradeId === "all" || groups.some((g) => g.grade_id === filterGradeId && g.sub_teacher_id === st.id))
              .map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
          </select>
        </div>
      )}

      <div style={{ flex: "1 1 170px" }}>
        <select
          className="form-input"
          value={activeFilter}
          onChange={(e) => onGroupChange(e.target.value)}
          disabled={filterGradeId === "all"}
          style={{ opacity: filterGradeId === "all" ? 0.5 : 1, cursor: filterGradeId === "all" ? "not-allowed" : "pointer" }}
          title={filterGradeId === "all" ? "اختر سنة دراسية أولاً" : ""}
        >
          <option value="all">جميع المجموعات</option>
          {filterGradeId !== "all" && (
            <>
              <option value="none">بدون مجموعة</option>
              {filteredGroupsForSelect.map((g) => (
                <option key={g.id} value={g.id}>{g.name} {g.is_private ? "(خاصة)" : ""}</option>
              ))}
            </>
          )}
        </select>
      </div>

      <Button variant="secondary" onClick={onPrint} leftIcon={<Printer size={16} />} style={{ whiteSpace: "nowrap" }}>
        طباعة
      </Button>
    </div>
  );
}
