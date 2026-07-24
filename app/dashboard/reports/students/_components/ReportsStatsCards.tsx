"use client";

import { HiOutlineUsers } from "react-icons/hi2";
import { RiCheckboxCircleLine, RiCloseCircleLine } from "react-icons/ri";
import { RiWhatsappLine } from "react-icons/ri";

interface Props {
  total: number;
  paid: number;
  unpaid: number;
  withPhone: number;
}

export default function ReportsStatsCards({ total, paid, unpaid, withPhone }: Props) {
  const paidPct = total > 0 ? Math.round((paid / total) * 100) : 0;

  const cards = [
    {
      icon: <HiOutlineUsers size={22} />,
      value: total,
      label: "إجمالي الطلاب",
      color: "var(--color-teal)",
      bg: "rgba(20,184,166,0.1)",
      extra: null,
    },
    {
      icon: <RiCheckboxCircleLine size={22} />,
      value: paid,
      label: "دفعوا هذا الشهر",
      color: "#10b981",
      bg: "rgba(16,185,129,0.1)",
      extra: `${paidPct}%`,
    },
    {
      icon: <RiCloseCircleLine size={22} />,
      value: unpaid,
      label: "لم يدفعوا بعد",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.1)",
      extra: total > 0 ? `${100 - paidPct}%` : null,
    },
    {
      icon: <RiWhatsappLine size={22} />,
      value: withPhone,
      label: "لديهم رقم واتساب",
      color: "#25D366",
      bg: "rgba(37,211,102,0.1)",
      extra: null,
    },
  ];

  return (
    <div className="sr-stats-grid">
      {cards.map((c, i) => (
        <div key={i} className="glass-panel sr-stat-card">
          <div className="sr-stat-icon" style={{ background: c.bg, color: c.color }}>
            {c.icon}
          </div>
          <div className="sr-stat-body">
            <div className="sr-stat-value" style={{ color: c.color }}>{c.value}</div>
            <div className="sr-stat-label">{c.label}</div>
          </div>
          {c.extra && (
            <div className="sr-stat-badge" style={{ color: c.color, background: c.bg }}>
              {c.extra}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
