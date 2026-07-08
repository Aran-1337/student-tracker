import { supabase } from "@/lib/supabaseClient";
import { Group } from "@/lib/types";

export const GroupsRepository = {
  async getGroupsByTeacherId(teacherId: string): Promise<Group[]> {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getGroupsBySubTeacherId(subTeacherId: string): Promise<Group[]> {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("sub_teacher_id", subTeacherId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getAllGroups(): Promise<Group[]> {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addGroup(group: Omit<Group, "id" | "created_at">): Promise<Group> {
    const { data, error } = await supabase
      .from("groups")
      .insert([group])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateGroup(id: string, updates: Partial<Group>): Promise<void> {
    const { error } = await supabase
      .from("groups")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
  },

  async deleteGroup(id: string): Promise<void> {
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
};
