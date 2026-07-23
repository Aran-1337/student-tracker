"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

const arabicMonths = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

export interface GradeStat {
  id: string;
  name: string;
  paidThisMonth: number;
  earnings: number;
}

interface Props {
  currentMonthIndex: number;
  paidThisMonthCount: number;
  currentMonthEarnings: number;
  totalSubscriptionEarnings: number;
  topGradesStats: GradeStat[];
  gradesStats: GradeStat[];
  onShowAll: () => void;
}

export function SubscriptionsPanel({
  currentMonthIndex,
  paidThisMonthCount,
  currentMonthEarnings,
  totalSubscriptionEarnings,
  topGradesStats,
  gradesStats,
  onShowAll,
}: Props) {
  return (
    <section className="glass-panel panel-content" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <h2 className="panel-title">
        <CheckCircle2 size={18} style={{ color: "var(--color-teal)" }} />
        <span>تفاصيل أرباح الاشتراكات</span>
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1rem", flex: 1, justifyContent: "space-between" }}>
        <div className="flex-between" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
          <div>
            <p style={{ fontWeight: 600 }}>أرباح الاشتراك في الشهر الحالي ({arabicMonths[currentMonthIndex]})</p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{paidThisMonthCount} طالب دفعوا الاشتراك</p>
          </div>
          <span className="monospace" style={{ fontSize: "1.25rem", fontWeight: 700 }}>{currentMonthEarnings} ج.م</span>
        </div>

        <div className="flex-between" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
          <div>
            <p style={{ fontWeight: 600 }}>إجمالي إيراد الاشتراكات</p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>مجموع كل عمليات الدفع لجميع السنين</p>
          </div>
          <span className="monospace" style={{ fontSize: "1.25rem", fontWeight: 700 }}>{totalSubscriptionEarnings} ج.م</span>
        </div>

        {topGradesStats.map((gradeStat, idx) => (
          <div
            key={gradeStat.id}
            className="flex-between"
            style={{
              borderBottom: idx !== topGradesStats.length - 1 ? "1px solid var(--border-color)" : "none",
              paddingBottom: idx !== topGradesStats.length - 1 ? "1rem" : "0.5rem",
            }}
          >
            <div>
              <p style={{ fontWeight: 600 }}>إجمالي أرباح {gradeStat.name}</p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                {gradeStat.paidThisMonth} طالب دفعوا الاشتراك هذا الشهر ({arabicMonths[currentMonthIndex]})
              </p>
            </div>
            <span className="monospace" style={{ fontSize: "1.25rem", fontWeight: 700 }}>{gradeStat.earnings} ج.م</span>
          </div>
        ))}

        {gradesStats.length > 2 && (
          <Button variant="secondary" size="sm" onClick={onShowAll} style={{ width: "100%", marginTop: "0.5rem" }}>
            عرض المزيد
          </Button>
        )}

        {gradesStats.length === 0 && (
          <p style={{ fontWeight: 600, color: "var(--text-muted)" }}>لا توجد سنين دراسية مضافة</p>
        )}
      </div>
    </section>
  );
}
