"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  TrendingUp, 
  DollarSign, 
  BookOpen, 
  Calendar, 
  Users,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  group_id: string | null;
  months: boolean[];
  book_1: boolean;
  book_2: boolean;
}

const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Pricing settings from teachers table
  const [monthlyPrice, setMonthlyPrice] = useState(100);
  const [book1Price, setBook1Price] = useState(50);
  const [book2Price, setBook2Price] = useState(50);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function loadReports() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // 1. Fetch teacher settings
        const { data: teacher } = await supabase
          .from("teachers")
          .select("monthly_price, book_1_price, book_2_price")
          .eq("id", session.user.id)
          .single();

        if (teacher) {
          setMonthlyPrice(Number(teacher.monthly_price) || 0);
          setBook1Price(Number(teacher.book_1_price) || 0);
          setBook2Price(Number(teacher.book_2_price) || 0);
        }

        // 2. Fetch students
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("*");

        if (studentsError) throw studentsError;

        const validatedStudents = (studentsData || []).map(student => ({
          ...student,
          months: Array.isArray(student.months) && student.months.length === 12
            ? student.months 
            : Array(12).fill(false)
        }));
        setStudents(validatedStudents);
      } catch (err: any) {
        showToast("حدث خطأ أثناء تحميل التقارير.", "error");
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  const totalStudents = students.length;
  const currentMonthIndex = new Date().getMonth();

  // Calculations
  // 1. Subscriptions
  const paidThisMonthCount = students.filter(s => s.months[currentMonthIndex] === true).length;
  const currentMonthEarnings = paidThisMonthCount * monthlyPrice;

  const totalPaidMonthsCount = students.reduce((acc, s) => {
    return acc + s.months.filter(m => m === true).length;
  }, 0);
  const totalSubscriptionEarnings = totalPaidMonthsCount * monthlyPrice;

  // 2. Books
  const book1Count = students.filter(s => s.book_1).length;
  const book2Count = students.filter(s => s.book_2).length;
  const book1Earnings = book1Count * book1Price;
  const book2Earnings = book2Count * book2Price;
  const totalBookEarnings = book1Earnings + book2Earnings;

  // 3. Combined
  const totalEarnings = totalSubscriptionEarnings + totalBookEarnings;

  // Month-by-month statistics
  const monthsReport = arabicMonths.map((name, index) => {
    const paidCount = students.filter(s => s.months[index] === true).length;
    const earnings = paidCount * monthlyPrice;
    const percentage = totalStudents > 0 ? Math.round((paidCount / totalStudents) * 100) : 0;
    return { name, paidCount, earnings, percentage };
  });

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>التقارير المالية</h1>
        <p style={{ color: "var(--text-secondary)" }}>تحليلات الاشتراكات وأرباح الكتب الدراسية</p>
      </div>

      {/* Main Earnings Summary Cards */}
      <section className="stats-grid" style={{ marginBottom: "2.5rem" }}>
        <div className="stat-card glass-panel report-card-green">
          <div className="stat-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label" style={{ color: "#a7f3d0" }}>إجمالي الأرباح الكلي</span>
            <span className="stat-value monospace" style={{ fontSize: "2.2rem", fontWeight: 900 }}>{totalEarnings} ج.م</span>
          </div>
        </div>

        <div className="stat-card glass-panel report-card-teal">
          <div className="stat-icon-wrapper" style={{ background: "rgba(20, 184, 166, 0.15)", color: "var(--color-teal)", border: "1px solid rgba(20, 184, 166, 0.2)" }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label" style={{ color: "#99f6e4" }}>أرباح الاشتراكات الكلية</span>
            <span className="stat-value monospace">{totalSubscriptionEarnings} ج.م</span>
          </div>
        </div>

        <div className="stat-card glass-panel report-card-amber">
          <div className="stat-icon-wrapper" style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--color-amber)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label" style={{ color: "#fde68a" }}>أرباح الكتب الكلية</span>
            <span className="stat-value monospace">{totalBookEarnings} ج.م</span>
          </div>
        </div>
      </section>

      {/* Financial Split Grid */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        
        {/* Subscriptions Card Details */}
        <section className="glass-panel panel-content">
          <h2 className="panel-title">
            <CheckCircle2 size={18} style={{ color: "var(--color-teal)" }} />
            <span>تفاصيل أرباح الاشتراكات</span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1rem" }}>
            <div className="flex-between" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
              <div>
                <p style={{ fontWeight: 600 }}>قيمة الاشتراك الشهري المحدد</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>من صفحة الإعدادات</p>
              </div>
              <span className="monospace" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-teal)" }}>{monthlyPrice} ج.م</span>
            </div>
            <div className="flex-between" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
              <div>
                <p style={{ fontWeight: 600 }}>أرباح الشهر الحالي ({arabicMonths[currentMonthIndex]})</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{paidThisMonthCount} طالب دفعوا الاشتراك</p>
              </div>
              <span className="monospace" style={{ fontSize: "1.25rem", fontWeight: 700 }}>{currentMonthEarnings} ج.م</span>
            </div>
            <div className="flex-between" style={{ paddingBottom: "0.5rem" }}>
              <div>
                <p style={{ fontWeight: 600 }}>إجمالي الشهور المدفوعة</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>مجموع كل عمليات الدفع المفعلة لجميع الطلاب</p>
              </div>
              <span className="monospace" style={{ fontSize: "1.25rem", fontWeight: 700 }}>{totalPaidMonthsCount} شهر</span>
            </div>
          </div>
        </section>

        {/* Books Card Details */}
        <section className="glass-panel panel-content">
          <h2 className="panel-title">
            <BookOpen size={18} style={{ color: "var(--color-amber)" }} />
            <span>تفاصيل أرباح الكتب الدراسية</span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1rem" }}>
            <div className="flex-between" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1.25rem" }}>
              <div>
                <p style={{ fontWeight: 600 }}>أرباح الكتاب الأول (كتاب ١)</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>تم استلامه بواسطة {book1Count} طالب (سعر النسخة: {book1Price} ج.م)</p>
              </div>
              <span className="monospace" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-amber)" }}>{book1Earnings} ج.م</span>
            </div>
            <div className="flex-between" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1.25rem" }}>
              <div>
                <p style={{ fontWeight: 600 }}>أرباح الكتاب الثاني (كتاب ٢)</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>تم استلامه بواسطة {book2Count} طالب (سعر النسخة: {book2Price} ج.م)</p>
              </div>
              <span className="monospace" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-amber)" }}>{book2Earnings} ج.م</span>
            </div>
            <div className="flex-between" style={{ paddingBottom: "0.5rem" }}>
              <div>
                <p style={{ fontWeight: 600 }}>إجمالي الكتب المستلمة</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>مجموع مستلمي كلا الكتابين</p>
              </div>
              <span className="monospace" style={{ fontSize: "1.25rem", fontWeight: 700 }}>{book1Count + book2Count} نسخة</span>
            </div>
          </div>
        </section>

      </div>

      {/* Month-by-Month Table Breakdown */}
      <section className="glass-panel panel-content" style={{ marginTop: "2rem" }}>
        <h2 className="panel-title">
          <Calendar size={18} style={{ color: "var(--color-info)" }} />
          <span>تقرير الاشتراكات الشهري بالتفصيل</span>
        </h2>
        
        <div className="table-container" style={{ marginTop: "1rem" }}>
          <table className="report-table">
            <thead>
              <tr>
                <th>الشهر</th>
                <th>عدد الطلاب الذين دفعوا</th>
                <th>أرباح الاشتراك لهذا الشهر</th>
                <th>نسبة سداد الطلاب (%)</th>
              </tr>
            </thead>
            <tbody>
              {monthsReport.map((month) => (
                <tr key={month.name}>
                  <td style={{ fontWeight: 600 }}>{month.name}</td>
                  <td className="monospace">{month.paidCount} طالب</td>
                  <td className="monospace" style={{ color: month.earnings > 0 ? "var(--color-teal)" : "var(--text-muted)", fontWeight: month.earnings > 0 ? 600 : 400 }}>
                    {month.earnings} ج.م
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="monospace" style={{ minWidth: "40px", display: "inline-block", textAlign: "left" }}>{month.percentage}%</span>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar-fill" 
                          style={{ 
                            width: `${month.percentage}%`,
                            background: month.percentage > 70 ? "var(--color-success)" : month.percentage > 30 ? "var(--color-teal)" : "var(--text-muted)"
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Toast Alert */}
      {toast && (
        <div className={`alert-toast ${toast.type === "success" ? "alert-success" : "alert-error"}`}>
          {toast.type === "error" && <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
