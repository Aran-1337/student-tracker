import { PlansRepository } from "@/lib/repositories/plansRepository";
import { Plan } from "@/lib/types";

export const PlansService = {
  async getAllPlans(): Promise<Plan[]> {
    return PlansRepository.getAllPlans();
  },

  async addPlan(plan: Omit<Plan, "id" | "created_at">): Promise<Plan> {
    return PlansRepository.addPlan(plan);
  },

  async updatePlan(id: string, updates: Partial<Plan>): Promise<void> {
    return PlansRepository.updatePlan(id, updates);
  },

  async deletePlan(id: string): Promise<void> {
    return PlansRepository.deletePlan(id);
  }
};
