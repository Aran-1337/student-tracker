"use client";

import { Grade, Group } from "@/lib/types";

function formatTimeTo12H(t: string) {
  if (!t) return "";
  let [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "م" : "ص";
  h = h % 12 || 12;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")} ${ap}`;
}

interface Props {
  grades: Grade[];
  groups: Group[];
  selectedGradeId: string;
  selectedGroupId: string;
  onGradeChange: (v: string) => void;
  onGroupChange: (v: string) => void;
}

export function AttendanceFilters({
  grades, groups,
  selectedGradeId, selectedGroupId,
  onGradeChange, onGroupChange,
}: Props) {
  return (
    <div className="glass-panel panel-content attendance-filters">
      <div className="filters-row" style={{ alignItems: "flex-end" }}>
        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: "160px" }}>
          <label className="form-label">السنة الدراسية</label>
          <select
            className="form-input"
            value={selectedGradeId}
            onChange={e => onGradeChange(e.target.value)}
          >
            <option value="all">كل السنين</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: "180px" }}>
          <label className="form-label">المجموعة</label>
          <select
            className="form-input"
            value={selectedGroupId}
            onChange={e => onGroupChange(e.target.value)}
            disabled={selectedGradeId === "all"}
            style={{ opacity: selectedGradeId === "all" ? 0.5 : 1 }}
          >
            <option value="all" disabled>اختر مجموعة...</option>
            {groups
              .filter(g => selectedGradeId === "all" || g.grade_id === selectedGradeId)
              .map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.day_of_week} - {formatTimeTo12H(g.time)})
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
}
