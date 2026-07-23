import { supabase } from "@/lib/supabaseClient";
import { BillTemplate } from "@/lib/types";

export const BillTemplatesRepository = {
  async getByTeacherId(teacherId: string): Promise<BillTemplate[]> {
    const { data, error } = await supabase
      .from("bill_templates")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async add(template: Omit<BillTemplate, "id" | "created_at">): Promise<BillTemplate> {
    const { data, error } = await supabase
      .from("bill_templates")
      .insert([template])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Omit<BillTemplate, "id" | "created_at" | "teacher_id">>): Promise<BillTemplate> {
    const { data, error } = await supabase
      .from("bill_templates")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from("bill_templates")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};
