import { examsRepository } from "@/lib/repositories/examsRepository";
import { Exam, ExamGrade } from "@/lib/types";

export const examsService = {
  async getExamsByGroupId(groupId: string): Promise<Exam[]> {
    return await examsRepository.getExamsByGroupId(groupId);
  },

  async getExamsByTeacherAndMonth(teacherId: string, month: number, year: number): Promise<Exam[]> {
    return await examsRepository.getExamsByTeacherAndMonth(teacherId, month, year);
  },

  async addExam(exam: Omit<Exam, "id" | "created_at">): Promise<Exam> {
    return await examsRepository.addExam(exam);
  },

  async deleteExam(id: string): Promise<void> {
    return await examsRepository.deleteExam(id);
  },

  async getGradesByExamId(examId: string): Promise<ExamGrade[]> {
    return await examsRepository.getGradesByExamId(examId);
  },

  async getGradesByExamIds(examIds: string[]): Promise<ExamGrade[]> {
    return await examsRepository.getGradesByExamIds(examIds);
  },

  async upsertGrades(grades: Omit<ExamGrade, "id" | "created_at">[]): Promise<void> {
    return await examsRepository.upsertGrades(grades);
  }
};
