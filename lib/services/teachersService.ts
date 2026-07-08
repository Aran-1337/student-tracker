import { TeachersRepository } from "@/lib/repositories/teachersRepository";
import { Teacher } from "@/lib/types";

export const TeachersService = {
  async getTeacherProfile(id: string): Promise<Teacher | null> {
    return TeachersRepository.getTeacherById(id);
  },

  async updateTeacherProfile(id: string, updates: Partial<Teacher>): Promise<void> {
    return TeachersRepository.updateTeacher(id, updates);
  },

  async getAllTeachers(): Promise<Teacher[]> {
    return TeachersRepository.getAllTeachers();
  }
};
