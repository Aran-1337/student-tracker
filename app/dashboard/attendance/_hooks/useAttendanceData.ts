"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Group, Student, Grade, AttendanceRecord } from "@/lib/types";
import { GroupsService } from "@/lib/services/groupsService";
import { StudentsService } from "@/lib/services/studentsService";
import { GradesService } from "@/lib/services/gradesService";
import { AttendanceService } from "@/lib/services/attendanceService";
import { OfflineCache } from "@/lib/offlineQueue";

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
        } else {
          setGroups(OfflineCache.loadGroups());
          setStudents(OfflineCache.loadStudents());
          setGrades(OfflineCache.loadGrades());
        }
      } catch {
        setGroups(OfflineCache.loadGroups());
        setStudents(OfflineCache.loadStudents());
        setGrades(OfflineCache.loadGrades());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const loadAttendance = useCallback(async () => {
    if (!userId) return;
    try {
      const records = await AttendanceService.getAttendanceRecords(selectedMonth, selectedYear);
      setAttendance(records);
    } catch {}
  }, [userId, selectedMonth, selectedYear]);

  useEffect(() => {
    if (userId) loadAttendance();
  }, [loadAttendance, userId]);

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
