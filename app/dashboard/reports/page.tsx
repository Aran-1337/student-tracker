"use client";

import { useState, useEffect } from "react";
import { AuthService } from "@/lib/services/authService";
import { TeachersService } from "@/lib/services/teachersService";
import { StudentsService } from "@/lib/services/studentsService";
import { BillsService } from "@/lib/services/billsService";
import { GroupsService } from "@/lib/services/groupsService";
import { SubTeachersService } from "@/lib/services/subTeachersService";
import { 
  TrendingUp, 
  DollarSign, 
  BookOpen, 
  Calendar, 
  Users,
  CheckCircle2,
  AlertCircle,
  Receipt
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  group_id: string | null;
  months: boolean[];
  received_books: string[];
}

interface Bill {
  id: string;
  title: string;
  amount: number;
  category: "إيجار" | "رواتب سكرتارية" | "أخرى";
  billing_month: number;
}

const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  
  // Pricing settings from teachers table
  const [monthlyPrice, setMonthlyPrice] = useState(100);
  const [teacherBooks, setTeacherBooks] = useState<any[]>([]);

  // Center Mode settings
  const [hasCenterMode, setHasCenterMode] = useState(false);
  const [subTeachers, setSubTeachers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");

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

        // 1. Fetch teacher settings & Center Mode Check
        const teacher = await TeachersService.getTeacherProfile(session.user.id);

        if (teacher) {
          setMonthlyPrice(Number(teacher.monthly_price) || 0);
          setTeacherBooks(teacher.books || []);
          
          const centerMode = teacher.is_center_mode || false;
          setHasCenterMode(centerMode);

          if (centerMode) {
            const subs = await SubTeachersService.getSubTeachersByCenterId(session.user.id);
            setSubTeachers(subs || []);
            
            const grps = await GroupsService.getGroupsByTeacherId(session.user.id);
            setGroups(grps || []);
          }
        }

        // 3. Fetch students
        const studentsData = await StudentsService.getStudentsByTeacherId(session.user.id);

        const validatedStudents = (studentsData || []).map(student => ({
          ...student,
          months: Array.isArray(student.months) && student.months.length === 12
            ? student.months 
            : Array(12).fill(false),
          received_books: Array.isArray(student.received_books) ? student.received_books : []
        }));
        setStudents(validatedStudents);

        // 4. Fetch bills
        const billsData = await BillsService.getBillsByTeacherId(session.user.id);
        setBills(billsData || []);

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

  // Apply Teacher Filter
  const filteredStudents = selectedTeacherId === "all" 
    ? students 
    : students.filter(s => {
        const studentGroup = groups.find(g => g.id === s.group_id);
        return studentGroup && studentGroup.sub_teacher_id === selectedTeacherId;
      });

  const totalFilteredStudents = filteredStudents.length;

  // Calculations
  // 1. Subscriptions
  const paidThisMonthCount = filteredStudents.filter(s => s.months[currentMonthIndex] === true).length;
  const currentMonthEarnings = paidThisMonthCount * monthlyPrice;

  const totalPaidMonthsCount = filteredStudents.reduce((acc, s) => {
    return acc + s.months.filter(m => m === true).length;
  }, 0);
  const totalSubscriptionEarnings = totalPaidMonthsCount * monthlyPrice;

  // 2. Books
  // 2. Books
  let totalBookEarnings = 0;
  const booksStats = teacherBooks.map(book => {
    const count = filteredStudents.filter(s => s.received_books && s.received_books.includes(book.id)).length;
    const earnings = count * book.price;
    totalBookEarnings += earnings;
    return { ...book, count, earnings };
  });

  // 3. Gross Revenue
  const totalGrossEarnings = totalSubscriptionEarnings + totalBookEarnings;

  // 4. Expenses / Bills
  const totalExpenses = bills.reduce((sum, b) => sum + Number(b.amount), 0);

  // 5. Net Profit
  const totalNetProfit = totalGrossEarnings - totalExpenses;

  // Month-by-month statistics (Subscriptions revenue vs Month expenses)
  const monthsReport = arabicMonths.map((name, index) => {
    const paidCount = filteredStudents.filter(s => s.months[index] === true).length;
    const subscriptionEarnings = paidCount * monthlyPrice;

    // Filter bills for this specific month (1-indexed in database)
    const monthBills = bills.filter(b => b.billing_month === index + 1);
    const monthExpenses = monthBills.reduce((sum, b) => sum + Number(b.amount), 0);

    const netProfit = subscriptionEarnings - monthExpenses;
    const percentage = totalFilteredStudents > 0 ? Math.round((paidCount / totalFilteredStudents) * 100) : 0;

    return { name, paidCount, subscriptionEarnings, monthExpenses, netProfit, percentage };
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
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>التقارير المالية</h1>
          <p style={{ color: "var(--text-secondary)" }}>تحليلات الإيرادات الكلية، المصروفات، وصافي الأرباح</p>
        </div>
        {hasCenterMode && (
          <div style={{ minWidth: "250px" }}>
            <label className="form-label" style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>فلتر حسب المعلم:</label>
            <select
              className="form-input"
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              style={{ padding: "0.5rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)" }}
            >
              <option value="all">كل معلمين السنتر</option>
              {subTeachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Earnings Summary Cards (4 Cards Grid) */}
      <section className="stats-grid" style={{ marginBottom: "2.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {/* Net Profit Card */}
        <div className="stat-card glass-panel report-card-green" style={{ borderLeft: "4px solid #10b981" }}>
          <div className="stat-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label" style={{ color: "#a7f3d0" }}>صافي الأرباح الكلي</span>
            <span className="stat-value monospace" style={{ fontSize: "1.8rem", fontWeight: 900, color: "#10b981" }}>{totalNetProfit} ج.م</span>
          </div>
        </div>

        {/* Gross Revenue Card */}
        <div className="stat-card glass-panel" style={{ borderLeft: "4px solid var(--color-teal)" }}>
          <div className="stat-icon-wrapper" style={{ background: "rgba(20, 184, 166, 0.15)", color: "var(--color-teal)", border: "1px solid rgba(20, 184, 166, 0.2)" }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">إجمالي الإيرادات الكلي</span>
            <span className="stat-value monospace">{totalGrossEarnings} ج.م</span>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="stat-card glass-panel" style={{ borderLeft: "4px solid #ef4444" }}>
          <div className="stat-icon-wrapper" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
            <Receipt size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label" style={{ color: "#fca5a5" }}>إجمالي المصروفات (الفواتير)</span>
            <span className="stat-value monospace" style={{ color: "#f87171" }}>{totalExpenses} ج.م</span>
          </div>
        </div>

        {/* Book Earnings Card */}
        <div className="stat-card glass-panel" style={{ borderLeft: "4px solid var(--color-amber)" }}>
          <div className="stat-icon-wrapper" style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--color-amber)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">أرباح الكتب الكلية</span>
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
                <p style={{ fontWeight: 600 }}>أرباح الاشتراك في الشهر الحالي ({arabicMonths[currentMonthIndex]})</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{paidThisMonthCount} طالب دفعوا الاشتراك</p>
              </div>
              <span className="monospace" style={{ fontSize: "1.25rem", fontWeight: 700 }}>{currentMonthEarnings} ج.م</span>
            </div>
            <div className="flex-between" style={{ paddingBottom: "0.5rem" }}>
              <div>
                <p style={{ fontWeight: 600 }}>إجمالي إيراد الاشتراكات</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>مجموع كل عمليات دفع الشهور المسجلة لجميع الطلاب</p>
              </div>
              <span className="monospace" style={{ fontSize: "1.25rem", fontWeight: 700 }}>{totalSubscriptionEarnings} ج.م</span>
            </div>
          </div>
        </section>

        {/* Expenses & Books Split Card */}
        <section className="glass-panel panel-content">
          <h2 className="panel-title">
            <Receipt size={18} style={{ color: "var(--color-amber)" }} />
            <span>تفاصيل الفواتير والكتب</span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1rem" }}>
            <div className="flex-between" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
              <div>
                <p style={{ fontWeight: 600 }}>إجمالي الفواتير والمصروفات</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>تشمل الإيجارات ورواتب السكرتارية والمصروفات الأخرى</p>
              </div>
              <span className="monospace" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f87171" }}>-{totalExpenses} ج.م</span>
            </div>
            {booksStats.map((book, idx) => (
              <div key={book.id} className="flex-between" style={{ borderBottom: idx !== booksStats.length - 1 ? "1px solid var(--border-color)" : "none", paddingBottom: idx !== booksStats.length - 1 ? "1rem" : "0.5rem" }}>
                <div>
                  <p style={{ fontWeight: 600 }}>إجمالي أرباح {book.name}</p>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{book.count} طالب استلموا الكتاب بسعر {book.price} ج.م</p>
                </div>
                <span className="monospace" style={{ fontSize: "1.25rem", fontWeight: 700 }}>{book.earnings} ج.م</span>
              </div>
            ))}
            {booksStats.length === 0 && (
              <div className="flex-between" style={{ paddingBottom: "0.5rem" }}>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--text-muted)" }}>لا يوجد كتب مضافة</p>
                </div>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Month-by-Month Table Breakdown */}
      <section className="glass-panel panel-content" style={{ marginTop: "2rem" }}>
        <h2 className="panel-title">
          <Calendar size={18} style={{ color: "var(--color-info)" }} />
          <span>التقرير المالي التفصيلي للشهور الـ 12</span>
        </h2>
        
        <div className="table-container" style={{ marginTop: "1rem" }}>
          <table className="report-table">
            <thead>
              <tr>
                <th>الشهر</th>
                <th>عدد المدفوعات</th>
                <th>إيراد الاشتراك</th>
                <th>المصروفات والفواتير</th>
                <th>صافي الربح</th>
                <th>نسبة السداد للطلاب (%)</th>
              </tr>
            </thead>
            <tbody>
              {monthsReport.map((month) => (
                <tr key={month.name}>
                  <td style={{ fontWeight: 600 }}>{month.name}</td>
                  <td className="monospace">{month.paidCount} طالب</td>
                  <td className="monospace" style={{ color: month.subscriptionEarnings > 0 ? "var(--color-teal)" : "var(--text-muted)", fontWeight: month.subscriptionEarnings > 0 ? 600 : 400 }}>
                    {month.subscriptionEarnings} ج.م
                  </td>
                  <td className="monospace" style={{ color: month.monthExpenses > 0 ? "#f87171" : "var(--text-muted)" }}>
                    {month.monthExpenses > 0 ? `-${month.monthExpenses}` : "0"} ج.م
                  </td>
                  <td className="monospace" style={{ 
                    color: month.netProfit > 0 ? "#10b981" : month.netProfit < 0 ? "#ef4444" : "var(--text-muted)", 
                    fontWeight: month.netProfit !== 0 ? 700 : 400 
                  }}>
                    {month.netProfit} ج.م
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
