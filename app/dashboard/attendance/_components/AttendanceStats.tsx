"use client";

import { Student, AttendanceRecord } from "@/lib/types";
import { TrendingUp, TrendingDown, Users, Calendar, AlertTriangle } from "lucide-react";

interface Props {
  students: Student[];
  allDates: string[];
  attendance: AttendanceRecord[];
  month: number;
  year: number;
}

const arabicMonths = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

export function AttendanceStats({ students, allDates, attendance, month, year }: Props) {
  if (students.length === 0 || allDates.length === 0) return null;

  const isPresent = (sid: string, d: string) =>
    attendance.some(a => a.student_id === sid && a.session_date === d && a.status === "present");

  const percents = students.map(s => {
    const p = allDates.filter(d => isPresent(s.id, d)).length;
    return allDates.length > 0 ? Math.round((p / allDates.length) * 100) : 0;
  });

  const avg = Math.round(percents.reduce((a, b) => a + b, 0) / percents.length);
  const below75 = percents.filter(p => p < 75).length;
  const perfect = percents.filter(p => p === 100).length;

  const stats = [
    {
      label: "إجمالي الطلاب",
      value: students.length,
      icon: <Users size={18} />,
      color: "var(--color-info)",
      bg: "rgba(59,130,246,0.1)",
      border: "rgba(59,130,246,0.2)",
    },
    {
      label: "عدد الحصص",
      value: allDates.length,
      icon: <Calendar size={18} />,
      color: "var(--color-teal)",
      bg: "rgba(20,184,166,0.1)",
      border: "rgba(20,184,166,0.2)",
    },
    {
      label: "متوسط الحضور",
      value: `${avg}%`,
      icon: avg >= 75 ? <TrendingUp size={18} /> : <TrendingDown size={18} />,
      color: avg >= 75 ? "var(--color-success)" : "var(--color-amber)",
      bg: avg >= 75 ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
      border: avg >= 75 ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)",
    },
    {
      label: "تحت 75%",
      value: below75,
      icon: <AlertTriangle size={18} />,
      color: below75 > 0 ? "var(--color-danger)" : "var(--color-success)",
      bg: below75 > 0 ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
      border: below75 > 0 ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)",
    },
  ];

  return (
    <div className="attendance-stats-grid">
      {stats.map((s, i) => (
        <div key={i} className="attendance-stat-card" style={{ borderColor: s.border }}>
          <div className="attendance-stat-icon" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
            {s.icon}
          </div>
          <div>
            <div className="attendance-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="attendance-stat-label">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
