"use client";

import { Users, CheckCircle2, BookOpen, TrendingUp } from "lucide-react";

interface StatsGridProps {
  totalStudents: number;
  paidThisMonth: number;
  totalGroups: number;
  totalBooksDelivered: number;
  currentMonthName: string;
  unpaidCount: number;
}

export function StatsGrid({
  totalStudents,
  paidThisMonth,
  totalGroups,
  totalBooksDelivered,
  currentMonthName,
  unpaidCount,
}: StatsGridProps) {
  const paidPercent = totalStudents > 0 ? Math.round((paidThisMonth / totalStudents) * 100) : 0;

  return (
    <section className="stats-grid">
      <div className="stat-card glass-panel">
        <div className="stat-icon-wrapper stat-icon-blue">
          <Users size={24} />
        </div>
        <div className="stat-info">
          <span className="stat-label">إجمالي الطلاب</span>
          <span className="stat-value monospace">{totalStudents}</span>
        </div>
      </div>

      <div className="stat-card glass-panel">
        <div className="stat-icon-wrapper stat-icon-teal">
          <CheckCircle2 size={24} />
        </div>
        <div className="stat-info">
          <span className="stat-label">مدفوعات ({currentMonthName})</span>
          <span className="stat-value monospace">{paidThisMonth}</span>
          <div className="stat-progress-bar">
            <div className="stat-progress-fill" style={{ width: `${paidPercent}%` }} />
          </div>
          <span className="stat-sub-label">{paidPercent}% من الطلاب</span>
        </div>
      </div>

      <div className="stat-card glass-panel">
        <div className="stat-icon-wrapper stat-icon-blue" style={{ filter: "hue-rotate(45deg)" }}>
          <Users size={24} />
        </div>
        <div className="stat-info">
          <span className="stat-label">إجمالي المجموعات</span>
          <span className="stat-value monospace">{totalGroups}</span>
        </div>
      </div>

      <div className="stat-card glass-panel">
        <div className="stat-icon-wrapper stat-icon-amber">
          <BookOpen size={24} />
        </div>
        <div className="stat-info">
          <span className="stat-label">نسخ الكتب المسلمة</span>
          <span className="stat-value monospace">{totalBooksDelivered}</span>
        </div>
      </div>

      {unpaidCount > 0 && (
        <div className="stat-card glass-panel stat-card-danger">
          <div className="stat-icon-wrapper stat-icon-danger">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">لم يدفعوا ({currentMonthName})</span>
            <span className="stat-value monospace" style={{ color: "var(--color-danger)" }}>
              {unpaidCount}
            </span>
            <span className="stat-sub-label" style={{ color: "var(--color-danger)", opacity: 0.8 }}>
              {totalStudents > 0 ? Math.round((unpaidCount / totalStudents) * 100) : 0}% من الطلاب
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
