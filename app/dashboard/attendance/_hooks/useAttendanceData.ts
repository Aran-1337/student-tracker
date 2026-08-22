"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Group, Student, Grade, AttendanceRecord } from "@/lib/types";
import { GroupsService } from "@/lib/services/groupsService";
import { StudentsService } from "@/lib/services/studentsService";
import { GradesService } from "@/lib/services/gradesService";
import { AttendanceService } from "@/lib/services/attendanceService";
import { OfflineCache, AttendanceQueue } from "@/lib/offlineQueue";

function getSaturday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 6 ? 0 : day + 1; 
  date.setDate(date.getDate() - diff);
  date.setHours(0,0,0,0);
  return date;
}

function getLocalDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useAttendanceData() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  
  const [monthlyAttendance, setMonthlyAttendance] = useState<AttendanceRecord[]>([]);
  const [monthlyDates, setMonthlyDates] = useState<string[]>([]);
  
  const [selectedGradeId, setSelectedGradeId] = useState("all");
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(getSaturday(new Date()));

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setUserId(session.user.id);
        
        const cachedGroups = OfflineCache.loadGroups();
        const cachedStudents = OfflineCache.loadStudents();
        const cachedGrades = OfflineCache.loadGrades();
        if (cachedStudents?.length > 0) {
          setGroups(cachedGroups);
          setStudents(cachedStudents);
          setGrades(cachedGrades);
          setLoading(false);
        }

        if (navigator.onLine) {
          const [grpData, stData, grdData] = await Promise.all([
            GroupsService.getGroupsByTeacherId(session.user.id),
            StudentsService.getStudentsByTeacherId(session.user.id),
            GradesService.getGradesByTeacherId(session.user.id),
          ]);
          setGroups(grpData);
          setStudents(stData);
          setGrades(grdData);
          OfflineCache.saveStudents(stData);
          OfflineCache.saveGroups(grpData);
          OfflineCache.saveGrades(grdData);
          OfflineCache.setLastSync();
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const arabicDays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  
  const getGroupDays = () => {
    if (selectedGroupId === "all") return [];
    const g = groups.find(g => g.id === selectedGroupId);
    if (!g || !g.day_of_week) return [];
    return g.day_of_week.split(/[,،]/).map(d => d.trim()).filter(Boolean);
  };

  const getDatesForWeek = () => {
    const activeDays = getGroupDays();
    if (activeDays.length === 0) return [];
    
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(selectedWeekStart);
      d.setDate(d.getDate() + i);
      const dayName = arabicDays[d.getDay()];
      if (activeDays.includes(dayName)) {
        dates.push(getLocalDateString(d));
      }
    }
    return dates.sort((a, b) => a.localeCompare(b)); // Ascending so earliest date is first (rendered on the right in RTL)
  };

  const getDatesForMonth = () => {
    const activeDays = getGroupDays();
    if (activeDays.length === 0) return [];
    
    const dates: string[] = [];
    const month = selectedWeekStart.getMonth();
    const year = selectedWeekStart.getFullYear();
    const d = new Date(year, month, 1);
    while (d.getMonth() === month) {
      const dayName = arabicDays[d.getDay()];
      if (activeDays.includes(dayName)) {
        dates.push(getLocalDateString(d));
      }
      d.setDate(d.getDate() + 1);
    }
    return dates.sort((a, b) => a.localeCompare(b));
  };

  const allDates = getDatesForWeek();
  const allMonthlyDates = getDatesForMonth();

  const loadAttendance = async () => {
    if (!userId || selectedGroupId === "all") {
      setAttendance([]);
      setMonthlyAttendance([]);
      return;
    }
    
    try {
      const startDate = getLocalDateString(selectedWeekStart);
      const endDate = getLocalDateString(new Date(selectedWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000));
      
      const monthStartDate = getLocalDateString(new Date(selectedWeekStart.getFullYear(), selectedWeekStart.getMonth(), 1));
      const monthEndDate = getLocalDateString(new Date(selectedWeekStart.getFullYear(), selectedWeekStart.getMonth() + 1, 0));

      const [weekRecords, monthRecords] = await Promise.all([
        AttendanceService.getAttendanceRecordsByGroupAndDateRange(selectedGroupId, startDate, endDate),
        AttendanceService.getAttendanceRecordsByGroupAndDateRange(selectedGroupId, monthStartDate, monthEndDate)
      ]);
      
      const queued = AttendanceQueue.getAll().filter(r => r.group_id === selectedGroupId);
      
      const mergedWeek = [...weekRecords];
      const mergedMonth = [...monthRecords];

      for (const q of queued) {
        if (q.session_date >= startDate && q.session_date <= endDate) {
          const exists = mergedWeek.some(r => r.student_id === q.student_id && r.session_date === q.session_date);
          if (!exists) {
            mergedWeek.push({ ...q, id: `offline-${q.student_id}-${q.session_date}`, created_at: q._queuedAt } as AttendanceRecord);
          }
        }
        if (q.session_date >= monthStartDate && q.session_date <= monthEndDate) {
          const exists = mergedMonth.some(r => r.student_id === q.student_id && r.session_date === q.session_date);
          if (!exists) {
            mergedMonth.push({ ...q, id: `offline-month-${q.student_id}-${q.session_date}`, created_at: q._queuedAt } as AttendanceRecord);
          }
        }
      }

      const oneHourMs = 60 * 60 * 1000;
      const nowMs = Date.now();
      const recordsToInsert: Omit<AttendanceRecord, "id" | "created_at">[] = [];
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      for (const date of allDates) {
        const dateRecords = mergedWeek.filter(r => r.session_date === date && r.created_at);
        if (dateRecords.length === 0) continue;
        
        const earliestTime = Math.min(...dateRecords.map(r => new Date(r.created_at!).getTime()));
        if (nowMs - earliestTime > oneHourMs) {
          for (const student of students) {
            if (student.group_id !== selectedGroupId) continue;
            if (!uuidRegex.test(student.id)) continue;
            
            if (student.created_at) {
              const studentCreatedDate = student.created_at.split("T")[0];
              if (date < studentCreatedDate) continue;
            }

            const hasRecord = mergedWeek.some(r => r.student_id === student.id && r.session_date === date);
            if (!hasRecord) {
              const [y, m] = date.split('-');
              const absentRecord = {
                teacher_id: userId,
                student_id: student.id,
                group_id: student.group_id,
                session_date: date,
                month: parseInt(m, 10),
                year: parseInt(y, 10),
                status: "absent",
              };
              recordsToInsert.push(absentRecord as any);
              mergedWeek.push({
                ...absentRecord,
                id: `auto-${student.id}-${date}`,
                created_at: new Date().toISOString(),
              } as AttendanceRecord);
            }
          }
        }
      }

      if (recordsToInsert.length > 0 && navigator.onLine) {
        try {
          await AttendanceService.addAttendanceRecords(recordsToInsert);
        } catch (e) {}
      }

      setAttendance(mergedWeek);
      setMonthlyAttendance(mergedMonth);
      setMonthlyDates(allMonthlyDates);
    } catch (e) {
    }
  };

  useEffect(() => {
    loadAttendance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, selectedGroupId, selectedWeekStart, students.length]);

  const filteredStudents = students.filter((s) => {
    const effectiveGradeId = s.grade_id || groups.find((g) => g.id === s.group_id)?.grade_id;
    if (selectedGradeId !== "all" && effectiveGradeId !== selectedGradeId) return false;
    if (selectedGroupId !== "all" && s.group_id !== selectedGroupId) return false;
    return true;
  });

  return {
    loading, userId, groups, students, grades,
    attendance, setAttendance,
    monthlyAttendance, monthlyDates,
    selectedGradeId, setSelectedGradeId,
    selectedGroupId, setSelectedGroupId,
    selectedWeekStart, setSelectedWeekStart,
    filteredStudents,
    allDates,
    loadAttendance,
  };
}
