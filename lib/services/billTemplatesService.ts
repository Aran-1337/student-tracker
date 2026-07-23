import { BillTemplatesRepository } from "@/lib/repositories/billTemplatesRepository";
import { BillsRepository } from "@/lib/repositories/billsRepository";
import { BillTemplate, Bill } from "@/lib/types";

export const BillTemplatesService = {
  async getByTeacherId(teacherId: string): Promise<BillTemplate[]> {
    return BillTemplatesRepository.getByTeacherId(teacherId);
  },

  async add(template: Omit<BillTemplate, "id" | "created_at">): Promise<BillTemplate> {
    return BillTemplatesRepository.add(template);
  },

  async update(id: string, updates: Partial<Omit<BillTemplate, "id" | "created_at" | "teacher_id">>): Promise<BillTemplate> {
    return BillTemplatesRepository.update(id, updates);
  },

  async remove(id: string): Promise<void> {
    return BillTemplatesRepository.remove(id);
  },

  async toggleActive(template: BillTemplate): Promise<BillTemplate> {
    return BillTemplatesRepository.update(template.id, { is_active: !template.is_active });
  },

  // توليد فواتير شهر معين من القوالب النشطة
  async generateForMonth(
    teacherId: string,
    targetMonth: number,
    targetYear: number,
    templates: BillTemplate[],
    existingBills: Bill[]
  ): Promise<Bill[]> {
    const activeTemplates = templates.filter(t => {
      if (!t.is_active) return false;
      // تحقق من تاريخ الانتهاء
      if (t.end_year && t.end_month) {
        const templateEnd = t.end_year * 12 + t.end_month;
        const target = targetYear * 12 + targetMonth;
        if (target > templateEnd) return false;
      }
      return true;
    });

    if (activeTemplates.length === 0) {
      throw new Error("لا توجد قوالب نشطة للتوليد.");
    }

    // فلتر القوالب اللي مش موجودة في الشهر ده
    const toInsert = activeTemplates.filter(t =>
      !existingBills.some(b =>
        b.template_id === t.id &&
        b.billing_month === targetMonth &&
        b.billing_year === targetYear
      )
    );

    if (toInsert.length === 0) {
      throw new Error("كل القوالب النشطة موجودة بالفعل لهذا الشهر.");
    }

    const rows = toInsert.map(t => ({
      teacher_id: teacherId,
      title: t.title,
      amount: t.amount,
      category: t.category,
      billing_month: targetMonth,
      billing_year: targetYear,
      is_recurring: true,
      template_id: t.id,
    }));

    return BillsRepository.addBills(rows);
  },
};
