import { supabase } from "@/lib/supabaseClient";
import { Teacher } from "@/lib/types";

export const TeachersRepository = {
  async getTeacherById(id: string): Promise<Teacher | null> {
    const { data, error } = await supabase
      .from("teachers")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async updateTeacher(id: string, updates: Partial<Teacher>): Promise<void> {
    const { error } = await supabase
      .from("teachers")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
  },

  async getAllTeachers(): Promise<Teacher[]> {
    const { data, error } = await supabase
      .from("teachers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }
};
