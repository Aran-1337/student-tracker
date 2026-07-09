import { SubTeachersRepository } from "@/lib/repositories/subTeachersRepository";
import { SubTeacher } from "@/lib/types";

export const SubTeachersService = {
  async getSubTeachersByCenterId(centerId: string): Promise<SubTeacher[]> {
    return SubTeachersRepository.getSubTeachersByCenterId(centerId);
  },

  async addSubTeacher(subTeacher: Omit<SubTeacher, "id" | "created_at">): Promise<SubTeacher> {
    return SubTeachersRepository.addSubTeacher(subTeacher);
  },

  async deleteSubTeacher(id: string): Promise<void> {
    return SubTeachersRepository.deleteSubTeacher(id);
  }
};
