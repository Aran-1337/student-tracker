import { supabase } from "@/lib/supabaseClient";
import { AttendanceRecord } from "@/lib/types";

export const AttendanceRepository = {
  async getAttendanceRecords(month: number, year: number): Promise<AttendanceRecord[]> {
    // RLS on attendance_records uses teacher_id = auth.uid(), so this is already safe.
    // The eq("teacher_id") filter below is an extra application-level guard.
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
    const { error } = await supabase
      .from("attendance_records")
      .upsert([record], { onConflict: "student_id,session_date" });
    if (error) throw error;
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
  }
};
