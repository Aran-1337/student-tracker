"use client";

import Link from "next/link";
import { QrCode, UserPlus, TrendingUp, ClipboardList } from "lucide-react";

interface QuickActionsProps {
  hasAttendance: boolean;
  onAddStudent: () => void;
}

export function QuickActions({ hasAttendance, onAddStudent }: QuickActionsProps) {
  return (
    <div className="quick-actions-bar glass-panel">
      <span className="quick-actions-label">إجراءات سريعة</span>
      <div className="quick-actions-list">
        {hasAttendance && (
          <Link href="/dashboard/attendance/scan" className="quick-action-btn">
            <QrCode size={16} />
            <span>سكان QR</span>
          </Link>
        )}
        <button className="quick-action-btn" onClick={onAddStudent}>
          <UserPlus size={16} />
          <span>إضافة طالب</span>
        </button>
        <Link href="/dashboard/attendance" className="quick-action-btn">
          <ClipboardList size={16} />
          <span>سجل الحضور</span>
        </Link>
        <Link href="/dashboard/reports" className="quick-action-btn">
          <TrendingUp size={16} />
          <span>التقارير</span>
        </Link>
      </div>
    </div>
  );
}
