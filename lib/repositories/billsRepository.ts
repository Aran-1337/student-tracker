import { supabase } from "@/lib/supabaseClient";
import { Bill } from "@/lib/types";

export const BillsRepository = {
  async getBillsByTeacherId(teacherId: string): Promise<Bill[]> {
    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addBill(bill: Omit<Bill, "id" | "created_at">): Promise<Bill> {
    const { data, error } = await supabase
      .from("bills")
      .insert([bill])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async addBills(bills: Omit<Bill, "id" | "created_at">[]): Promise<Bill[]> {
    const { data, error } = await supabase
      .from("bills")
      .insert(bills)
      .select();
    if (error) throw error;
    return data || [];
  },

  async deleteBill(id: string): Promise<void> {
    const { error } = await supabase
      .from("bills")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async deleteBills(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from("bills")
      .delete()
      .in("id", ids);
    if (error) throw error;
  },

  async deleteRecurringBillsForMonth(monthNum: number, teacherId: string): Promise<void> {
    const { error } = await supabase
      .from("bills")
      .delete()
      .eq("billing_month", monthNum)
      .eq("is_recurring", true)
      .eq("teacher_id", teacherId);
    if (error) throw error;
  }
};
