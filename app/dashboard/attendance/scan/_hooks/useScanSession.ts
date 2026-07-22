"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/supabaseClient";
import { Group, Student, Grade, ScannedEntry } from "@/lib/types";
import { GroupsService } from "@/lib/services/groupsService";
import { StudentsService } from "@/lib/services/studentsService";
import { GradesService } from "@/lib/services/gradesService";
import { AttendanceService } from "@/lib/services/attendanceService";
import { AttendanceQueue, OfflineCache } from "@/lib/offlineQueue";

export interface LastScan {
  name: string;
  success: boolean;
}

export interface CrossGroupConfirm {
  student: Student;
  originalGroupName: string;
}

const SCAN_COOLDOWN_MS = 3000;

export function useScanSession() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  const now = new Date();
  const [selectedGradeId, setSelectedGradeId] = useState("all");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  // FIX #7: sessionDate is now user-controllable instead of always being today
  const [sessionDate, setSessionDate] = useState(now.toISOString().split("T")[0]);

  const [scanning, setScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [scannedToday, setScannedToday] = useState<ScannedEntry[]>([]);
  const [lastScan, setLastScan] = useState<LastScan | null>(null);
  // FIX #4: scannerPaused prevents new scans while crossGroupConfirm is open
  const [scannerPaused, setScannerPaused] = useState(false);
  const [crossGroupConfirm, setCrossGroupConfirm] = useState<CrossGroupConfirm | null>(null);
  const [manualCode, setManualCode] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  // FIX #3: processingRef prevents race conditions on simultaneous scans
  const processingRef = useRef<Set<string>>(new Set());
  const scannedIdsRef = useRef<Map<string, number>>(new Map());
  const scannerDivId = "qr-reader";

  const showLastScan = useCallback((name: string, success: boolean) => {
    setLastScan({ name, success });
    setTimeout(() => setLastScan(null), 2500);
  }, []);

  // ── Load data ────────────────────────────────────────────────────
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
          setGroups(grpData); setStudents(stData); setGrades(grdData);
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

  // ── Load session's attendance ────────────────────────────────────
  // FIX #8: falls back to offline queue when not online
  useEffect(() => {
    if (!userId || !selectedGroupId || students.length === 0) return;

    async function loadSessionAttendance() {
      if (navigator.onLine) {
        try {
          const { data } = await supabase
            .from("attendance_records")
            .select("student_id, created_at")
            .eq("teacher_id", userId)
            .eq("group_id", selectedGroupId)
            .eq("session_date", sessionDate)
            .eq("status", "present");

          if (data) {
            setScannedToday(data.map(r => {
              const st = students.find(s => s.id === r.student_id);
              return {
                studentId: r.student_id,
                studentName: st?.name || "طالب غير معروف",
                time: new Date(r.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
              };
            }));
          }
        } catch {}
      } else {
        // FIX #8: load from offline queue when offline
        const queued = AttendanceQueue.getAll().filter(
          r => r.group_id === selectedGroupId && r.session_date === sessionDate
        );
        setScannedToday(queued.map(r => {
          const st = students.find(s => s.id === r.student_id);
          return {
            studentId: r.student_id,
            studentName: st?.name || "طالب غير معروف",
            time: new Date(r._queuedAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
          };
        }));
      }
    }
    loadSessionAttendance();
  }, [userId, selectedGroupId, sessionDate, students]);

  // ── Cleanup scanner on unmount ───────────────────────────────────
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch {}
        try { scannerRef.current.clear(); } catch {}
      }
    };
  }, []);

  const processAttendance = useCallback(async (student: Student, overrideGroupId?: string) => {
    if (!userId) return;
    const sessionMonth = new Date(sessionDate).getMonth() + 1;
    const sessionYear = new Date(sessionDate).getFullYear();
    try {
      await AttendanceService.upsertAttendanceRecord({
        teacher_id: userId,
        student_id: student.id,
        group_id: overrideGroupId || student.group_id,
        session_date: sessionDate,
        month: sessionMonth,
        year: sessionYear,
        status: "present",
      });
      const entry: ScannedEntry = {
        studentId: student.id,
        studentName: student.name,
        time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      };
      // FIX #1: only add if not already in list
      setScannedToday(prev =>
        prev.some(e => e.studentId === student.id) ? prev : [entry, ...prev]
      );
      showLastScan(student.name, true);
    } catch (error: any) {
      showLastScan(`خطأ: ${error.message}`, false);
    } finally {
      processingRef.current.delete(student.id);
    }
  }, [userId, sessionDate, showLastScan]);

  const handleQRSuccess = useCallback(async (decodedText: string) => {
    if (!userId || scannerPaused) return;

    const nowMs = Date.now();
    const lastScanTime = scannedIdsRef.current.get(decodedText) || 0;
    // FIX #2: cooldown check
    if (nowMs - lastScanTime < SCAN_COOLDOWN_MS) return;

    // FIX #3: race condition guard
    if (processingRef.current.has(decodedText)) return;
    processingRef.current.add(decodedText);
    scannedIdsRef.current.set(decodedText, nowMs);

    const student = students.find(s => s.id === decodedText);
    if (!student) {
      processingRef.current.delete(decodedText);
      showLastScan("طالب غير معروف!", false);
      return;
    }

    if (student.group_id !== selectedGroupId) {
      // FIX #4: pause scanner while confirm dialog is open
      setScannerPaused(true);
      const sg = groups.find(g => g.id === student.group_id);
      const gName = sg ? `${sg.name} (${sg.day_of_week})` : "مجموعة أخرى";
      setCrossGroupConfirm({ student, originalGroupName: gName });
      processingRef.current.delete(decodedText);
      return;
    }

    if (scannedToday.some(e => e.studentId === student.id)) {
      processingRef.current.delete(decodedText);
      showLastScan(`${student.name} — مسجل مسبقاً`, false);
      return;
    }

    await processAttendance(student);
  }, [userId, scannerPaused, students, selectedGroupId, groups, scannedToday, processAttendance, showLastScan]);

  const startScanner = useCallback(async () => {
    if (!selectedGroupId) return;
    try {
      const config = { fps: 6, qrbox: { width: 220, height: 220 } };
      const qr = new Html5Qrcode(scannerDivId);
      scannerRef.current = qr;
      try {
        await qr.start({ facingMode: "environment" }, config, handleQRSuccess, () => {});
        setScanning(true);
      } catch (envError: any) {
        if (envError?.name === "NotReadableError") throw envError;
        const cameras = await Html5Qrcode.getCameras();
        if (cameras?.length > 0) {
          const back = cameras.find(c =>
            c.label.toLowerCase().includes("back") ||
            c.label.toLowerCase().includes("rear") ||
            c.label.toLowerCase().includes("environment")
          );
          await qr.start(back ? back.id : cameras[cameras.length - 1].id, config, handleQRSuccess, () => {});
          setScanning(true);
        } else throw envError;
      }
    } catch (err: any) {
      // FIX #5: use lastScan feedback instead of alert()
      showLastScan(`تعذّر تشغيل الكاميرا: ${err?.message || err}`, false);
    }
  }, [selectedGroupId, handleQRSuccess, showLastScan]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      try { scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const handleManualSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const student = AttendanceService.findStudentByCode(manualCode, selectedGradeId, students, grades);
    if (!student) {
      showLastScan("كود غير صحيح!", false);
      return;
    }
    handleQRSuccess(student.id);
    setManualCode("");
  }, [manualCode, selectedGradeId, students, grades, handleQRSuccess, showLastScan]);

  const handleGradeChange = useCallback((v: string) => {
    setSelectedGradeId(v);
    setSelectedGroupId("");
    if (scanning) stopScanner();
    setScannedToday([]);
    scannedIdsRef.current.clear();
    processingRef.current.clear();
  }, [scanning, stopScanner]);

  const handleGroupChange = useCallback((v: string) => {
    setSelectedGroupId(v);
    if (scanning) stopScanner();
    setScannedToday([]);
    scannedIdsRef.current.clear();
    processingRef.current.clear();
  }, [scanning, stopScanner]);

  // FIX #7: session date change handler
  const handleSessionDateChange = useCallback((date: string) => {
    setSessionDate(date);
    setScannedToday([]);
    scannedIdsRef.current.clear();
    processingRef.current.clear();
  }, []);

  const handleConfirmCrossGroup = useCallback(async () => {
    if (!crossGroupConfirm) return;
    const st = crossGroupConfirm.student;
    scannedIdsRef.current.set(st.id, Date.now());
    setCrossGroupConfirm(null);
    setScannerPaused(false); // FIX #4: resume scanner after confirm
    await processAttendance(st, selectedGroupId);
  }, [crossGroupConfirm, selectedGroupId, processAttendance]);

  const handleCancelCrossGroup = useCallback(() => {
    if (crossGroupConfirm) {
      scannedIdsRef.current.set(crossGroupConfirm.student.id, Date.now());
    }
    setCrossGroupConfirm(null);
    setScannerPaused(false); // FIX #4: resume scanner after cancel
  }, [crossGroupConfirm]);

  // Remove a scanned entry (undo scan)
  const handleRemoveScanned = useCallback((studentId: string) => {
    setScannedToday(prev => prev.filter(e => e.studentId !== studentId));
    scannedIdsRef.current.delete(studentId);
  }, []);

  const manualPlaceholder = (() => {
    if (selectedGradeId && selectedGradeId !== "all") {
      const grade = grades.find(g => g.id === selectedGradeId);
      if (grade?.prefix) return `مثال: ${grade.prefix}1001`;
    }
    return "مثال: 10001";
  })();

  const groupStudentsCount = students.filter(s => s.group_id === selectedGroupId).length;

  return {
    loading, userId,
    groups, students, grades,
    selectedGradeId, selectedGroupId, sessionDate,
    scanning, isStarting, setIsStarting,
    scannedToday, lastScan,
    crossGroupConfirm, manualCode,
    manualPlaceholder, scannerDivId,
    groupStudentsCount,
    handleGradeChange, handleGroupChange, handleSessionDateChange,
    startScanner, stopScanner,
    handleManualSubmit,
    setManualCode,
    handleConfirmCrossGroup, handleCancelCrossGroup,
    handleRemoveScanned,
  };
}
