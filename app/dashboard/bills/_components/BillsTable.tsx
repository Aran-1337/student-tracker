"use client";

"use client";

import { useState } from "react";
import { Bill } from "@/lib/types";
import { FileText, AlertCircle, Calendar, Repeat, Trash2, Pencil, Download } from "./Icons";
import { arabicMonths, CAT_STYLE } from "../_hooks/useBills";
import { exportBillsPDF } from "../_hooks/exportPDF";

interface Props {
  filteredBills: Bill[];
  allBills: Bill[];
  totalFiltered: number;
  categoryTotals: Record<string, number>;
  totalYear: number;
  activeMonth: string;
  setActiveMonth: (v: string) => void;
  activeYear: number;
  setActiveYear: (v: number) => void;
  availableYears: number[];
  selectedBillIds: Set<string>;
  allFilteredSelected: boolean;
  someFilteredSelected: boolean;
  onSelectAll: (bills: Bill[]) => void;
  onToggleRow: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (bill: Bill) => void;
}

export default function BillsTable({
  filteredBills, allBills, totalFiltered, categoryTotals, totalYear,
  activeMonth, setActiveMonth,
  activeYear, setActiveYear, availableYears,
  selectedBillIds, allFilteredSelected, someFilteredSelected,
  onSelectAll, onToggleRow, onDelete, onEdit,
}: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      await exportBillsPDF(allBills, activeYear, activeMonth, categoryTotals, totalYear);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <section className="glass-panel panel-content bills-table-section">
      {/* Header */}
      <div className="bills-table-header">
        <h2 className="panel-title" style={{ margin: 0 }}>
          <FileText size={18} style={{ color: "var(--color-info)" }} />
          <span>فواتير المصروفات ({filteredBills.length})</span>
        </h2>
        <div className="bills-table-controls">
          {/* Year selector */}
          <select
            className="form-input"
            value={activeYear}
            onChange={e => setActiveYear(Number(e.target.value))}
            style={{ padding: "0.4rem 0.75rem", fontSize: "0.88rem", width: "auto" }}
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="bills-total-inline" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>الإجمالي:</span>
              <span className="monospace" style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f87171" }}>
                {Number(totalFiltered).toLocaleString()} ج.م
              </span>
            </div>
            <button
              className="btn btn-secondary"
              onClick={handleExportPDF}
              disabled={pdfLoading || filteredBills.length === 0}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.85rem", fontSize: "0.82rem" }}
              title="تصدير PDF"
            >
              <Download size={14} />
              <span>{pdfLoading ? "جاري التصدير..." : "PDF"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Month Filter Chips */}
      <div className="bills-months-scroll">
        <button className={`chip ${activeMonth === "all" ? "active" : ""}`} onClick={() => setActiveMonth("all")}>
          كل الشهور
        </button>
        {arabicMonths.map((m, i) => (
          <button
            key={i}
            className={`chip ${activeMonth === String(i + 1) ? "active" : ""}`}
            onClick={() => setActiveMonth(String(i + 1))}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        {filteredBills.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} className="empty-state-icon" />
            <p>لا توجد فواتير لهذا الشهر / السنة.</p>
          </div>
        ) : (
          <table className="students-table">
            <thead>
              <tr>
                <th style={{ width: "40px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    ref={el => { if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected; }}
                    onChange={() => onSelectAll(filteredBills)}
                    style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#3b82f6" }}
                    title="تحديد الكل"
                  />
                </th>
                <th>بيان الفاتورة</th>
                <th className="bills-col-category">التصنيف</th>
                <th className="bills-col-date">الشهر / السنة</th>
                <th>القيمة</th>
                <th style={{ textAlign: "center" }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map(bill => (
                <tr
                  key={bill.id}
                  style={{
                    background: selectedBillIds.has(bill.id) ? "rgba(59,130,246,0.08)" : undefined,
                    transition: "background 0.15s ease",
                  }}
                >
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedBillIds.has(bill.id)}
                      onChange={() => onToggleRow(bill.id)}
                      style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#3b82f6" }}
                    />
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {bill.is_recurring && (
                        <Repeat size={13} style={{ color: "#10b981", flexShrink: 0 }} title="متكررة" />
                      )}
                      <div>
                        <span style={{ fontWeight: 600, color: "#fff" }}>{bill.title}</span>
                        <div className="bills-col-date" style={{ display: "none", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {arabicMonths[bill.billing_month - 1]} {bill.billing_year}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="bills-col-category">
                    <span style={{
                      display: "inline-block", fontSize: "0.8rem",
                      padding: "2px 8px", borderRadius: "4px",
                      ...CAT_STYLE[bill.category],
                    }}>
                      {bill.category}
                    </span>
                  </td>
                  <td className="bills-col-date">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Calendar size={13} style={{ color: "var(--text-muted)" }} />
                      <span>{arabicMonths[bill.billing_month - 1]}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{bill.billing_year}</span>
                    </div>
                  </td>
                  <td>
                    <span className="monospace" style={{ fontWeight: 700, color: "#f87171" }}>
                      -{Number(bill.amount).toLocaleString()} ج.م
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                      <button
                        className="btn btn-secondary btn-icon"
                        onClick={() => onEdit(bill)}
                        title="تعديل"
                        style={{ width: "32px", height: "32px" }}
                      >
                        <Pencil size={14} style={{ color: "var(--color-info)" }} />
                      </button>
                      <button
                        className="btn btn-secondary btn-icon"
                        onClick={() => onDelete(bill.id)}
                        title="حذف"
                        style={{ width: "32px", height: "32px" }}
                      >
                        <Trash2 size={14} className="color-danger" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
