import { supabase } from "@/lib/supabaseClient";
import { AttendanceRecord } from "@/lib/types";
import { AttendanceQueue } from "@/lib/offlineQueue";

export const AttendanceRepository = {
  async getAttendanceRecords(month: number, year: number): Promise<AttendanceRecord[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    
    let allData: AttendanceRecord[] = [];
    let page = 0;
    const limit = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("teacher_id", session.user.id)
        .eq("month", month)
        .eq("year", year)
        .range(page * limit, (page + 1) * limit - 1);
        
      if (error) throw error;
      if (!data || data.length === 0) break;
      
      allData = [...allData, ...data];
      if (data.length < limit) break;
      page++;
    }
    
    return allData;
  },

  async getAttendanceByStudentId(studentId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("student_id", studentId)
      .order("session_date", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addAttendanceRecord(record: Omit<AttendanceRecord, "id" | "created_at">): Promise<AttendanceRecord> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      AttendanceQueue.add(record);
      return { ...record, id: `temp-${Date.now()}` } as AttendanceRecord;
    }
    const { data, error } = await supabase
      .from("attendance_records")
      .upsert([record], { onConflict: "student_id,session_date" })
      .select()
      .single();
    if (error) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        AttendanceQueue.add(record);
        return { ...record, id: `temp-${Date.now()}` } as AttendanceRecord;
      }
      throw error;
    }
    return data;
  },

  async upsertAttendanceRecord(record: Omit<AttendanceRecord, "id" | "created_at">): Promise<void> {
    if (!navigator.onLine) {
      AttendanceQueue.add(record);
      return;
    }
    const { error } = await supabase
      .from("attendance_records")
      .upsert([record], { onConflict: "student_id,session_date" });
    if (error) {
      // fallback to queue if request fails
      AttendanceQueue.add(record);
      throw error;
    }
  },

  async addAttendanceRecords(records: Omit<AttendanceRecord, "id" | "created_at">[]): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from("attendance_records")
      .upsert(records, { onConflict: "student_id,session_date" })
      .select();
    if (error) throw error;
    return data || [];
  },

  async deleteAttendanceRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from("attendance_records")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async syncQueue(): Promise<number> {
    const queue = AttendanceQueue.getAll();
    if (queue.length === 0) return 0;

    let synced = 0;
    for (const { _queuedAt, ...record } of queue) {
      const { error } = await supabase
        .from("attendance_records")
        .upsert([record], { onConflict: "student_id,session_date" });
      if (!error) {
        AttendanceQueue.remove(record.student_id, record.session_date!);
        synced++;
      }
    }
    return synced;
  },
};
