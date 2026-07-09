import { GradesRepository } from "@/lib/repositories/gradesRepository";
import { Grade } from "@/lib/types";

export const GradesService = {
  async getGradesByTeacherId(teacherId: string): Promise<Grade[]> {
    return GradesRepository.getGradesByTeacherId(teacherId);
  },

  async getAllGrades(): Promise<Grade[]> {
    return GradesRepository.getAllGrades();
  },

  async addGrade(grade: Omit<Grade, "id" | "created_at">): Promise<Grade> {
    return GradesRepository.addGrade(grade);
  },

  async updateGrade(id: string, updates: Partial<Grade>): Promise<void> {
    return GradesRepository.updateGrade(id, updates);
  },

  async deleteGrade(id: string): Promise<void> {
    return GradesRepository.deleteGrade(id);
  }
};
