"use client";

import { useState } from "react";
import { CheckCircle, XCircle, CalendarDays } from "lucide-react";
import { AttendanceRecord } from "@/lib/types";

const arabicMonths = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const currentMonthIdx = new Date().getMonth();

interface Props {
  attendance: AttendanceRecord[];
}

export function StudentAttendanceCard({ attendance }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonthIdx);

  // Filter records by the selected month
  // Note: the DB month is 1-indexed, so monthIdx + 1
  const monthRecords = attendance
    .filter(r => r.month === selectedMonth + 1)
    .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());

  const presentCount = monthRecords.filter(r => r.status === "present").length;
  const absentCount = monthRecords.filter(r => r.status === "absent").length;

  return (
    <div className="glass-panel panel-content">
      <h3 className="panel-title" style={{ marginBottom: "1rem" }}>
        <CalendarDays size={16} style={{ color: "var(--color-blue)" }} />
        <span>سجل الحضور والغياب</span>
      </h3>

      {/* Month grid selector */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "0.4rem", marginBottom: "1rem" }}>
        {arabicMonths.map((m, idx) => {
          const hasRecords = attendance.some(r => r.month === idx + 1);
          const isSelected = selectedMonth === idx;
          return (
            <button
              key={idx}
              onClick={() => setSelectedMonth(idx)}
              style={{
                padding: "0.4rem 0",
                borderRadius: "8px",
                border: isSelected ? "2px solid var(--color-blue)" : "1px solid rgba(255,255,255,0.08)",
                background: isSelected ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.03)",
                color: isSelected ? "#3b82f6" : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "0.72rem",
                fontWeight: isSelected ? 700 : 400,
                transition: "all 0.2s",
                position: "relative",
              }}
            >
              {m.slice(0, 3)}
              {hasRecords && (
                <div style={{
                  position: "absolute", top: "2px", right: "2px",
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: "#3b82f6"
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Monthly details */}
      <div style={{ background: "rgba(0,0,0,0.1)", borderRadius: "8px", padding: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", fontSize: "0.85rem" }}>
          <span style={{ color: "var(--text-secondary)" }}>
            شهر {arabicMonths[selectedMonth]}
          </span>
          <div style={{ display: "flex", gap: "1rem" }}>
            <span style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}>
              <CheckCircle size={12} /> {presentCount} حضور
            </span>
            <span style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: "4px" }}>
              <XCircle size={12} /> {absentCount} غياب
            </span>
          </div>
        </div>

        {monthRecords.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem", padding: "1rem 0" }}>
            لا يوجد سجل حضور وغياب لهذا الشهر
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "0.5rem" }}>
            {monthRecords.map(r => (
              <div key={r.id} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem",
                padding: "0.5rem", borderRadius: "6px",
                background: r.status === "present" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${r.status === "present" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`
              }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-primary)" }}>
                  {r.session_date.split("-").reverse().join("/")}
                </span>
                {r.status === "present" ? (
                  <span style={{ color: "#10b981", fontSize: "0.7rem", fontWeight: 600 }}>حضر</span>
                ) : (
                  <span style={{ color: "#ef4444", fontSize: "0.7rem", fontWeight: 600 }}>غاب</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
