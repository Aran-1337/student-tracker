"use client";

import Link from "next/link";
import { Calendar, QrCode, Users } from "lucide-react";
import { Group, Student } from "@/lib/types";

const arabicDays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const formatTimeTo12H = (timeStr: string) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const ampm = hours >= 12 ? "م" : "ص";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
};

interface TodaySessionsProps {
  groups: Group[];
  students: Student[];
  hasAttendance: boolean;
}

export function TodaySessions({ groups, students, hasAttendance }: TodaySessionsProps) {
  const todayArabic = arabicDays[new Date().getDay()];

  const todayGroups = groups.filter((g) =>
    (g.day_of_week || "").split(" ، ").includes(todayArabic)
  );

  return (
    <div className="glass-panel panel-content">
      <h2 className="panel-title">
        <Calendar size={18} style={{ color: "var(--color-teal)" }} />
        <span>جلسات اليوم — {todayArabic} ({todayGroups.length})</span>
      </h2>

      {todayGroups.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "1.5rem 0" }}>
          لا توجد مجموعات مجدولة اليوم
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {todayGroups.map((group) => {
            const count = students.filter((s) => s.group_id === group.id).length;
            return (
              <div key={group.id} className="today-session-row">
                <div className="today-session-info">
                  <span className="today-session-name">{group.name}</span>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <span className="today-session-time">{formatTimeTo12H(group.time)}</span>
                    <span className="today-session-count">
                      <Users size={12} />
                      {count} طالب
                    </span>
                  </div>
                </div>
                {hasAttendance && (
                  <Link
                    href={`/dashboard/attendance/scan?group=${group.id}`}
                    className="btn btn-primary today-session-btn"
                  >
                    <QrCode size={14} />
                    <span>ابدأ الحضور</span>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
