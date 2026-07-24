"use client";

import { HiOutlineMagnifyingGlass, HiOutlineFunnel } from "react-icons/hi2";
import { Grade, Group } from "@/lib/types";

const arabicMonths = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1];

interface Props {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedMonthIndex: number;
  setSelectedMonthIndex: (v: number) => void;
  selectedYear: number;
  setSelectedYear: (v: number) => void;
  filterGradeId: string;
  setFilterGradeId: (v: string) => void;
  filterGroupId: string;
  setFilterGroupId: (v: string) => void;
  filterPayment: "all" | "paid" | "unpaid";
  setFilterPayment: (v: "all" | "paid" | "unpaid") => void;
  grades: Grade[];
  filteredGroups: Group[];
}

export default function ReportsFilters({
  searchQuery, setSearchQuery,
  selectedMonthIndex, setSelectedMonthIndex,
  selectedYear, setSelectedYear,
  filterGradeId, setFilterGradeId,
  filterGroupId, setFilterGroupId,
  filterPayment, setFilterPayment,
  grades, filteredGroups,
}: Props) {
  return (
    <div className="glass-panel sr-filters">
      <div className="sr-filters-row">
        {/* Search */}
        <div className="sr-search-wrap">
          <HiOutlineMagnifyingGlass className="sr-search-icon" size={17} />
          <input
            className="form-input sr-search-input"
            type="text"
            placeholder="بحث بالاسم أو الكود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Month */}
        <select
          className="form-input sr-select"
          value={selectedMonthIndex}
          onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
        >
          {arabicMonths.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>

        {/* Year — FIX: was hardcoded */}
        <select
          className="form-input sr-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* Grade */}
        <select
          className="form-input sr-select"
          value={filterGradeId}
          onChange={(e) => { setFilterGradeId(e.target.value); setFilterGroupId("all"); }}
        >
          <option value="all">كل السنوات</option>
          {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>

        {/* Group */}
        <select
          className="form-input sr-select"
          value={filterGroupId}
          onChange={(e) => setFilterGroupId(e.target.value)}
        >
          <option value="all">كل المجموعات</option>
          {filteredGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* Payment quick-filter chips */}
      <div className="sr-chips">
        <HiOutlineFunnel size={15} style={{ color: "var(--text-muted)", marginLeft: "0.25rem" }} />
        {(["all", "paid", "unpaid"] as const).map((v) => (
          <button
            key={v}
            className={`chip ${filterPayment === v ? "active" : ""}`}
            onClick={() => setFilterPayment(v)}
          >
            {v === "all" ? "الكل" : v === "paid" ? "✅ دفعوا" : "❌ لم يدفعوا"}
          </button>
        ))}
      </div>
    </div>
  );
}
