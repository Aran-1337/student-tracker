import { GroupsRepository } from "@/lib/repositories/groupsRepository";
import { Group } from "@/lib/types";

export const GroupsService = {
  async getGroupsByTeacherId(teacherId: string): Promise<Group[]> {
    return GroupsRepository.getGroupsByTeacherId(teacherId);
  },

  async getGroupsBySubTeacherId(subTeacherId: string): Promise<Group[]> {
    return GroupsRepository.getGroupsBySubTeacherId(subTeacherId);
  },

  async getAllGroups(): Promise<Group[]> {
    return GroupsRepository.getAllGroups();
  },

  async addGroup(group: Omit<Group, "id" | "created_at">): Promise<Group> {
    return GroupsRepository.addGroup(group);
  },

  async updateGroup(id: string, updates: Partial<Group>): Promise<void> {
    return GroupsRepository.updateGroup(id, updates);
  },

  async deleteGroup(id: string): Promise<void> {
    return GroupsRepository.deleteGroup(id);
  }
};
