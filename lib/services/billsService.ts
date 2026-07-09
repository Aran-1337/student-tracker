import { BillsRepository } from "@/lib/repositories/billsRepository";
import { Bill } from "@/lib/types";

export const BillsService = {
  async getBillsByTeacherId(teacherId: string): Promise<Bill[]> {
    return BillsRepository.getBillsByTeacherId(teacherId);
  },

  async addBill(bill: Omit<Bill, "id" | "created_at">): Promise<Bill> {
    return BillsRepository.addBill(bill);
  },

  async deleteBill(id: string): Promise<void> {
    return BillsRepository.deleteBill(id);
  },

  async deleteBills(ids: string[]): Promise<void> {
    return BillsRepository.deleteBills(ids);
  },

  async generateRecurringBillsForMonth(targetMonth: number, teacherId: string, currentBills: Bill[]): Promise<Bill[]> {
    const allRecurring = currentBills.filter(b => b.is_recurring);
    if (allRecurring.length === 0) {
      throw new Error("لا توجد فواتير متكررة مسجلة بعد!");
    }

    const uniqueTemplatesMap = new Map<string, Bill>();
    for (const b of allRecurring) {
      const key = `${b.title}|${b.category}|${b.amount}`;
      if (!uniqueTemplatesMap.has(key)) {
        uniqueTemplatesMap.set(key, b);
      }
    }
    const uniqueTemplates = Array.from(uniqueTemplatesMap.values());

    const toInsert = uniqueTemplates.filter(template => {
      return !currentBills.some(
        b =>
          b.is_recurring &&
          b.billing_month === targetMonth &&
          b.title === template.title &&
          b.category === template.category &&
          Number(b.amount) === Number(template.amount)
      );
    });

    if (toInsert.length === 0) {
      throw new Error(`الفواتير المتكررة موجودة بالفعل لهذا الشهر! لا يوجد جديد للإضافة.`);
    }

    const insertRows = toInsert.map(b => ({
      teacher_id: teacherId,
      title: b.title,
      amount: b.amount,
      category: b.category,
      billing_month: targetMonth,
      is_recurring: true
    }));

    return BillsRepository.addBills(insertRows);
  },

  async deleteRecurringBillsForMonth(monthNum: number, teacherId: string): Promise<void> {
    return BillsRepository.deleteRecurringBillsForMonth(monthNum, teacherId);
  }
};
