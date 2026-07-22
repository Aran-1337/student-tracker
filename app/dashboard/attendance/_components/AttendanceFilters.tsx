"use client";

import { Grade, Group } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Calendar, Plus } from "lucide-react";

const arabicMonths = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

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
  selectedMonth: number;
  selectedYear: number;
  newSessionDate: string;
  onGradeChange: (v: string) => void;
  onGroupChange: (v: string) => void;
  onMonthChange: (v: number) => void;
  onYearChange: (v: number) => void;
  onSessionDateChange: (v: string) => void;
  onAddSession: () => void;
}

export function AttendanceFilters({
  grades, groups,
  selectedGradeId, selectedGroupId,
  selectedMonth, selectedYear,
  newSessionDate,
  onGradeChange, onGroupChange,
  onMonthChange, onYearChange,
  onSessionDateChange, onAddSession,
}: Props) {
  const years = Array.from(
    { length: Math.max(2, new Date().getFullYear() - 2024 + 2) },
    (_, i) => 2024 + i
  );

  return (
    <div className="glass-panel panel-content attendance-filters">
      <div className="filters-row">
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
            <option value="all">كل المجموعات</option>
            {groups
              .filter(g => selectedGradeId === "all" || g.grade_id === selectedGradeId)
              .map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.day_of_week} - {formatTimeTo12H(g.time)})
                </option>
              ))}
          </select>
        </div>

        <div className="form-group" style={{ margin: 0, minWidth: "130px" }}>
          <label className="form-label">الشهر</label>
          <select className="form-input" value={selectedMonth} onChange={e => onMonthChange(Number(e.target.value))}>
            {arabicMonths.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>

        <div className="form-group" style={{ margin: 0, minWidth: "100px" }}>
          <label className="form-label">السنة</label>
          <select className="form-input" value={selectedYear} onChange={e => onYearChange(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {selectedGroupId !== "all" && (
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">
              <Calendar size={13} style={{ display: "inline", marginLeft: 4 }} />
              إضافة حصة
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="date"
                className="form-input"
                value={newSessionDate}
                onChange={e => onSessionDateChange(e.target.value)}
                style={{ minWidth: "140px" }}
              />
              <Button variant="primary" onClick={onAddSession} style={{ padding: "0.6rem 1rem", whiteSpace: "nowrap" }}>
                <Plus size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
