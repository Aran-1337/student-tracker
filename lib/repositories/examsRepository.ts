import { supabase } from "@/lib/supabaseClient";
import { Exam, ExamGrade } from "@/lib/types";

export const examsRepository = {
  async getExamsByGroupId(groupId: string): Promise<Exam[]> {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("group_id", groupId)
      .order("exam_date", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addExam(exam: Omit<Exam, "id" | "created_at">): Promise<Exam> {
    const { data, error } = await supabase
      .from("exams")
      .insert([exam])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteExam(id: string): Promise<void> {
    const { error } = await supabase
      .from("exams")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async getGradesByExamId(examId: string): Promise<ExamGrade[]> {
    const { data, error } = await supabase
      .from("exam_grades")
      .select("*")
      .eq("exam_id", examId);
    if (error) throw error;
    return data || [];
  },

  async upsertGrades(grades: Omit<ExamGrade, "id" | "created_at">[]): Promise<void> {
    if (grades.length === 0) return;
    const { error } = await supabase
      .from("exam_grades")
      .upsert(grades, { onConflict: "exam_id,student_id" });
    if (error) throw error;
  }
};
