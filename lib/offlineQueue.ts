import { Student, Group, Grade, AttendanceRecord } from "@/lib/types";
import type { SystemSettings } from "@/lib/services/systemSettingsService";

const KEYS = {
  students: "ot_students",
  groups: "ot_groups",
  grades: "ot_grades",
  queue: "ot_attendance_queue",
  lastSync: "ot_last_sync",
  teacher: "ot_teacher",
  sysSettings: "ot_sys_settings",
};

export type QueuedRecord = Omit<AttendanceRecord, "id" | "created_at"> & {
  _queuedAt: string;
};

// ── Cache helpers ────────────────────────────────────────────────

export const OfflineCache = {
  saveStudents(students: Student[]) {
    localStorage.setItem(KEYS.students, JSON.stringify(students));
  },
  loadStudents(): Student[] {
    try {
      const raw = localStorage.getItem(KEYS.students);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  saveGroups(groups: Group[]) {
    localStorage.setItem(KEYS.groups, JSON.stringify(groups));
  },
  loadGroups(): Group[] {
    try {
      const raw = localStorage.getItem(KEYS.groups);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  saveGrades(grades: Grade[]) {
    localStorage.setItem(KEYS.grades, JSON.stringify(grades));
  },
  loadGrades(): Grade[] {
    try {
      const raw = localStorage.getItem(KEYS.grades);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  setLastSync() {
    localStorage.setItem(KEYS.lastSync, new Date().toISOString());
  },
  getLastSync(): string | null {
    return localStorage.getItem(KEYS.lastSync);
  },

  saveTeacher(data: Record<string, unknown>) {
    localStorage.setItem(KEYS.teacher, JSON.stringify(data));
  },
  loadTeacher(): Record<string, unknown> | null {
    try {
      const raw = localStorage.getItem(KEYS.teacher);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  saveSysSettings(settings: SystemSettings) {
    localStorage.setItem(KEYS.sysSettings, JSON.stringify(settings));
  },
  loadSysSettings(): SystemSettings | null {
    try {
      const raw = localStorage.getItem(KEYS.sysSettings);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
};

// ── Queue helpers ────────────────────────────────────────────────

export const AttendanceQueue = {
  getAll(): QueuedRecord[] {
    try {
      const raw = localStorage.getItem(KEYS.queue);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  add(record: Omit<AttendanceRecord, "id" | "created_at">) {
    const queue = AttendanceQueue.getAll();
    // avoid duplicates (same student + same session_date)
    const exists = queue.some(
      r => r.student_id === record.student_id && r.session_date === record.session_date
    );
    if (exists) return;
    queue.push({ ...record, _queuedAt: new Date().toISOString() });
    localStorage.setItem(KEYS.queue, JSON.stringify(queue));
  },

  remove(student_id: string, session_date: string) {
    const queue = AttendanceQueue.getAll().filter(
      r => !(r.student_id === student_id && r.session_date === session_date)
    );
    localStorage.setItem(KEYS.queue, JSON.stringify(queue));
  },

  clear() {
    localStorage.removeItem(KEYS.queue);
  },

  count(): number {
    return AttendanceQueue.getAll().length;
  },
};
