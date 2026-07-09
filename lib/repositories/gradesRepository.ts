import { supabase } from "@/lib/supabaseClient";
import { Grade } from "@/lib/types";

export const GradesRepository = {
  async getGradesByTeacherId(teacherId: string): Promise<Grade[]> {
    const { data, error } = await supabase
      .from("grades")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getAllGrades(): Promise<Grade[]> {
    const { data, error } = await supabase
      .from("grades")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async addGrade(grade: Omit<Grade, "id" | "created_at">): Promise<Grade> {
    const { data, error } = await supabase
      .from("grades")
      .insert([grade])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateGrade(id: string, updates: Partial<Grade>): Promise<void> {
    const { error } = await supabase
      .from("grades")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
  },

  async deleteGrade(id: string): Promise<void> {
    const { error } = await supabase
      .from("grades")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
};
