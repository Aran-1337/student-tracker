"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { AuthService } from "@/lib/services/authService";
import { TeachersService } from "@/lib/services/teachersService";
import { StudentsService } from "@/lib/services/studentsService";
import { GroupsService } from "@/lib/services/groupsService";
import { GradesService } from "@/lib/services/gradesService";
import { BillsService } from "@/lib/services/billsService";
import {
  CalendarDays,
  CalendarCheck,
  Users,
  UserCheck,
  UserX,
  DollarSign,
  TrendingUp,
  MessageCircle,
  Phone,
  Filter,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Layers,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import type { Student, Group, Grade, BookDef, Bill, AttendanceRecord } from "@/lib/types";

interface ExtendedStudent extends Omit<Student, "months"> {
  months: boolean[];
}

const ARABIC_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export default function DailyReportPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Date State
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });

  // Data States
  const [students, setStudents] = useState<ExtendedStudent[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [teacherBooks, setTeacherBooks] = useState<BookDef[]>([]);
  const [baseMonthlyPrice, setBaseMonthlyPrice] = useState(100);
  const [dailyAttendance, setDailyAttendance] = useState<AttendanceRecord[]>([]);

  // Filter States
  const [activeTab, setActiveTab] = useState<"attendance" | "finance">("attendance");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState("all");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load Base Data
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await AuthService.getSession();
        if (!session) return;
        setUserId(session.user.id);

        const [teacher, studentsData, groupsData, gradesData, billsData] = await Promise.all([
          TeachersService.getTeacherProfile(session.user.id),
          StudentsService.getStudentsByTeacherId(session.user.id),
          GroupsService.getGroupsByTeacherId(session.user.id),
          GradesService.getGradesByTeacherId(session.user.id),
          BillsService.getBillsByTeacherId(session.user.id),
        ]);

        if (teacher) {
          setBaseMonthlyPrice(Number(teacher.monthly_price) || 0);
          setTeacherBooks(teacher.books || []);
        }

        setStudents(
          (studentsData || []).map((s) => ({
            ...s,
            months: Array.isArray(s.months) && s.months.length === 12 ? s.months : Array(12).fill(false),
            received_books: Array.isArray(s.received_books) ? s.received_books : [],
          }))
        );
        setGroups(groupsData || []);
        setGrades(gradesData || []);
        setBills(billsData || []);
      } catch {
        showToast("حدث خطأ أثناء تحميل البيانات الأساسية", "error");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Fetch Attendance Records for the Selected Date
  useEffect(() => {
    async function fetchAttendance() {
      if (!userId || !selectedDate) return;
      try {
        const { data, error } = await supabase
          .from("attendance_records")
          .select("*")
          .eq("teacher_id", userId)
          .eq("session_date", selectedDate);

        if (error) throw error;
        setDailyAttendance(data || []);
      } catch (err) {
        console.error("Error fetching daily attendance:", err);
      }
    }
    fetchAttendance();
  }, [userId, selectedDate]);

  // Day calculations
  const selectedDateObj = useMemo(() => new Date(selectedDate), [selectedDate]);
  const currentDayName = useMemo(() => ARABIC_DAYS[selectedDateObj.getDay()], [selectedDateObj]);
  const currentMonthIndex = selectedDateObj.getMonth();
  const currentYear = selectedDateObj.getFullYear();

  // Helper for fast day navigation
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const setToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  // Student pricing helper
  const getStudentPrice = (student: ExtendedStudent | Student) => {
    const grp = groups.find((g) => g.id === student.group_id);
    const grd = grades.find((g) => g.id === student.grade_id);
    const base = grp?.monthly_price ?? grd?.monthly_price ?? baseMonthlyPrice;
    return Math.max(0, (base ?? baseMonthlyPrice) - (student.discount_value || 0));
  };

  // Identify groups scheduled for today
  const todaysScheduledGroups = useMemo(() => {
    return groups.filter((g) => {
      if (!g.day_of_week) return false;
      const days = g.day_of_week.split(/[,،]/).map((d) => d.trim()).filter(Boolean);
      return days.includes(currentDayName);
    });
  }, [groups, currentDayName]);

  // Expand all active groups by default
  useEffect(() => {
    const initExpand: Record<string, boolean> = {};
    groups.forEach((g) => {
      initExpand[g.id] = true;
    });
    setExpandedGroups(initExpand);
  }, [groups]);

  // Group Attendance Analysis
  const groupStats = useMemo(() => {
    return groups.map((grp) => {
      const isScheduledToday = grp.day_of_week?.split(/[,،]/).map((d) => d.trim()).includes(currentDayName);
      const groupStudents = students.filter((s) => s.group_id === grp.id);
      
      const presentStudents: ExtendedStudent[] = [];
      const absentStudents: ExtendedStudent[] = [];
      const unrecordedStudents: ExtendedStudent[] = [];

      groupStudents.forEach((student) => {
        const record = dailyAttendance.find((r) => r.student_id === student.id);
        if (record?.status === "present") {
          presentStudents.push(student);
        } else if (record?.status === "absent") {
          absentStudents.push(student);
        } else {
          unrecordedStudents.push(student);
        }
      });

      const effectiveAbsents = isScheduledToday ? [...absentStudents, ...unrecordedStudents] : absentStudents;

      return {
        group: grp,
        isScheduledToday,
        totalStudents: groupStudents.length,
        presentCount: presentStudents.length,
        absentCount: effectiveAbsents.length,
        presentStudents,
        absentStudents: effectiveAbsents,
        unrecordedCount: unrecordedStudents.length,
      };
    });
  }, [groups, students, dailyAttendance, currentDayName]);

  // Filtered Groups based on user controls
  const filteredGroupStats = useMemo(() => {
    return groupStats.filter(({ group }) => {
      if (selectedGradeFilter !== "all" && group.grade_id !== selectedGradeFilter) return false;
      if (selectedGroupFilter !== "all" && group.id !== selectedGroupFilter) return false;
      return true;
    });
  }, [groupStats, selectedGradeFilter, selectedGroupFilter]);

  // Overall Daily Summary Stats
  const dailySummary = useMemo(() => {
    const scheduledGroupsCount = todaysScheduledGroups.length;
    
    // Students belonging to today's scheduled groups
    const scheduledStudents = students.filter((s) => {
      const grp = groups.find((g) => g.id === s.group_id);
      if (!grp || !grp.day_of_week) return false;
      return grp.day_of_week.split(/[,،]/).map((d) => d.trim()).includes(currentDayName);
    });

    // Total Present today across ALL groups (including cross-group attendance)
    const presentRecords = dailyAttendance.filter((r) => r.status === "present");
    const totalPresentCount = presentRecords.length;

    // Total Absent today from scheduled groups
    const totalScheduledStudentsCount = scheduledStudents.length;
    const totalAbsentCount = Math.max(0, totalScheduledStudentsCount - totalPresentCount);
    const attendanceRate = totalScheduledStudentsCount > 0 ? Math.round((totalPresentCount / totalScheduledStudentsCount) * 100) : 0;

    // Daily Revenue Estimate (Present students × estimated per-session rate)
    const dailyIncomeEstimate = presentRecords.reduce((sum, r) => {
      const st = students.find((s) => s.id === r.student_id);
      if (!st) return sum;
      const monthlyP = getStudentPrice(st);
      return sum + Math.round(monthlyP / 8);
    }, 0);

    return {
      scheduledGroupsCount,
      totalScheduledStudentsCount,
      totalPresentCount,
      totalAbsentCount,
      attendanceRate,
      dailyIncomeEstimate,
    };
  }, [todaysScheduledGroups, students, groups, currentDayName, dailyAttendance]);

  // Overall Financial Stats (Monthly & Cumulative)
  const financialSummary = useMemo(() => {
    // Current Selected Month Subscriptions
    const studentsPaidThisMonth = students.filter((s) => s.months?.[currentMonthIndex]);
    const monthlySubscriptionRevenue = studentsPaidThisMonth.reduce((sum, s) => sum + getStudentPrice(s), 0);

    // Total Cumulative Subscription Revenue
    const totalAllSubscriptionsRevenue = students.reduce((sum, s) => {
      const paidMonthsCount = Array.isArray(s.months) ? s.months.filter(Boolean).length : 0;
      return sum + paidMonthsCount * getStudentPrice(s);
    }, 0);

    // Total Book Revenue
    let totalBookRevenue = 0;
    teacherBooks.forEach((b) => {
      const count = students.filter((s) => s.received_books?.includes(b.id)).length;
      totalBookRevenue += count * Number(b.price);
    });

    // Bills for current month
    const currentMonthBills = bills.filter(
      (b) => b.billing_month === currentMonthIndex + 1 && (b.billing_year ?? currentYear) === currentYear
    );
    const monthlyExpenses = currentMonthBills.reduce((sum, b) => sum + Number(b.amount), 0);
    const monthlyNetProfit = monthlySubscriptionRevenue - monthlyExpenses;

    // Total all bills
    const totalExpenses = bills.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalGrossRevenue = totalAllSubscriptionsRevenue + totalBookRevenue;
    const totalNetProfit = totalGrossRevenue - totalExpenses;

    return {
      studentsPaidThisMonthCount: studentsPaidThisMonth.length,
      monthlySubscriptionRevenue,
      monthlyExpenses,
      monthlyNetProfit,
      totalBookRevenue,
      totalAllSubscriptionsRevenue,
      totalGrossRevenue,
      totalExpenses,
      totalNetProfit,
    };
  }, [students, teacherBooks, bills, currentMonthIndex, currentYear]);

  // WhatsApp Message Generator
  const generateWhatsAppMessage = (studentName: string, groupName: string) => {
    const formattedDate = `${currentDayName} ${selectedDate}`;
    return encodeURIComponent(
      `السلام عليكم ورحمة الله، مرحباً ولي أمر الطالب ${studentName}، نود إبلاغكم بغياب الطالب عن موعد الحصة لمجموعة (${groupName}) اليوم ${formattedDate}. نرجو المتابعة مع الطالب لتعويض ما فاته وحرصاً على مستواه الدراسي.`
    );
  };

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  if (loading) {
    return (
      <div className="loading-wrapper" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
      
      {/* ── Sub Navigation Tabs ── */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link
            href="/dashboard/reports/daily"
            className="btn"
            style={{
              background: "rgba(59, 130, 246, 0.15)",
              color: "#3b82f6",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              fontWeight: 600,
              padding: "0.45rem 1rem",
              borderRadius: "8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.88rem",
            }}
          >
            <CalendarCheck size={16} />
            <span>التقرير اليومي والمتابعة</span>
          </Link>

          <Link
            href="/dashboard/reports"
            className="btn btn-secondary"
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.88rem",
            }}
          >
            <TrendingUp size={16} />
            <span>التقارير المالية الشاملة</span>
          </Link>

          <Link
            href="/dashboard/reports/students"
            className="btn btn-secondary"
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.88rem",
            }}
          >
            <Users size={16} />
            <span>تقارير الطلاب والواتساب</span>
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={() => setActiveTab("attendance")}
            className="btn"
            style={{
              background: activeTab === "attendance" ? "var(--color-primary, #3b82f6)" : "transparent",
              color: activeTab === "attendance" ? "#ffffff" : "var(--text-secondary)",
              border: activeTab === "attendance" ? "none" : "1px solid var(--border-color)",
              padding: "0.4rem 0.85rem",
              borderRadius: "6px",
              fontSize: "0.82rem",
            }}
          >
            غياب المجموعات اليومي
          </button>
          <button
            onClick={() => setActiveTab("finance")}
            className="btn"
            style={{
              background: activeTab === "finance" ? "var(--color-primary, #3b82f6)" : "transparent",
              color: activeTab === "finance" ? "#ffffff" : "var(--text-secondary)",
              border: activeTab === "finance" ? "none" : "1px solid var(--border-color)",
              padding: "0.4rem 0.85rem",
              borderRadius: "6px",
              fontSize: "0.82rem",
            }}
          >
            التحصيل المالي (اليومي والشهري)
          </button>
        </div>
      </div>

      {/* ── Page Header & Date Bar ── */}
      <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.25)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CalendarDays size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "0 0 0.2rem 0", color: "#ffffff" }}>
              التقرير اليومي والمتابعة
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", margin: 0 }}>
              متابعة غياب المجموعات اليومية وتحصيل الأموال ({currentDayName}، {selectedDate})
            </p>
          </div>
        </div>

        {/* Date Selector Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.25)", borderRadius: "10px", padding: "0.25rem", border: "1px solid var(--border-color)" }}>
            <button
              className="btn btn-secondary"
              onClick={() => shiftDate(1)}
              style={{ padding: "0.35rem 0.6rem", borderRadius: "6px", border: "none" }}
              title="اليوم التالي"
            >
              <ChevronRight size={16} />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input"
              style={{ padding: "0.35rem 0.65rem", fontSize: "0.85rem", border: "none", background: "transparent", color: "#ffffff" }}
            />
            <button
              className="btn btn-secondary"
              onClick={() => shiftDate(-1)}
              style={{ padding: "0.35rem 0.6rem", borderRadius: "6px", border: "none" }}
              title="اليوم السابق"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          <button
            onClick={setToday}
            className="btn btn-secondary"
            style={{ fontSize: "0.82rem", padding: "0.45rem 0.85rem", borderRadius: "8px" }}
          >
            اليوم
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        
        {/* Card 1: Active Groups */}
        <div className="glass-panel" style={{ padding: "1.1rem 1.25rem", borderRadius: "12px", border: "1px solid rgba(59, 130, 246, 0.2)", background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(30, 58, 138, 0.04))" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 500 }}>مجموعات اليوم ({currentDayName})</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Layers size={17} />
            </div>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#ffffff" }}>
            {dailySummary.scheduledGroupsCount} <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--text-muted)" }}>مجموعة</span>
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
            إجمالي طلابها: <strong style={{ color: "#ffffff" }}>{dailySummary.totalScheduledStudentsCount}</strong> طالب
          </div>
        </div>

        {/* Card 2: Total Present Today */}
        <div className="glass-panel" style={{ padding: "1.1rem 1.25rem", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.2)", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(4, 120, 87, 0.04))" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 500 }}>إجمالي الحضور اليوم</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.15)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserCheck size={17} />
            </div>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#10b981" }}>
            {dailySummary.totalPresentCount} <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--text-muted)" }}>طالب</span>
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
            نسبة الحضور: <strong style={{ color: "#34d399" }}>{dailySummary.attendanceRate}%</strong>
          </div>
        </div>

        {/* Card 3: Total Absent Today */}
        <div className="glass-panel" style={{ padding: "1.1rem 1.25rem", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.2)", background: "linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(153, 27, 27, 0.04))" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 500 }}>إجمالي الغياب اليوم</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.15)", color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserX size={17} />
            </div>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#ef4444" }}>
            {dailySummary.totalAbsentCount} <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--text-muted)" }}>طالب</span>
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
            يحتاجون للمتابعة والتنبيه
          </div>
        </div>

        {/* Card 4: Monthly Financial Collection */}
        <div className="glass-panel" style={{ padding: "1.1rem 1.25rem", borderRadius: "12px", border: "1px solid rgba(245, 158, 11, 0.2)", background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(180, 83, 9, 0.04))" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 500 }}>تحصيل شهر ({ARABIC_MONTHS[currentMonthIndex]})</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DollarSign size={17} />
            </div>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f59e0b" }}>
            {financialSummary.monthlySubscriptionRevenue.toLocaleString()} <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "var(--text-muted)" }}>ج.م</span>
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
            سدد <strong style={{ color: "#ffffff" }}>{financialSummary.studentsPaidThisMonthCount}</strong> من أصل {students.length} طالب
          </div>
        </div>

      </div>

      {/* ── TAB 1: DAILY ABSENTEES BY GROUP ── */}
      {activeTab === "attendance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          {/* Filters Bar */}
          <div className="glass-panel" style={{ padding: "0.75rem 1.25rem", borderRadius: "10px", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
              <Filter size={14} />
              <span>تصفية المجموعات:</span>
            </div>

            {/* Grade Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>المرحلة:</label>
              <select
                className="form-input"
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value)}
                style={{ padding: "0.3rem 0.6rem", fontSize: "0.82rem", width: "auto" }}
              >
                <option value="all">كل المراحل</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Group Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>المجموعة:</label>
              <select
                className="form-input"
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                style={{ padding: "0.3rem 0.6rem", fontSize: "0.82rem", width: "auto" }}
              >
                <option value="all">كل المجموعات</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div style={{ marginRight: "auto", minWidth: "200px" }}>
              <input
                type="text"
                placeholder="بحث باسم الطالب الغائب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ padding: "0.3rem 0.75rem", fontSize: "0.82rem", width: "100%" }}
              />
            </div>
          </div>

          {/* Groups List */}
          {filteredGroupStats.length === 0 ? (
            <div className="glass-panel" style={{ padding: "3rem 1.5rem", textAlign: "center", borderRadius: "12px" }}>
              <AlertCircle size={40} style={{ margin: "0 auto 1rem auto", color: "var(--text-muted)" }} />
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>لا توجد مجموعات مطابقة للفلاتر</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>يرجى تعديل خيارات التصفية أو اختيار يوم آخر.</p>
            </div>
          ) : (
            filteredGroupStats.map(({ group, isScheduledToday, totalStudents, presentCount, absentCount, absentStudents }) => {
              const isExpanded = expandedGroups[group.id] !== false;
              const grade = grades.find((g) => g.id === group.grade_id);
              
              // Filter absent students if there's a search query
              const displayAbsents = searchQuery.trim()
                ? absentStudents.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.code?.includes(searchQuery))
                : absentStudents;

              return (
                <div
                  key={group.id}
                  className="glass-panel"
                  style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: isScheduledToday ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid var(--border-color)",
                    background: isScheduledToday ? "rgba(15, 23, 42, 0.65)" : "rgba(15, 23, 42, 0.4)",
                  }}
                >
                  {/* Group Header Bar */}
                  <div
                    onClick={() => toggleGroupExpand(group.id)}
                    style={{
                      padding: "1rem 1.25rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                      cursor: "pointer",
                      background: "rgba(255, 255, 255, 0.02)",
                      borderBottom: isExpanded ? "1px solid var(--border-color)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          background: isScheduledToday ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.05)",
                          color: isScheduledToday ? "#60a5fa" : "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                        }}
                      >
                        {grade?.name ? grade.name.slice(0, 2) : "مج"}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, margin: 0 }}>{group.name}</h3>
                          {isScheduledToday ? (
                            <span style={{ fontSize: "0.7rem", background: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "0.1rem 0.45rem", borderRadius: "4px" }}>
                              موعد اليوم
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.7rem", background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", padding: "0.1rem 0.45rem", borderRadius: "4px" }}>
                              أيام أخرى ({group.day_of_week || "غير محدد"})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem", display: "flex", gap: "0.75rem" }}>
                          {grade && <span>المرحلة: {grade.name}</span>}
                          {group.time && (
                            <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                              <Clock size={12} /> {group.time}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Group Counters & Expand Icon */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.82rem" }}>
                        <span style={{ background: "rgba(16, 185, 129, 0.12)", color: "#34d399", padding: "0.25rem 0.6rem", borderRadius: "6px" }}>
                          حاضر: <strong>{presentCount}</strong>
                        </span>
                        <span style={{ background: "rgba(239, 68, 68, 0.12)", color: "#f87171", padding: "0.25rem 0.6rem", borderRadius: "6px" }}>
                          غائب: <strong>{absentCount}</strong>
                        </span>
                        <span style={{ color: "var(--text-muted)" }}>
                          من إجمالي {totalStudents}
                        </span>
                      </div>

                      <button className="btn btn-secondary" style={{ padding: "0.3rem", borderRadius: "6px" }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Group Body: Absent Students Table */}
                  {isExpanded && (
                    <div style={{ padding: "1rem" }}>
                      {displayAbsents.length === 0 ? (
                        <div style={{ padding: "1.5rem", textAlign: "center", color: "#34d399", background: "rgba(16, 185, 129, 0.05)", borderRadius: "8px" }}>
                          <CheckCircle2 size={24} style={{ margin: "0 auto 0.4rem auto" }} />
                          <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 500 }}>
                            {isScheduledToday ? "لا يوجد غياب مسجل في هذه المجموعة اليوم! ممتاز 🎉" : "لا يوجد غياب مسجل لهذه المجموعة"}
                          </p>
                        </div>
                      ) : (
                        <div className="report-table-wrapper">
                          <table className="report-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "right", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                                <th style={{ padding: "0.6rem" }}>#</th>
                                <th style={{ padding: "0.6rem" }}>كود الطالب</th>
                                <th style={{ padding: "0.6rem" }}>اسم الطالب الغائب</th>
                                <th style={{ padding: "0.6rem" }}>هاتف ولي الأمر</th>
                                <th style={{ padding: "0.6rem", textAlign: "center" }}>إجراءات المتابعة والتنبيه</th>
                              </tr>
                            </thead>
                            <tbody>
                              {displayAbsents.map((student, idx) => {
                                const waMsg = generateWhatsAppMessage(student.name, group.name);
                                const parentPhone = student.parent_phone?.replace(/[^0-9]/g, "");
                                const waUrl = parentPhone ? `https://wa.me/2${parentPhone.startsWith("0") ? parentPhone : "0" + parentPhone}?text=${waMsg}` : null;

                                return (
                                  <tr
                                    key={student.id}
                                    style={{
                                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                                      fontSize: "0.85rem",
                                      background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                                    }}
                                  >
                                    <td style={{ padding: "0.65rem", color: "var(--text-muted)" }}>{idx + 1}</td>
                                    <td style={{ padding: "0.65rem" }}>
                                      <span className="monospace" style={{ background: "rgba(255,255,255,0.06)", padding: "0.15rem 0.45rem", borderRadius: "4px", fontSize: "0.8rem" }}>
                                        {student.code || "---"}
                                      </span>
                                    </td>
                                    <td style={{ padding: "0.65rem", fontWeight: 600, color: "#ffffff" }}>
                                      {student.name}
                                    </td>
                                    <td style={{ padding: "0.65rem", color: "var(--text-secondary)" }}>
                                      {student.parent_phone ? (
                                        <a href={`tel:${student.parent_phone}`} style={{ color: "var(--text-secondary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                          <Phone size={12} /> {student.parent_phone}
                                        </a>
                                      ) : "---"}
                                    </td>
                                    <td style={{ padding: "0.65rem", textAlign: "center" }}>
                                      <div style={{ display: "inline-flex", gap: "0.5rem", justifyContent: "center" }}>
                                        {waUrl ? (
                                          <a
                                            href={waUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn"
                                            style={{
                                              background: "#25D366",
                                              color: "#ffffff",
                                              border: "none",
                                              padding: "0.3rem 0.65rem",
                                              borderRadius: "6px",
                                              fontSize: "0.78rem",
                                              display: "inline-flex",
                                              alignItems: "center",
                                              gap: "0.35rem",
                                              textDecoration: "none",
                                              fontWeight: 500,
                                            }}
                                            title="إرسال رسالة غياب بالواتساب"
                                          >
                                            <MessageCircle size={14} />
                                            <span>واتساب ولي الأمر</span>
                                          </a>
                                        ) : (
                                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>لا يوجد هاتف</span>
                                        )}

                                        {parentPhone && (
                                          <a
                                            href={`tel:${parentPhone}`}
                                            className="btn btn-secondary"
                                            style={{ padding: "0.3rem 0.55rem", borderRadius: "6px", fontSize: "0.78rem" }}
                                            title="اتصال هاتف ولي الأمر"
                                          >
                                            <Phone size={13} />
                                          </a>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── TAB 2: FINANCIAL BREAKDOWN (DAILY & MONTHLY) ── */}
      {activeTab === "finance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* Section 1: Financial Quick Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            
            {/* Daily Estimated Revenue */}
            <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: "#34d399" }}>
                <Clock size={18} />
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>إيراد حصص اليوم التقريبي</h3>
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#10b981", marginBottom: "0.4rem" }}>
                {dailySummary.dailyIncomeEstimate.toLocaleString()} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>ج.م</span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
                محسوب بناءً على حضور <strong>{dailySummary.totalPresentCount}</strong> طالب اليوم في الحصص المقررة.
              </p>
            </div>

            {/* Current Month Subscriptions */}
            <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(59, 130, 246, 0.25)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: "#60a5fa" }}>
                <DollarSign size={18} />
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>تحصيل اشتراكات شهر {ARABIC_MONTHS[currentMonthIndex]}</h3>
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#3b82f6", marginBottom: "0.4rem" }}>
                {financialSummary.monthlySubscriptionRevenue.toLocaleString()} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>ج.م</span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
                <span>الطلاب المسددين: {financialSummary.studentsPaidThisMonthCount}</span>
                <span>المتبقي: {students.length - financialSummary.studentsPaidThisMonthCount} طالب</span>
              </div>
            </div>

            {/* Total Books Revenue */}
            <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(168, 85, 247, 0.25)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: "#c084fc" }}>
                <BookOpen size={18} />
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>إجمالي مبيعات الملازم والكتب</h3>
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#a855f7", marginBottom: "0.4rem" }}>
                {financialSummary.totalBookRevenue.toLocaleString()} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>ج.م</span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
                مجموع الملازم والكتب المستلمة من قبل الطلاب.
              </p>
            </div>

          </div>

          {/* Section 2: Comprehensive Monthly & Net Profit Summary Table */}
          <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.2rem 0" }}>
                  ملخص الأرباح والمصروفات لشهر {ARABIC_MONTHS[currentMonthIndex]} {currentYear}
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                  توزيع الإيرادات الشهرية مقابل المصروفات والفواتير
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "0.5rem" }}>
              
              <div style={{ padding: "1rem", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>إيراد اشتراكات الشهر</span>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#34d399", marginTop: "0.3rem" }}>
                  +{financialSummary.monthlySubscriptionRevenue.toLocaleString()} ج.م
                </div>
              </div>

              <div style={{ padding: "1rem", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>مصروفات وفواتير الشهر</span>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#f87171", marginTop: "0.3rem" }}>
                  -{financialSummary.monthlyExpenses.toLocaleString()} ج.م
                </div>
              </div>

              <div style={{ padding: "1rem", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>صافي أرباح الشهر</span>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: financialSummary.monthlyNetProfit >= 0 ? "#60a5fa" : "#ef4444", marginTop: "0.3rem" }}>
                  {financialSummary.monthlyNetProfit.toLocaleString()} ج.م
                </div>
              </div>

              <div style={{ padding: "1rem", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>صافي الأرباح التراكمية الكلية</span>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fbbf24", marginTop: "0.3rem" }}>
                  {financialSummary.totalNetProfit.toLocaleString()} ج.م
                </div>
              </div>

            </div>
          </div>

          {/* Section 3: Group by Group Financial Collection */}
          <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "12px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.85rem" }}>
              تحصيل المجموعات لشهر {ARABIC_MONTHS[currentMonthIndex]}
            </h3>
            
            <div className="report-table-wrapper">
              <table className="report-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "right", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    <th style={{ padding: "0.6rem" }}>اسم المجموعة</th>
                    <th style={{ padding: "0.6rem" }}>المرحلة الدراسية</th>
                    <th style={{ padding: "0.6rem" }}>سعر الاشتراك</th>
                    <th style={{ padding: "0.6rem" }}>عدد الطلاب</th>
                    <th style={{ padding: "0.6rem" }}>المسددين هذا الشهر</th>
                    <th style={{ padding: "0.6rem" }}>نسبة التحصيل</th>
                    <th style={{ padding: "0.6rem", textAlign: "left" }}>إجمالي المحصل</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((grp, idx) => {
                    const grade = grades.find((g) => g.id === grp.grade_id);
                    const groupStudents = students.filter((s) => s.group_id === grp.id);
                    const paidStudents = groupStudents.filter((s) => s.months?.[currentMonthIndex]);
                    const collected = paidStudents.reduce((sum, s) => sum + getStudentPrice(s), 0);
                    const rate = groupStudents.length > 0 ? Math.round((paidStudents.length / groupStudents.length) * 100) : 0;
                    const price = grp.monthly_price ?? grade?.monthly_price ?? baseMonthlyPrice;

                    return (
                      <tr
                        key={grp.id}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          fontSize: "0.85rem",
                          background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                        }}
                      >
                        <td style={{ padding: "0.65rem", fontWeight: 600, color: "#ffffff" }}>{grp.name}</td>
                        <td style={{ padding: "0.65rem", color: "var(--text-secondary)" }}>{grade?.name || "عام"}</td>
                        <td style={{ padding: "0.65rem" }} className="monospace">{price} ج.م</td>
                        <td style={{ padding: "0.65rem" }}>{groupStudents.length}</td>
                        <td style={{ padding: "0.65rem", color: "#34d399", fontWeight: 600 }}>{paidStudents.length}</td>
                        <td style={{ padding: "0.65rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden", minWidth: "50px" }}>
                              <div style={{ width: `${rate}%`, height: "100%", background: rate >= 80 ? "#10b981" : rate >= 50 ? "#3b82f6" : "#f59e0b" }} />
                            </div>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{rate}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "0.65rem", textAlign: "left", fontWeight: 700, color: "#34d399" }} className="monospace">
                          {collected.toLocaleString()} ج.م
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── Toast Alert ── */}
      {toast && (
        <div className={`alert-toast ${toast.type === "success" ? "alert-success" : "alert-error"}`} style={{ position: "fixed", bottom: "2rem", left: "2rem", zIndex: 1000 }}>
          {toast.type === "error" && <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}
