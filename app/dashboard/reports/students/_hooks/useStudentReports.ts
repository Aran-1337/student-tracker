"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { TeachersService } from "@/lib/services/teachersService";
import { StudentsService } from "@/lib/services/studentsService";
import { GroupsService } from "@/lib/services/groupsService";
import { GradesService } from "@/lib/services/gradesService";
import { AttendanceService } from "@/lib/services/attendanceService";
import { Student, Group, Grade, AttendanceRecord } from "@/lib/types";

const DEFAULT_TEMPLATE =
  "مرحباً ولي أمر الطالب [اسم_الطالب]،\nنود إعلامكم بتقرير الطالب كالتالي:\nأيام الحضور: [الحضور]\nأيام الغياب: [الغياب]\nحالة الدفع: [حالة_الدفع]\nشكراً لتعاونكم.";

export const PAGE_SIZE = 20;

export function useStudentReports() {
  const now = new Date();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [whatsappTemplate, setWhatsappTemplate] = useState(DEFAULT_TEMPLATE);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGradeId, setFilterGradeId] = useState("all");
  const [filterGroupId, setFilterGroupId] = useState("all");
  const [filterPayment, setFilterPayment] = useState<"all" | "paid" | "unpaid">("all");
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [page, setPage] = useState(1);

  const monthNum = selectedMonthIndex + 1;

  // Re-fetch attendance when month/year changes
  useEffect(() => {
    async function fetchAttendance() {
      try {
        const data = await AttendanceService.getAttendanceRecords(monthNum, selectedYear);
        setAttendanceRecords(data || []);
      } catch {
        // silent — main load already shows error
      }
    }
    if (!loading) fetchAttendance();
  }, [monthNum, selectedYear]);

  // Initial load
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const [teacher, studentsData, groupsData, gradesData, attendanceData] = await Promise.all([
          TeachersService.getTeacherProfile(session.user.id),
          StudentsService.getStudentsByTeacherId(session.user.id),
          GroupsService.getGroupsByTeacherId(session.user.id),
          GradesService.getGradesByTeacherId(session.user.id),
          AttendanceService.getAttendanceRecords(monthNum, selectedYear),
        ]);

        setWhatsappTemplate(teacher?.whatsapp_template || DEFAULT_TEMPLATE);
        setStudents(studentsData || []);
        setGroups(groupsData || []);
        setGrades(gradesData || []);
        setAttendanceRecords(attendanceData || []);
      } catch {
        setToast({ message: "حدث خطأ أثناء تحميل البيانات.", type: "error" });
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attendance lookup map — O(1) per student
  const attendanceMap = useMemo(() => {
    const map = new Map<string, { present: number; absent: number }>();
    for (const r of attendanceRecords) {
      const cur = map.get(r.student_id) ?? { present: 0, absent: 0 };
      if (r.status === "present") cur.present++;
      else cur.absent++;
      map.set(r.student_id, cur);
    }
    return map;
  }, [attendanceRecords]);

  const getStudentAttendance = (studentId: string) =>
    attendanceMap.get(studentId) ?? { present: 0, absent: 0 };

  // Filtered students
  const filteredStudents = useMemo(() => {
    let list = students;

    if (filterGradeId !== "all")
      list = list.filter((s) => s.grade_id === filterGradeId);

    if (filterGroupId !== "all")
      list = list.filter((s) => s.group_id === filterGroupId);

    if (filterPayment === "paid")
      list = list.filter((s) => s.months?.[selectedMonthIndex] === true);
    else if (filterPayment === "unpaid")
      list = list.filter((s) => s.months?.[selectedMonthIndex] !== true);

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.code || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [students, filterGradeId, filterGroupId, filterPayment, searchQuery, selectedMonthIndex]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [filteredStudents]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const pagedStudents = filteredStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const filteredGroups = useMemo(
    () => (filterGradeId !== "all" ? groups.filter((g) => g.grade_id === filterGradeId) : groups),
    [groups, filterGradeId]
  );

  // Stats
  const stats = useMemo(() => ({
    total: filteredStudents.length,
    paid: filteredStudents.filter((s) => s.months?.[selectedMonthIndex] === true).length,
    unpaid: filteredStudents.filter((s) => s.months?.[selectedMonthIndex] !== true).length,
    withPhone: filteredStudents.filter((s) => s.parent_phone).length,
  }), [filteredStudents, selectedMonthIndex]);

  // WhatsApp helpers
  const buildMessage = (student: Student) => {
    const att = getStudentAttendance(student.id);
    const isPaid = student.months?.[selectedMonthIndex] === true;
    return whatsappTemplate
      .replace(/\[اسم_الطالب\]/g, student.name)
      .replace(/\[الحضور\]/g, String(att.present))
      .replace(/\[الغياب\]/g, String(att.absent))
      .replace(/\[حالة_الدفع\]/g, isPaid ? "تم الدفع ✅" : "لم يتم الدفع بعد ❌");
  };

  const formatPhone = (raw: string) => {
    let p = raw.replace(/\D/g, "");
    if (p.startsWith("0")) p = "2" + p;
    if (!p.startsWith("2")) p = "20" + p;
    return p;
  };

  const sendWhatsApp = (student: Student) => {
    if (!student.parent_phone) {
      setToast({ message: "لا يوجد رقم هاتف لولي أمر هذا الطالب.", type: "error" });
      return;
    }
    const url = `https://wa.me/${formatPhone(student.parent_phone)}?text=${encodeURIComponent(buildMessage(student))}`;
    window.open(url, "_blank");
  };

  // Bulk WhatsApp — opens one tab per student with a small delay
  const sendAllWhatsApp = () => {
    const list = filteredStudents.filter((s) => s.parent_phone);
    if (list.length === 0) {
      setToast({ message: "لا يوجد طلاب لديهم أرقام هواتف أولياء أمور.", type: "error" });
      return;
    }
    list.forEach((student, i) => {
      setTimeout(() => {
        const url = `https://wa.me/${formatPhone(student.parent_phone!)}?text=${encodeURIComponent(buildMessage(student))}`;
        window.open(url, "_blank");
      }, i * 600);
    });
    setToast({ message: `جاري فتح ${list.length} رسالة واتساب...`, type: "success" });
  };

  return {
    loading,
    students,
    groups,
    grades,
    filteredStudents,
    pagedStudents,
    filteredGroups,
    stats,
    attendanceMap,
    getStudentAttendance,
    whatsappTemplate,
    setWhatsappTemplate,
    toast,
    setToast,
    // filters
    searchQuery, setSearchQuery,
    filterGradeId, setFilterGradeId,
    filterGroupId, setFilterGroupId,
    filterPayment, setFilterPayment,
    selectedMonthIndex, setSelectedMonthIndex,
    selectedYear, setSelectedYear,
    // pagination
    page, setPage, totalPages,
    // actions
    sendWhatsApp,
    sendAllWhatsApp,
  };
}
