import { supabase } from "@/lib/supabaseClient";
import { AttendanceRecord } from "@/lib/types";

export const AttendanceRepository = {
  async getAttendanceRecords(month: number, year: number): Promise<AttendanceRecord[]> {
    // Note: If you want to filter by teacher_id, you might need to join students or add teacher_id to attendance_records.
    // Assuming the current schema doesn't have teacher_id on attendance_records directly, we fetch all for now, 
    // or you can refine this later in the services.
    const { data, error } = await supabase
      .from("attendance_records")
      .select("*")
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

  async deleteAttendanceRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from("attendance_records")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
};
