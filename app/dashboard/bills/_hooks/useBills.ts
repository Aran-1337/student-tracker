"use client";

import { useState, useEffect, useCallback } from "react";
import { BillTemplatesService } from "@/lib/services/billTemplatesService";
import { AuthService } from "@/lib/services/authService";
import { BillsService } from "@/lib/services/billsService";
import { Bill, BillTemplate } from "@/lib/types";

export const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export const CATEGORIES = ["إيجار", "رواتب سكرتارية", "أخرى"] as const;
export type Category = typeof CATEGORIES[number];

export const CAT_STYLE: Record<string, React.CSSProperties> = {
  "إيجار": { background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" },
  "رواتب سكرتارية": { background: "rgba(167,139,250,0.15)", color: "#c084fc", border: "1px solid rgba(167,139,250,0.2)" },
  "أخرى": { background: "rgba(156,163,175,0.15)", color: "#9ca3af", border: "1px solid rgba(156,163,175,0.2)" },
};

export function useBills() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [bills, setBills] = useState<Bill[]>([]);
  const [templates, setTemplates] = useState<BillTemplate[]>([]);

  const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(new Set());
  const [activeMonth, setActiveMonth] = useState<string>("all");
  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());

  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "table">("overview");

  // Banner: هل الشهر الحالي لسه ما اتولدش؟
  const [showGenerateBanner, setShowGenerateBanner] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Load ──────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await AuthService.getSession();
        if (!session) return;
        setUserId(session.user.id);

        const [billsData, templatesData] = await Promise.all([
          BillsService.getBillsByTeacherId(session.user.id),
          BillTemplatesService.getByTeacherId(session.user.id),
        ]);

        setBills(billsData || []);
        setTemplates(templatesData || []);
      } catch {
        showToast("حدث خطأ أثناء تحميل البيانات.", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  // ── Banner logic: يظهر لو في قوالب نشطة والشهر الحالي ما اتولدش ──
  useEffect(() => {
    if (loading) return;
    const now = new Date();
    const cm = now.getMonth() + 1;
    const cy = now.getFullYear();
    const activeTemplates = templates.filter(t => {
      if (!t.is_active) return false;
      if (t.end_year && t.end_month) {
        return cy * 12 + cm <= t.end_year * 12 + t.end_month;
      }
      return true;
    });
    if (activeTemplates.length === 0) { setShowGenerateBanner(false); return; }

    const alreadyGenerated = activeTemplates.every(t =>
      bills.some(b => b.template_id === t.id && b.billing_month === cm && b.billing_year === cy)
    );
    setShowGenerateBanner(!alreadyGenerated);
  }, [bills, templates, loading]);

  // ── Bills CRUD ────────────────────────────────────────────────
  const handleAddBill = useCallback(async (
    title: string, amount: string, category: Category,
    billingMonth: number, billingYear: number, isRecurring: boolean
  ) => {
    if (!userId) return false;
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      showToast("يرجى إدخال قيمة مالية صحيحة.", "error");
      return false;
    }
    setActionLoading(true);
    try {
      const newBill = await BillsService.addBill({
        teacher_id: userId, title, amount: parsedAmount,
        category, billing_month: billingMonth, billing_year: billingYear, is_recurring: isRecurring,
      });
      setBills(prev => [newBill, ...prev]);
      showToast("✓ تم تسجيل الفاتورة بنجاح.");
      return true;
    } catch (err: any) {
      showToast(err.message || "فشل تسجيل الفاتورة.", "error");
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [userId, showToast]);

  const handleUpdateBill = useCallback(async (
    id: string, updates: Partial<Omit<Bill, "id" | "created_at" | "teacher_id">>
  ) => {
    setActionLoading(true);
    try {
      const updated = await BillsService.updateBill(id, updates);
      setBills(prev => prev.map(b => b.id === id ? updated : b));
      setEditingBill(null);
      showToast("✓ تم تعديل الفاتورة بنجاح.");
    } catch (err: any) {
      showToast(err.message || "فشل تعديل الفاتورة.", "error");
    } finally {
      setActionLoading(false);
    }
  }, [showToast]);

  const handleDeleteBill = useCallback(async (billId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفاتورة نهائياً؟")) return;
    try {
      await BillsService.deleteBill(billId);
      setBills(prev => prev.filter(b => b.id !== billId));
      setSelectedBillIds(prev => { const n = new Set(prev); n.delete(billId); return n; });
      showToast("تم حذف الفاتورة بنجاح.");
    } catch (err: any) {
      showToast(err.message || "فشل حذف الفاتورة.", "error");
    }
  }, [showToast]);

  const handleBulkDelete = useCallback(async () => {
    const count = selectedBillIds.size;
    if (!count || !confirm(`هل أنت متأكد من حذف ${count} فاتورة؟`)) return;
    setActionLoading(true);
    try {
      await BillsService.deleteBills(Array.from(selectedBillIds));
      setBills(prev => prev.filter(b => !selectedBillIds.has(b.id)));
      setSelectedBillIds(new Set());
      showToast(`✓ تم حذف ${count} فاتورة بنجاح.`);
    } catch (err: any) {
      showToast(err.message || "فشل حذف الفواتير.", "error");
    } finally {
      setActionLoading(false);
    }
  }, [selectedBillIds, showToast]);

  // ── Templates CRUD ────────────────────────────────────────────
  const handleAddTemplate = useCallback(async (
    data: Omit<BillTemplate, "id" | "created_at">
  ) => {
    setActionLoading(true);
    try {
      const t = await BillTemplatesService.add(data);
      setTemplates(prev => [t, ...prev]);
      showToast("✓ تم إضافة القالب بنجاح.");
      return true;
    } catch (err: any) {
      showToast(err.message || "فشل إضافة القالب.", "error");
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [showToast]);

  const handleUpdateTemplate = useCallback(async (
    id: string, updates: Partial<Omit<BillTemplate, "id" | "created_at" | "teacher_id">>
  ) => {
    setActionLoading(true);
    try {
      const updated = await BillTemplatesService.update(id, updates);
      setTemplates(prev => prev.map(t => t.id === id ? updated : t));
      showToast("✓ تم تعديل القالب بنجاح.");
    } catch (err: any) {
      showToast(err.message || "فشل تعديل القالب.", "error");
    } finally {
      setActionLoading(false);
    }
  }, [showToast]);

  const handleToggleTemplate = useCallback(async (template: BillTemplate) => {
    try {
      const updated = await BillTemplatesService.toggleActive(template);
      setTemplates(prev => prev.map(t => t.id === template.id ? updated : t));
      showToast(updated.is_active ? "✓ تم تفعيل القالب." : "تم إيقاف القالب.");
    } catch (err: any) {
      showToast(err.message || "فشل تغيير حالة القالب.", "error");
    }
  }, [showToast]);

  const handleDeleteTemplate = useCallback(async (id: string) => {
    if (!confirm("هل تريد حذف هذا القالب؟ لن تتأثر الفواتير المولّدة منه.")) return;
    try {
      await BillTemplatesService.remove(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      showToast("تم حذف القالب.");
    } catch (err: any) {
      showToast(err.message || "فشل حذف القالب.", "error");
    }
  }, [showToast]);

  // ── Generate from templates ───────────────────────────────────
  const handleGenerateForMonth = useCallback(async (targetMonth: number, targetYear: number) => {
    if (!userId) return;
    setActionLoading(true);
    try {
      const generated = await BillTemplatesService.generateForMonth(userId, targetMonth, targetYear, templates, bills);
      setBills(prev => [...generated, ...prev]);
      showToast(`✓ تم توليد ${generated.length} فاتورة لشهر ${arabicMonths[targetMonth - 1]} ${targetYear}!`);
      setShowGenerateBanner(false);
    } catch (err: any) {
      showToast(err.message || "فشل توليد الفواتير.", "error");
    } finally {
      setActionLoading(false);
    }
  }, [userId, bills, templates, showToast]);

  const handleDeleteMonthBills = useCallback(async (targetMonth: number, targetYear: number) => {
    if (!userId || !confirm(`هل تريد حذف الفواتير المتكررة لشهر ${arabicMonths[targetMonth - 1]} ${targetYear}؟`)) return;
    setActionLoading(true);
    try {
      await BillsService.deleteRecurringBillsForMonth(targetMonth, targetYear, userId);
      setBills(prev => prev.filter(b => !(b.is_recurring && b.billing_month === targetMonth && b.billing_year === targetYear)));
      showToast(`✓ تم حذف الفواتير المتكررة لشهر ${arabicMonths[targetMonth - 1]} ${targetYear}.`);
    } catch (err: any) {
      showToast(err.message || "فشل حذف الفواتير.", "error");
    } finally {
      setActionLoading(false);
    }
  }, [userId, showToast]);

  // ── Selection helpers ─────────────────────────────────────────
  const handleSelectAll = useCallback((filteredBills: Bill[]) => {
    const allSelected = filteredBills.length > 0 && filteredBills.every(b => selectedBillIds.has(b.id));
    setSelectedBillIds(prev => {
      const next = new Set(prev);
      if (allSelected) filteredBills.forEach(b => next.delete(b.id));
      else filteredBills.forEach(b => next.add(b.id));
      return next;
    });
  }, [selectedBillIds]);

  const handleToggleRow = useCallback((id: string) => {
    setSelectedBillIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ── Derived data ──────────────────────────────────────────────
  const filteredBills = bills.filter(b => {
    const yearMatch = b.billing_year === activeYear;
    const monthMatch = activeMonth === "all" || b.billing_month === Number(activeMonth);
    return yearMatch && monthMatch;
  });

  const totalFiltered = filteredBills.reduce((s, b) => s + Number(b.amount), 0);
  const totalYear = bills.filter(b => b.billing_year === activeYear).reduce((s, b) => s + Number(b.amount), 0);

  const categoryTotals = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = bills.filter(b => b.billing_year === activeYear && b.category === cat)
      .reduce((s, b) => s + Number(b.amount), 0);
    return acc;
  }, {} as Record<string, number>);

  const availableYears = Array.from(new Set(bills.map(b => b.billing_year))).sort((a, b) => b - a);
  if (!availableYears.includes(activeYear)) availableYears.unshift(activeYear);

  const allFilteredSelected = filteredBills.length > 0 && filteredBills.every(b => selectedBillIds.has(b.id));
  const someFilteredSelected = filteredBills.some(b => selectedBillIds.has(b.id));

  const recurringTemplates = Array.from(
    new Map(
      bills.filter(b => b.is_recurring)
        .map(b => [`${b.title}|${b.category}|${b.amount}`, b])
    ).values()
  );

  const activeTemplatesCount = templates.filter(t => t.is_active).length;

  return {
    loading, actionLoading, userId,
    bills, filteredBills, totalFiltered, totalYear, categoryTotals,
    recurringTemplates,
    templates, activeTemplatesCount,
    selectedBillIds, allFilteredSelected, someFilteredSelected,
    activeMonth, setActiveMonth,
    activeYear, setActiveYear, availableYears,
    editingBill, setEditingBill,
    showAddForm, setShowAddForm,
    activeTab, setActiveTab,
    showGenerateBanner, setShowGenerateBanner,
    toast,
    handleAddBill, handleUpdateBill, handleDeleteBill, handleBulkDelete,
    handleAddTemplate, handleUpdateTemplate, handleToggleTemplate, handleDeleteTemplate,
    handleGenerateForMonth, handleDeleteMonthBills,
    handleSelectAll, handleToggleRow,
  };
}
