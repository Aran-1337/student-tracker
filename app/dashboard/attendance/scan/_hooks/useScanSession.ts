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

function detectCurrentGroup(groups: Group[]): Group | null {
  const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const now = new Date();
  const todayAr = DAYS_AR[now.getDay()];
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const WINDOW = 45;

  return groups.find(g => {
    if (!g.day_of_week || !g.time) return false;
    if (!g.day_of_week.includes(todayAr)) return false;
    const [h, m] = g.time.split(":").map(Number);
    const groupMins = h * 60 + m;
    return nowMins >= groupMins - WINDOW && nowMins <= groupMins + WINDOW;
  }) ?? null;
}

export function useScanSession() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  const now = new Date();
  const [selectedGradeId, setSelectedGradeId] = useState("all");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [sessionDate, setSessionDate] = useState(now.toISOString().split("T")[0]);
  const [autoDetected, setAutoDetected] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [scannedToday, setScannedToday] = useState<ScannedEntry[]>([]);
  const [lastScan, setLastScan] = useState<LastScan | null>(null);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [crossGroupConfirm, setCrossGroupConfirm] = useState<CrossGroupConfirm | null>(null);
  const [manualCode, setManualCode] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef<Set<string>>(new Set());
  const scannedIdsRef = useRef<Map<string, number>>(new Map());
  // keep latest values accessible inside scanner callback without re-creating it
  const stateRef = useRef({ userId: null as string | null, selectedGroupId: "", scannerPaused: false, students: [] as Student[], groups: [] as Group[], scannedToday: [] as ScannedEntry[], sessionDate: "" });
  const scannerDivId = "qr-reader";

  const showLastScan = useCallback((name: string, success: boolean) => {
    setLastScan({ name, success });
    setTimeout(() => setLastScan(null), 2500);
  }, []);

  // keep stateRef in sync
  useEffect(() => {
    stateRef.current = { userId, selectedGroupId, scannerPaused, students, groups, scannedToday, sessionDate };
  }, [userId, selectedGroupId, scannerPaused, students, groups, scannedToday, sessionDate]);

  // ── startScanner (stable ref — never changes) ─────────────────
  const startScanner = useCallback(async (groupId?: string) => {
    const gid = groupId ?? stateRef.current.selectedGroupId;
    if (!gid) return;
    try {
      const config = { fps: 6, qrbox: { width: 220, height: 220 } };
      const qr = new Html5Qrcode(scannerDivId);
      scannerRef.current = qr;

      const onScan = async (decodedText: string) => {
        const { userId, scannerPaused, students, groups, scannedToday, sessionDate, selectedGroupId } = stateRef.current;
        if (!userId || scannerPaused) return;
        const nowMs = Date.now();
        if ((scannedIdsRef.current.get(decodedText) ?? 0) + SCAN_COOLDOWN_MS > nowMs) return;
        if (processingRef.current.has(decodedText)) return;
        processingRef.current.add(decodedText);
        scannedIdsRef.current.set(decodedText, nowMs);

        const student = students.find(s => s.id === decodedText);
        if (!student) { processingRef.current.delete(decodedText); showLastScan("طالب غير معروف!", false); return; }

        if (student.group_id !== selectedGroupId) {
          setScannerPaused(true);
          const sg = groups.find(g => g.id === student.group_id);
          setCrossGroupConfirm({ student, originalGroupName: sg ? `${sg.name} (${sg.day_of_week})` : "مجموعة أخرى" });
          processingRef.current.delete(decodedText);
          return;
        }

        if (scannedToday.some(e => e.studentId === student.id)) {
          processingRef.current.delete(decodedText);
          showLastScan(`${student.name} — مسجل مسبقاً`, false);
          return;
        }

        // process attendance inline
        try {
          const [syear, smonth] = sessionDate.split("-").map(Number);
          await AttendanceService.upsertAttendanceRecord({
            teacher_id: userId, student_id: student.id,
            group_id: selectedGroupId, session_date: sessionDate,
            month: smonth, year: syear, status: "present",
          });
          const entry: ScannedEntry = {
            studentId: student.id, studentName: student.name,
            time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
          };
          setScannedToday(prev => prev.some(e => e.studentId === student.id) ? prev : [entry, ...prev]);
          showLastScan(student.name, true);
        } catch (e: any) {
          showLastScan(`خطأ: ${e.message}`, false);
        } finally {
          processingRef.current.delete(decodedText);
        }
      };

      try {
        await qr.start({ facingMode: "environment" }, config, onScan, () => {});
      } catch {
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras?.length) throw new Error("لا توجد كاميرا");
        const back = cameras.find(c => /back|rear|environment/i.test(c.label));
        await qr.start(back ? back.id : cameras[cameras.length - 1].id, config, onScan, () => {});
      }
      setScanning(true);
    } catch (err: any) {
      showLastScan(`تعذّر تشغيل الكاميرا: ${err?.message ?? err}`, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLastScan]);

  // ── Load data + auto-detect + auto-start ──────────────────────
  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setUserId(session.user.id);
        stateRef.current.userId = session.user.id;

        let grpData: Group[], stData: Student[], grdData: Grade[];
        if (navigator.onLine) {
          [grpData, stData, grdData] = await Promise.all([
            GroupsService.getGroupsByTeacherId(session.user.id),
            StudentsService.getStudentsByTeacherId(session.user.id),
            GradesService.getGradesByTeacherId(session.user.id),
          ]);
          OfflineCache.saveStudents(stData);
          OfflineCache.saveGroups(grpData);
          OfflineCache.saveGrades(grdData);
          OfflineCache.setLastSync();
        } else {
          grpData = OfflineCache.loadGroups();
          stData = OfflineCache.loadStudents();
          grdData = OfflineCache.loadGrades();
        }

        setGroups(grpData);
        setStudents(stData);
        setGrades(grdData);
        stateRef.current.students = stData;
        stateRef.current.groups = grpData;

        // auto-detect group
        const match = detectCurrentGroup(grpData);
        if (match) {
          setSelectedGroupId(match.id);
          if (match.grade_id) setSelectedGradeId(match.grade_id);
          setAutoDetected(true);
          stateRef.current.selectedGroupId = match.id;

          // auto-start camera
          setIsStarting(true);
          await startScanner(match.id);
          setIsStarting(false);
        }
      } catch {
        const grpData = OfflineCache.loadGroups();
        setGroups(grpData);
        setStudents(OfflineCache.loadStudents());
        setGrades(OfflineCache.loadGrades());
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load session attendance ───────────────────────────────────
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
              return { studentId: r.student_id, studentName: st?.name ?? "طالب غير معروف", time: new Date(r.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) };
            }));
          }
        } catch {}
      } else {
        const queued = AttendanceQueue.getAll().filter(r => r.group_id === selectedGroupId && r.session_date === sessionDate);
        setScannedToday(queued.map(r => {
          const st = students.find(s => s.id === r.student_id);
          return { studentId: r.student_id, studentName: st?.name ?? "طالب غير معروف", time: new Date(r._queuedAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) };
        }));
      }
    }
    loadSessionAttendance();
  }, [userId, selectedGroupId, sessionDate, students]);

  // ── Cleanup on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch {}
        try { scannerRef.current.clear(); } catch {}
      }
    };
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      try { scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const handleQRSuccess = useCallback(async (decodedText: string) => {
    const { userId, scannerPaused, students, groups, scannedToday, sessionDate, selectedGroupId } = stateRef.current;
    if (!userId || scannerPaused) return;
    const nowMs = Date.now();
    if ((scannedIdsRef.current.get(decodedText) ?? 0) + SCAN_COOLDOWN_MS > nowMs) return;
    if (processingRef.current.has(decodedText)) return;
    processingRef.current.add(decodedText);
    scannedIdsRef.current.set(decodedText, nowMs);

    const student = students.find(s => s.id === decodedText);
    if (!student) { processingRef.current.delete(decodedText); showLastScan("طالب غير معروف!", false); return; }

    if (student.group_id !== selectedGroupId) {
      setScannerPaused(true);
      const sg = groups.find(g => g.id === student.group_id);
      setCrossGroupConfirm({ student, originalGroupName: sg ? `${sg.name} (${sg.day_of_week})` : "مجموعة أخرى" });
      processingRef.current.delete(decodedText);
      return;
    }

    if (scannedToday.some(e => e.studentId === student.id)) {
      processingRef.current.delete(decodedText);
      showLastScan(`${student.name} — مسجل مسبقاً`, false);
      return;
    }

    try {
      const [syear, smonth] = sessionDate.split("-").map(Number);
      await AttendanceService.upsertAttendanceRecord({
        teacher_id: userId, student_id: student.id,
        group_id: selectedGroupId, session_date: sessionDate,
        month: smonth, year: syear, status: "present",
      });
      const entry: ScannedEntry = {
        studentId: student.id, studentName: student.name,
        time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      };
      setScannedToday(prev => prev.some(e => e.studentId === student.id) ? prev : [entry, ...prev]);
      showLastScan(student.name, true);
    } catch (e: any) {
      showLastScan(`خطأ: ${e.message}`, false);
    } finally {
      processingRef.current.delete(decodedText);
    }
  }, [showLastScan]);

  const handleManualSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const student = AttendanceService.findStudentByCode(manualCode, selectedGradeId, students, grades);
    if (!student) { showLastScan("كود غير صحيح!", false); return; }
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

  const handleGroupChange = useCallback(async (v: string) => {
    setSelectedGroupId(v);
    stateRef.current.selectedGroupId = v;
    setScannedToday([]);
    scannedIdsRef.current.clear();
    processingRef.current.clear();
    if (scanning) {
      await stopScanner();
      if (v) {
        setIsStarting(true);
        await startScanner(v);
        setIsStarting(false);
      }
    }
  }, [scanning, stopScanner, startScanner]);

  const handleSessionDateChange = useCallback((date: string) => {
    setSessionDate(date);
    setScannedToday([]);
    scannedIdsRef.current.clear();
    processingRef.current.clear();
  }, []);

  const handleConfirmCrossGroup = useCallback(async () => {
    if (!crossGroupConfirm) return;
    const st = crossGroupConfirm.student;
    const { userId, sessionDate, selectedGroupId } = stateRef.current;
    scannedIdsRef.current.set(st.id, Date.now());
    setCrossGroupConfirm(null);
    setScannerPaused(false);
    if (!userId) return;
    try {
      const [syear, smonth] = sessionDate.split("-").map(Number);
      await AttendanceService.upsertAttendanceRecord({
        teacher_id: userId, student_id: st.id,
        group_id: selectedGroupId, session_date: sessionDate,
        month: smonth, year: syear, status: "present",
      });
      const entry: ScannedEntry = {
        studentId: st.id, studentName: st.name,
        time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      };
      setScannedToday(prev => prev.some(e => e.studentId === st.id) ? prev : [entry, ...prev]);
      showLastScan(st.name, true);
    } catch (e: any) {
      showLastScan(`خطأ: ${e.message}`, false);
    }
  }, [crossGroupConfirm, showLastScan]);

  const handleCancelCrossGroup = useCallback(() => {
    if (crossGroupConfirm) scannedIdsRef.current.set(crossGroupConfirm.student.id, Date.now());
    setCrossGroupConfirm(null);
    setScannerPaused(false);
  }, [crossGroupConfirm]);

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
    autoDetected,
    handleGradeChange, handleGroupChange, handleSessionDateChange,
    startScanner, stopScanner,
    handleManualSubmit,
    setManualCode,
    handleConfirmCrossGroup, handleCancelCrossGroup,
    handleRemoveScanned,
  };
}
