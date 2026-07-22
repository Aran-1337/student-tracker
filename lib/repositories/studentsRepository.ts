import { supabase } from "@/lib/supabaseClient";
import { Student } from "@/lib/types";

export const StudentsRepository = {
  async getStudentsByTeacherId(teacherId: string): Promise<Student[]> {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getStudentById(id: string): Promise<Student | null> {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data;
  },

  async getAllStudents(): Promise<Student[]> {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addStudent(student: Omit<Student, "id" | "created_at">): Promise<Student> {
    const { data, error } = await supabase
      .from("students")
      .insert([student])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<void> {
    const { error } = await supabase
      .from("students")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
  },

  async deleteStudent(id: string): Promise<void> {
    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async deleteStudents(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from("students")
      .delete()
      .in("id", ids);
    if (error) throw error;
  }
};
