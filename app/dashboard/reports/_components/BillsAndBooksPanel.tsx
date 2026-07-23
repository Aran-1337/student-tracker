"use client";

import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface BookStat {
  id: string;
  name: string;
  price: number;
  count: number;
  earnings: number;
  gradeName?: string;
}

interface Props {
  totalExpenses: number;
  topBooksStats: BookStat[];
  booksStats: BookStat[];
  onShowAll: () => void;
}

export function BillsAndBooksPanel({ totalExpenses, topBooksStats, booksStats, onShowAll }: Props) {
  return (
    <section className="glass-panel panel-content" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <h2 className="panel-title">
        <Receipt size={18} style={{ color: "var(--color-amber)" }} />
        <span>تفاصيل الفواتير والكتب</span>
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1rem", flex: 1, justifyContent: "space-between" }}>
        <div className="flex-between" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
          <div>
            <p style={{ fontWeight: 600 }}>إجمالي الفواتير والمصروفات</p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              تشمل الإيجارات ورواتب السكرتارية والمصروفات الأخرى
            </p>
          </div>
          <span className="monospace" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f87171" }}>
            -{totalExpenses} ج.م
          </span>
        </div>

        {topBooksStats.map((book, idx) => (
          <div
            key={book.id}
            className="flex-between"
            style={{
              borderBottom: idx !== topBooksStats.length - 1 ? "1px solid var(--border-color)" : "none",
              paddingBottom: idx !== topBooksStats.length - 1 ? "1rem" : "0.5rem",
            }}
          >
            <div>
              <p style={{ fontWeight: 600 }}>إجمالي أرباح {book.name}</p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                {book.count} طالب استلموا الكتاب بسعر {book.price} ج.م{book.gradeName ? ` (${book.gradeName})` : ""}
              </p>
            </div>
            <span className="monospace" style={{ fontSize: "1.25rem", fontWeight: 700 }}>{book.earnings} ج.م</span>
          </div>
        ))}

        {booksStats.length > 3 && (
          <Button variant="secondary" size="sm" onClick={onShowAll} style={{ width: "100%", marginTop: "0.5rem" }}>
            عرض المزيد
          </Button>
        )}

        {booksStats.length === 0 && (
          <p style={{ fontWeight: 600, color: "var(--text-muted)" }}>لا يوجد كتب مضافة</p>
        )}
      </div>
    </section>
  );
}
