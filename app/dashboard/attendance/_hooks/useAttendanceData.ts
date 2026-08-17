
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Group, Student, Grade, AttendanceRecord } from "@/lib/types";
import { GroupsService } from "@/lib/services/groupsService";
import { StudentsService } from "@/lib/services/studentsService";
import { GradesService } from "@/lib/services/gradesService";
import { AttendanceService } from "@/lib/services/attendanceService";
import { OfflineCache, AttendanceQueue } from "@/lib/offlineQueue";

export function useAttendanceData() {
  const now = new Date();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState("all");
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [manualDates, setManualDates] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setUserId(session.user.id);
        
        // Optimistic UI: load from cache immediately
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
        // Fallback to cache if already done, else handled by initial load
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const loadAttendance = async () => {
    if (!userId) return;
    try {
      const records = await AttendanceService.getAttendanceRecords(selectedMonth, selectedYear);
      // merge offline queue records for the same month/year
      const queued = AttendanceQueue.getAll().filter(
        r => r.month === selectedMonth && r.year === selectedYear
      );
      const merged = [...records];
      for (const q of queued) {
        const exists = merged.some(
          r => r.student_id === q.student_id && r.session_date === q.session_date
        );
        if (!exists) {
          merged.push({ ...q, id: `offline-${q.student_id}-${q.session_date}`, created_at: q._queuedAt } as AttendanceRecord);
        }
      }
      // Auto-absent logic
      const oneHourMs = 60 * 60 * 1000;
      const nowMs = Date.now();
      const recordsToInsert: Omit<AttendanceRecord, "id" | "created_at">[] = [];
      const dates = Array.from(new Set(merged.map(r => r.session_date)));

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      for (const date of dates) {
        const dateRecords = merged.filter(r => r.session_date === date && r.created_at);
        if (dateRecords.length === 0) continue;
        
        const earliestTime = Math.min(...dateRecords.map(r => new Date(r.created_at!).getTime()));
        if (nowMs - earliestTime > oneHourMs) {
          for (const student of students) {
            if (!uuidRegex.test(student.id)) continue;
            const hasRecord = merged.some(r => r.student_id === student.id && r.session_date === date);
            if (!hasRecord) {
              recordsToInsert.push({
                teacher_id: userId,
                student_id: student.id,
                group_id: student.group_id,
                session_date: date,
                month: selectedMonth,
                year: selectedYear,
                status: "absent",
              });
              // Optimistically add to merged so we don't insert again
              merged.push({
                id: `auto-${student.id}-${date}`,
                teacher_id: userId,
                student_id: student.id,
                group_id: student.group_id,
                session_date: date,
                month: selectedMonth,
                year: selectedYear,
                status: "absent",
                created_at: new Date().toISOString(),
              });
            }
          }
        }
      }

      if (recordsToInsert.length > 0 && navigator.onLine) {
        try {
          await AttendanceService.addAttendanceRecords(recordsToInsert);
        } catch (e) {
          console.error("Auto absent failed", e);
        }
      }

      setAttendance(merged);
    } catch {}
  };

  useEffect(() => {
    if (userId) loadAttendance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, selectedMonth, selectedYear, students]);

  // Reset manual dates when month/year/group changes
  useEffect(() => {
    setManualDates([]);
  }, [selectedMonth, selectedYear, selectedGroupId]);

  const filteredStudents = students.filter((s) => {
    const effectiveGradeId = s.grade_id || groups.find((g) => g.id === s.group_id)?.grade_id;
    if (selectedGradeId !== "all" && effectiveGradeId !== selectedGradeId) return false;
    if (selectedGroupId !== "all" && s.group_id !== selectedGroupId) return false;
    return true;
  });

  const dbDates = Array.from(new Set(
    attendance
      .filter(a => selectedGroupId === "all" || a.group_id === selectedGroupId)
      .map(a => a.session_date)
  ));
  const allDates = Array.from(new Set([...dbDates, ...manualDates])).sort();

  return {
    loading, userId, groups, students, grades,
    attendance, setAttendance,
    selectedGradeId, setSelectedGradeId,
    selectedGroupId, setSelectedGroupId,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    manualDates, setManualDates,
    filteredStudents, allDates,
    loadAttendance,
  };
}
