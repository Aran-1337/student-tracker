"use client";

import { useState } from "react";
import { Student, AttendanceRecord } from "@/lib/types";
import { AttendanceService } from "@/lib/services/attendanceService";
import { AttendanceQueue } from "@/lib/offlineQueue";

const isOfflineRecord = (id: string) => id.startsWith("offline-");

const deleteRecord = async (record: AttendanceRecord) => {
  if (isOfflineRecord(record.id)) {
    AttendanceQueue.remove(record.student_id, record.session_date!);
  } else {
    await AttendanceService.deleteAttendanceRecord(record.id);
  }
};

interface UseAttendanceActionsProps {
  userId: string | null;
  attendance: AttendanceRecord[];
  setAttendance: (records: AttendanceRecord[]) => void;
  filteredStudents: Student[];
  showToast: (msg: string, type?: "success" | "error") => void;
}

export function useAttendanceActions({
  userId,
  attendance,
  setAttendance,
  filteredStudents,
  showToast,
}: UseAttendanceActionsProps) {
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ record: AttendanceRecord; studentName: string } | null>(null);

  const isPresent = (studentId: string, dateStr: string) =>
    attendance.some(a => a.student_id === studentId && a.session_date === dateStr && a.status === "present");

  const getRecord = (studentId: string, dateStr: string) =>
    attendance.find(a => a.student_id === studentId && a.session_date === dateStr);

  const getAttendancePercent = (studentId: string, allDates: string[]) => {
    if (allDates.length === 0) return 0;
    const present = attendance.filter(
      a => a.student_id === studentId && a.status === "present" && allDates.includes(a.session_date)
    ).length;
    return Math.round((present / allDates.length) * 100);
  };

  const handleToggle = async (student: Student, dateStr: string) => {
    if (!userId) return;
    const existing = getRecord(student.id, dateStr);
    if (existing) {
      setPendingDelete({ record: existing, studentName: student.name });
    } else {
      const sessionMonth = parseInt(dateStr.split("-")[1], 10);
      const currentYear = parseInt(dateStr.split("-")[0], 10);
      try {
        const newRecord = await AttendanceService.addAttendanceRecord({
          teacher_id: userId,
          student_id: student.id,
          group_id: student.group_id,
          session_date: dateStr,
          month: sessionMonth,
          year: currentYear,
          status: "present",
        });
        setAttendance([...attendance, newRecord]);
      } catch {
        showToast("فشل تسجيل الحضور", "error");
      }
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const optimistic = attendance.filter(a => a.id !== pendingDelete.record.id);
    setAttendance(optimistic);
    setPendingDelete(null);
    try {
      await deleteRecord(pendingDelete.record);
    } catch {
      setAttendance(attendance);
      showToast("فشل حذف الحضور", "error");
    }
  };

  const handleMarkAllSession = async (dateStr: string) => {
    if (!userId) return;
    setSaving(true);
    try {
      const sessionMonth = parseInt(dateStr.split("-")[1], 10);
      const sessionYear = parseInt(dateStr.split("-")[0], 10);
      const toInsert = filteredStudents
        .filter(s => !isPresent(s.id, dateStr))
        .map(s => ({
          teacher_id: userId,
          student_id: s.id,
          group_id: s.group_id,
          session_date: dateStr,
          month: sessionMonth,
          year: sessionYear,
          status: "present" as const,
        }));
      if (toInsert.length === 0) {
        showToast("جميع الطلاب محددون بالفعل");
        return;
      }
      const newRecords = await AttendanceService.addAttendanceRecords(toInsert);
      setAttendance([...attendance, ...newRecords]);
      showToast(`✓ تم تحضير ${toInsert.length} طالب`);
    } catch (err: any) {
      showToast(err.message || "فشل التحضير الجماعي", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleClearSession = async (dateStr: string) => {
    if (!userId) return;
    setSaving(true);
    try {
      const toDelete = attendance.filter(
        a => a.session_date === dateStr && filteredStudents.some(s => s.id === a.student_id)
      );
      await Promise.all(toDelete.map(r => deleteRecord(r)));
      setAttendance(attendance.filter(a => !toDelete.some(d => d.id === a.id)));
      showToast(`تم مسح حضور ${toDelete.length} طالب`);
    } catch {
      showToast("فشل مسح الحصة", "error");
    } finally {
      setSaving(false);
    }
  };

  return {
    saving, pendingDelete, setPendingDelete,
    isPresent, getAttendancePercent,
    handleToggle, confirmDelete,
    handleMarkAllSession, handleClearSession,
  };
}
