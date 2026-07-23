"use client";

import { Calendar, Printer } from "lucide-react";

export interface MonthReport {
  name: string;
  paidCount: number;
  subscriptionEarnings: number;
  monthExpenses: number;
  bookEarnings: number;
  netProfit: number;
  percentage: number;
  isCurrentMonth: boolean;
}

interface Props {
  monthsReport: MonthReport[];
  onExportCSV?: () => void;
}

export function MonthlyTable({ monthsReport }: Props) {
  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const rows = monthsReport.map((m) => `
      <tr>
        <td>${m.name}${m.isCurrentMonth ? " (الحالي)" : ""}</td>
        <td>${(m.subscriptionEarnings + m.bookEarnings).toLocaleString()} ج.م</td>
        <td>${m.paidCount} طالب</td>
        <td>${m.bookEarnings > 0 ? m.bookEarnings.toLocaleString() + " ج.م" : "—"}</td>
        <td>${m.monthExpenses > 0 ? "-" + m.monthExpenses.toLocaleString() + " ج.م" : "—"}</td>
        <td>${m.netProfit.toLocaleString()} ج.م</td>
        <td>${m.percentage}%</td>
      </tr>`).join("");
    printWindow.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>التقرير المالي الشهري</title><style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:right}th{background:#f0f0f0;font-weight:bold}h2{margin-bottom:16px}</style></head><body><h2>التقرير المالي الشهري</h2><table><thead><tr><th>الشهر</th><th>الإيرادات</th><th>المدفوعات</th><th>الكتب</th><th>المصروفات</th><th>صافي الربح</th><th>نسبة السداد</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    printWindow.document.close();
    printWindow.print();
  }
  const maxEarnings = Math.max(...monthsReport.map((m) => m.subscriptionEarnings + m.bookEarnings), 1);

  return (
    <section className="glass-panel panel-content" style={{ marginTop: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "clamp(0.95rem, 2vw, 1.1rem)", fontWeight: 700 }}>
          <Calendar size={18} style={{ color: "var(--color-info)", flexShrink: 0 }} />
          التقرير المالي الشهري
        </h2>
        <button
          onClick={handlePrint}
          className="export-btn"
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem" }}
        >
          <Printer size={14} />
          طباعة
        </button>
      </div>

      <div className="report-table-wrapper table-container">
        <table className="report-table" style={{ fontSize: "0.85rem" }}>
          <thead>
            <tr>
              <th style={{ width: "80px" }}>الشهر</th>
              <th>الإيرادات</th>
              <th>الطلاب الدافعين</th>
              <th>الكتب</th>
              <th>المصروفات</th>
              <th>صافي الربح</th>
              <th style={{ width: "120px" }}>نسبة السداد</th>
            </tr>
          </thead>
          <tbody>
            {monthsReport.map((month) => {
              const totalIncome = month.subscriptionEarnings + month.bookEarnings;
              const barWidth = Math.round((totalIncome / maxEarnings) * 100);

              return (
                <tr
                  key={month.name}
                  style={{
                    background: month.isCurrentMonth ? "rgba(20,184,166,0.05)" : undefined,
                    borderRight: month.isCurrentMonth ? "3px solid var(--color-teal)" : "3px solid transparent",
                  }}
                >
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: month.isCurrentMonth ? 700 : 600, color: month.isCurrentMonth ? "var(--color-teal)" : "var(--text-primary)" }}>
                        {month.name}
                      </span>
                      {month.isCurrentMonth && (
                        <span style={{ fontSize: "0.6rem", padding: "1px 5px", borderRadius: "4px", background: "rgba(20,184,166,0.15)", color: "var(--color-teal)", border: "1px solid rgba(20,184,166,0.3)", whiteSpace: "nowrap" }}>
                          الحالي
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <span className="monospace" style={{ fontWeight: 600, color: totalIncome > 0 ? "var(--color-teal)" : "var(--text-muted)" }}>
                        {totalIncome.toLocaleString()} ج.م
                      </span>
                      <div className="progress-inline" style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.05)", overflow: "hidden", width: "80px" }}>
                        <div style={{
                          height: "100%", borderRadius: "2px",
                          background: month.isCurrentMonth ? "var(--color-teal)" : "rgba(20,184,166,0.5)",
                          width: `${barWidth}%`,
                          transition: "width 0.6s ease",
                        }} />
                      </div>
                    </div>
                  </td>

                  <td className="monospace" style={{ color: "var(--text-secondary)" }}>
                    {month.paidCount} طالب
                  </td>

                  <td className="monospace" style={{ color: month.bookEarnings > 0 ? "var(--color-amber)" : "var(--text-muted)" }}>
                    {month.bookEarnings > 0 ? `${month.bookEarnings.toLocaleString()} ج.م` : "—"}
                  </td>

                  <td className="monospace" style={{ color: month.monthExpenses > 0 ? "#f87171" : "var(--text-muted)" }}>
                    {month.monthExpenses > 0 ? `-${month.monthExpenses.toLocaleString()} ج.م` : "—"}
                  </td>

                  <td className="monospace" style={{
                    fontWeight: 700,
                    color: month.netProfit > 0 ? "#10b981" : month.netProfit < 0 ? "#ef4444" : "var(--text-muted)",
                  }}>
                    {month.netProfit.toLocaleString()} ج.م
                  </td>

                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span className="monospace" style={{
                        fontSize: "0.8rem", fontWeight: 700, minWidth: "32px",
                        color: month.percentage > 70 ? "#10b981" : month.percentage > 30 ? "var(--color-teal)" : "#f87171",
                      }}>
                        {month.percentage}%
                      </span>
                      <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.05)", overflow: "hidden", minWidth: "40px" }}>
                        <div style={{
                          height: "100%", borderRadius: "3px",
                          background: month.percentage > 70 ? "#10b981" : month.percentage > 30 ? "var(--color-teal)" : "#f87171",
                          width: `${month.percentage}%`,
                          transition: "width 0.6s ease",
                        }} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
