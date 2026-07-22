import { supabase } from "@/lib/supabaseClient";
import { AttendanceRecord } from "@/lib/types";
import { AttendanceQueue } from "@/lib/offlineQueue";

export const AttendanceRepository = {
  async getAttendanceRecords(month: number, year: number): Promise<AttendanceRecord[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    const { data, error } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("teacher_id", session.user.id)
      .eq("month", month)
      .eq("year", year);
    if (error) throw error;
    return data || [];
  },

  async addAttendanceRecord(record: Omit<AttendanceRecord, "id" | "created_at">): Promise<AttendanceRecord> {
    const { data, error } = await supabase
      .from("attendance_records")
      .insert([record])
      .select()
      .single();
    if (error) throw error;
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
      .insert(records)
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
