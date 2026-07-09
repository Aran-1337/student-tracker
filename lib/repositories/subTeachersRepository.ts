import { supabase } from "@/lib/supabaseClient";
import { SubTeacher } from "@/lib/types";

export const SubTeachersRepository = {
  async getSubTeachersByCenterId(centerId: string): Promise<SubTeacher[]> {
    const { data, error } = await supabase
      .from("sub_teachers")
      .select("*")
      .eq("center_id", centerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addSubTeacher(subTeacher: Omit<SubTeacher, "id" | "created_at">): Promise<SubTeacher> {
    const { data, error } = await supabase
      .from("sub_teachers")
      .insert([subTeacher])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteSubTeacher(id: string): Promise<void> {
    const { error } = await supabase
      .from("sub_teachers")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
};
