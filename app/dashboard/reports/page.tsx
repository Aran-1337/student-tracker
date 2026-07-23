"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { AuthService } from "@/lib/services/authService";
import { TeachersService } from "@/lib/services/teachersService";
import { StudentsService } from "@/lib/services/studentsService";
import { BillsService } from "@/lib/services/billsService";
import { GroupsService } from "@/lib/services/groupsService";
import { GradesService } from "@/lib/services/gradesService";
import { SubTeachersService } from "@/lib/services/subTeachersService";
import { AlertCircle, BarChart3, Filter } from "lucide-react";

import { ReportsSummaryCards } from "./_components/ReportsSummaryCards";
import { InsightsStrip } from "./_components/InsightsStrip";
import { MonthlyTable } from "./_components/MonthlyTable";
import { UnpaidStudentsModal } from "./_components/UnpaidStudentsModal";

import type { BookDef, Grade, Group, SubTeacher, Bill } from "@/lib/types";

interface Student {
  id: string;
  name: string;
  group_id: string | null;
  grade_id?: string | null;
  months: boolean[];
  received_books: string[];
  discount_value?: number;
}

const arabicMonths = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

const currentYear = new Date().getFullYear();

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [monthlyPrice, setMonthlyPrice] = useState(100);
  const [teacherBooks, setTeacherBooks] = useState<BookDef[]>([]);
  const [hasCenterMode, setHasCenterMode] = useState(false);
  const [subTeachers, setSubTeachers] = useState<SubTeacher[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [showAllGrades, setShowAllGrades] = useState(false);
  const [showAllBooks, setShowAllBooks] = useState(false);
  const [showUnpaid, setShowUnpaid] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function loadReports() {
      try {
        const { data: { session } } = await AuthService.getSession();
        if (!session) return;

        const teacher = await TeachersService.getTeacherProfile(session.user.id);
        if (teacher) {
          setMonthlyPrice(Number(teacher.monthly_price) || 0);
          setTeacherBooks(teacher.books || []);
          const centerMode = teacher.is_center_mode || false;
          setHasCenterMode(centerMode);
          if (centerMode) {
            const subs = await SubTeachersService.getSubTeachersByCenterId(session.user.id);
            setSubTeachers(subs || []);
          }
          const grps = await GroupsService.getGroupsByTeacherId(session.user.id);
          setGroups(grps || []);
          const grds = await GradesService.getGradesByTeacherId(session.user.id);
          setGrades(grds || []);
        }

        const studentsData = await StudentsService.getStudentsByTeacherId(session.user.id);
        setStudents(
          (studentsData || []).map((s) => ({
            ...s,
            months: Array.isArray(s.months) && s.months.length === 12 ? s.months : Array(12).fill(false),
            received_books: Array.isArray(s.received_books) ? s.received_books : [],
          }))
        );

        const billsData = await BillsService.getBillsByTeacherId(session.user.id);
        setBills(billsData || []);
      } catch {
        showToast("حدث خطأ أثناء تحميل التقارير.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  // ── helpers ───────────────────────────────────────────────────────────────
  const getStudentPrice = (student: Student) => {
    const grp = groups.find((g) => g.id === student.group_id);
    const grd = grades.find((g) => g.id === student.grade_id);
    const base = grp?.monthly_price ?? grd?.monthly_price ?? monthlyPrice;
    return Math.max(0, (base ?? monthlyPrice) - (student.discount_value || 0));
  };

  const getEffectiveGradeId = (s: Student) =>
    s.grade_id || groups.find((g) => g.id === s.group_id)?.grade_id || null;

  const currentMonthIndex = new Date().getMonth();

  const filteredStudents =
    selectedTeacherId === "all"
      ? students
      : students.filter((s) => {
          const grp = groups.find((g) => g.id === s.group_id);
          return grp && grp.sub_teacher_id === selectedTeacherId;
        });

  const totalFilteredStudents = filteredStudents.length;

  // ── expenses filtered by selected year ───────────────────────────────────
  const yearBills = bills.filter(b => (b.billing_year ?? currentYear) === selectedYear);

  // ── subscriptions ─────────────────────────────────────────────────────────
  const paidThisMonthCount = filteredStudents.filter((s) => s.months[currentMonthIndex]).length;
  const totalSubscriptionEarnings = filteredStudents.reduce((acc, s) => {
    return acc + s.months.filter(Boolean).length * getStudentPrice(s);
  }, 0);

  // ── books ─────────────────────────────────────────────────────────────────
  let totalBookEarnings = 0;
  const booksStats = teacherBooks.map((book) => {
    const count = filteredStudents.filter((s) => s.received_books?.includes(book.id)).length;
    const earnings = count * book.price;
    totalBookEarnings += earnings;
    const gradeName = grades.find((g) => g.id === book.grade_id)?.name;
    return { ...book, count, earnings, gradeName };
  });
  booksStats.sort((a, b) => b.earnings - a.earnings);

  // ── grades stats ──────────────────────────────────────────────────────────
  const gradesStats = grades.map((grade) => {
    const gs = filteredStudents.filter((s) => getEffectiveGradeId(s) === grade.id);
    const paidThisMonth = gs.filter((s) => s.months[currentMonthIndex]).length;
    const earnings = gs.reduce((acc, s) => acc + s.months.filter(Boolean).length * getStudentPrice(s), 0);
    return { id: grade.id, name: grade.name, paidThisMonth, earnings };
  });

  const generalStudents = filteredStudents.filter((s) => !getEffectiveGradeId(s));
  const generalPaidThisMonth = generalStudents.filter((s) => s.months[currentMonthIndex]).length;
  const generalEarnings = generalStudents.reduce(
    (acc, s) => acc + s.months.filter(Boolean).length * getStudentPrice(s), 0
  );
  if (generalEarnings > 0 || generalPaidThisMonth > 0) {
    gradesStats.push({ id: "general", name: "طلاب بدون سنة دراسية", paidThisMonth: generalPaidThisMonth, earnings: generalEarnings });
  }
  gradesStats.sort((a, b) => b.earnings - a.earnings);

  // ── totals ────────────────────────────────────────────────────────────────
  const totalGrossEarnings = totalSubscriptionEarnings + totalBookEarnings;
  const totalExpenses = yearBills.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalNetProfit = totalGrossEarnings - totalExpenses;

  // ── prev month for trend ──────────────────────────────────────────────────
  const prevMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
  const prevMonthEarnings = filteredStudents.reduce(
    (acc, s) => acc + (s.months[prevMonthIndex] ? getStudentPrice(s) : 0), 0
  );
  const prevMonthBills = yearBills.filter(b => b.billing_month === prevMonthIndex + 1);
  const prevMonthExpenses = prevMonthBills.reduce((sum, b) => sum + Number(b.amount), 0);
  const prevMonthNetProfit = prevMonthEarnings - prevMonthExpenses;

  // ── unpaid students ───────────────────────────────────────────────────────
  const unpaidStudents = filteredStudents
    .filter((s) => !s.months[currentMonthIndex])
    .map((s) => ({
      id: s.id,
      name: s.name,
      gradeName: grades.find((g) => g.id === getEffectiveGradeId(s))?.name,
      groupName: groups.find((g) => g.id === s.group_id)?.name,
    }));

  // ── monthly breakdown ─────────────────────────────────────────────────────
  const monthsReport = arabicMonths.map((name, index) => {
    const paidCount = filteredStudents.filter((s) => s.months[index]).length;
    const subscriptionEarnings = filteredStudents.reduce(
      (acc, s) => acc + (s.months[index] ? getStudentPrice(s) : 0), 0
    );
    const monthBills = yearBills.filter(b => b.billing_month === index + 1);
    const monthExpenses = monthBills.reduce((sum, b) => sum + Number(b.amount), 0);
    const netProfit = subscriptionEarnings - monthExpenses;
    const percentage = totalFilteredStudents > 0 ? Math.round((paidCount / totalFilteredStudents) * 100) : 0;
    return {
      name, paidCount, subscriptionEarnings,
      bookEarnings: 0,
      monthExpenses, netProfit, percentage,
      isCurrentMonth: index === currentMonthIndex && selectedYear === currentYear,
    };
  });

  // ── CSV export ────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ["الشهر", "عدد المدفوعات", "إيراد الاشتراك", "المصروفات", "صافي الربح", "نسبة السداد"];
    const rows = monthsReport.map((m) => [
      m.name, m.paidCount, m.subscriptionEarnings, m.monthExpenses, m.netProfit, `${m.percentage}%`,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `تقرير_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── render ────────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="loading-wrapper"><div className="spinner" /></div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div className="reports-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.875rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.25)", color: "var(--color-teal)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <BarChart3 size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: "clamp(1.25rem, 3vw, 1.75rem)", marginBottom: "0.1rem" }}>التقارير المالية</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "clamp(0.75rem, 1.5vw, 0.85rem)" }}>تحليلات الإيرادات · المصروفات · صافي الأرباح</p>
            </div>
          </div>
        </div>

          {/* Filters Bar */}
        <div className="glass-panel reports-filters" style={{ padding: "0.65rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
            <Filter size={13} />
            <span>فلتر:</span>
          </div>

          {/* Year selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>السنة:</label>
            <select
              className="form-input"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{ padding: "0.3rem 0.6rem", borderRadius: "8px", fontSize: "0.82rem", width: "auto" }}
            >
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Teacher filter (center mode only) */}
          {hasCenterMode && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>المعلم:</label>
              <select
                className="form-input"
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                style={{ padding: "0.3rem 0.6rem", borderRadius: "8px", fontSize: "0.82rem", width: "auto" }}
              >
                <option value="all">الكل</option>
                {subTeachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="reports-filters-info" style={{ marginRight: "auto", fontSize: "0.78rem", color: "var(--text-muted)" }}>
            {totalFilteredStudents} طالب · {arabicMonths[currentMonthIndex]} {selectedYear}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <ReportsSummaryCards
        totalNetProfit={totalNetProfit}
        totalGrossEarnings={totalGrossEarnings}
        totalExpenses={totalExpenses}
        totalBookEarnings={totalBookEarnings}
        prevMonthNetProfit={prevMonthNetProfit}
        prevMonthGrossEarnings={prevMonthEarnings}
        prevMonthExpenses={prevMonthExpenses}
        prevMonthBookEarnings={0}
      />

      {/* ── Insights Strip ── */}
      <InsightsStrip
        topGrade={gradesStats[0] ?? null}
        unpaidCount={unpaidStudents.length}
        topBook={booksStats[0] ?? null}
        totalStudents={totalFilteredStudents}
        currentMonthName={arabicMonths[currentMonthIndex]}
        onShowUnpaid={() => setShowUnpaid(true)}
      />

      {/* ── Monthly Table ── */}
      <MonthlyTable monthsReport={monthsReport} onExportCSV={handleExportCSV} />

      {/* ── Toast ── */}
      {toast && (
        <div className={`alert-toast ${toast.type === "success" ? "alert-success" : "alert-error"}`}>
          {toast.type === "error" && <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Modals ── */}
      <UnpaidStudentsModal
        isOpen={showUnpaid}
        onClose={() => setShowUnpaid(false)}
        students={unpaidStudents}
        currentMonthName={arabicMonths[currentMonthIndex]}
      />

      <Modal isOpen={showAllGrades} onClose={() => setShowAllGrades(false)} title="جميع أرباح الاشتراكات" maxWidth="600px">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {gradesStats.map((g, idx) => (
            <div key={g.id} className="flex-between" style={{ borderBottom: idx !== gradesStats.length - 1 ? "1px solid var(--border-color)" : "none", paddingBottom: "0.5rem" }}>
              <div>
                <p style={{ fontWeight: 600 }}>إجمالي أرباح {g.name}</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{g.paidThisMonth} طالب دفعوا هذا الشهر</p>
              </div>
              <span className="monospace" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{g.earnings.toLocaleString()} ج.م</span>
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={showAllBooks} onClose={() => setShowAllBooks(false)} title="جميع أرباح الكتب" maxWidth="600px">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {booksStats.map((book, idx) => (
            <div key={book.id} className="flex-between" style={{ borderBottom: idx !== booksStats.length - 1 ? "1px solid var(--border-color)" : "none", paddingBottom: "0.5rem" }}>
              <div>
                <p style={{ fontWeight: 600 }}>{book.name}</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {book.count} طالب · {book.price} ج.م{book.gradeName ? ` · ${book.gradeName}` : ""}
                </p>
              </div>
              <span className="monospace" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{book.earnings.toLocaleString()} ج.م</span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
