import { supabase } from "@/lib/supabaseClient";
import { Plan } from "@/lib/types";

export const PlansRepository = {
  async getAllPlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async addPlan(plan: Omit<Plan, "id" | "created_at">): Promise<Plan> {
    const { data, error } = await supabase
      .from("plans")
      .insert([plan])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updatePlan(id: string, updates: Partial<Plan>): Promise<void> {
    const { error } = await supabase
      .from("plans")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
  },

  async deletePlan(id: string): Promise<void> {
    const { error } = await supabase
      .from("plans")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
};
