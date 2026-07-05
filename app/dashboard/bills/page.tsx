"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Receipt, 
  Plus, 
  Trash2, 
  AlertCircle,
  Calendar,
  FileText,
  RefreshCw,
  Repeat,
  Zap,
  Check
} from "lucide-react";

interface Bill {
  id: string;
  title: string;
  amount: number;
  category: "إيجار" | "رواتب سكرتارية" | "أخرى";
  billing_month: number;
  is_recurring: boolean;
  created_at: string;
}

const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const categories = ["إيجار", "رواتب سكرتارية", "أخرى"];

const catStyle: Record<string, React.CSSProperties> = {
  "إيجار": { background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" },
  "رواتب سكرتارية": { background: "rgba(167,139,250,0.15)", color: "#c084fc", border: "1px solid rgba(167,139,250,0.2)" },
  "أخرى": { background: "rgba(156,163,175,0.15)", color: "#9ca3af", border: "1px solid rgba(156,163,175,0.2)" }
};

export default function BillsManagement() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // App data state
  const [bills, setBills] = useState<Bill[]>([]);

  // Form states
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<"إيجار" | "رواتب سكرتارية" | "أخرى">("إيجار");
  const [billingMonth, setBillingMonth] = useState<number>(new Date().getMonth() + 1);
  const [isRecurring, setIsRecurring] = useState(false);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function loadBills() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setUserId(session.user.id);

        const { data, error } = await supabase
          .from("bills")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setBills(data || []);
      } catch (err: any) {
        showToast("حدث خطأ أثناء تحميل الفواتير.", "error");
      } finally {
        setLoading(false);
      }
    }

    loadBills();
  }, []);

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !userId) {
      showToast("يرجى ملء كافة الحقول المطلوبة.", "error");
      return;
    }

    setActionLoading(true);
    try {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        throw new Error("يرجى إدخال قيمة مالية صحيحة.");
      }

      const { data, error } = await supabase
        .from("bills")
        .insert([
          {
            teacher_id: userId,
            title,
            amount: parsedAmount,
            category,
            billing_month: Number(billingMonth),
            is_recurring: isRecurring
          }
        ])
        .select();

      if (error) throw error;

      setBills([data[0], ...bills]);
      setTitle("");
      setAmount("");
      setIsRecurring(false);
      showToast(isRecurring ? "✓ تم تسجيل الفاتورة المتكررة بنجاح." : "✓ تم تسجيل الفاتورة بنجاح.");
    } catch (err: any) {
      showToast(err.message || "فشل تسجيل الفاتورة.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفاتورة/المصروف نهائياً؟")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("bills")
        .delete()
        .eq("id", billId);

      if (error) throw error;

      setBills(bills.filter(b => b.id !== billId));
      showToast("تم حذف الفاتورة بنجاح.");
    } catch (err: any) {
      showToast(err.message || "فشل حذف الفاتورة.", "error");
    }
  };

  // Generate recurring bills for a target month
  const handleGenerateForMonth = async (targetMonth: number) => {
    if (!userId) return;

    const recurringTemplates = bills.filter(b => b.is_recurring);
    if (recurringTemplates.length === 0) {
      showToast("لا توجد فواتير متكررة مسجلة بعد!", "error");
      return;
    }

    // Check if bills already generated for this month (avoid duplicates)
    const alreadyExists = bills.some(
      b => b.is_recurring && b.billing_month === targetMonth
    );

    if (alreadyExists) {
      if (!confirm(`يبدو أن الفواتير المتكررة موجودة بالفعل لشهر ${arabicMonths[targetMonth - 1]}. هل تريد إضافتها مجدداً؟`)) {
        return;
      }
    }

    setActionLoading(true);
    try {
      // Build insert rows from all recurring templates, changing their month to targetMonth
      const insertRows = recurringTemplates.map(b => ({
        teacher_id: userId,
        title: b.title,
        amount: b.amount,
        category: b.category,
        billing_month: targetMonth,
        is_recurring: true
      }));

      const { data, error } = await supabase
        .from("bills")
        .insert(insertRows)
        .select();

      if (error) throw error;

      setBills([...(data || []), ...bills]);
      showToast(`✓ تم توليد ${insertRows.length} فاتورة متكررة لشهر ${arabicMonths[targetMonth - 1]} بنجاح!`);
    } catch (err: any) {
      showToast(err.message || "فشل توليد الفواتير المتكررة.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Separate recurring templates (unique, earliest per title) and normal bills
  const recurringTemplates = bills.filter(b => b.is_recurring);

  // Filter bills for the main table
  const filteredBills = bills.filter(bill => {
    if (activeFilter === "all") return true;
    return bill.billing_month === Number(activeFilter);
  });

  const totalAmountFiltered = filteredBills.reduce((sum, b) => sum + Number(b.amount), 0);

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>المصروفات والفواتير</h1>
        <p style={{ color: "var(--text-secondary)" }}>تسجيل إيجار القاعات، رواتب السكرتارية، والالتزامات المالية الأخرى</p>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: "350px 1fr" }}>
        {/* Sidebar: Add Bill Form */}
        <aside className="sidebar-panels" style={{ gap: "1rem" }}>
          {/* Add New Bill Form */}
          <div className="glass-panel panel-content">
            <h2 className="panel-title">
              <Receipt size={18} className="stat-icon-amber" style={{ background: "none", border: "none" }} />
              <span>تسجيل فاتورة جديدة</span>
            </h2>
            <form onSubmit={handleAddBill}>
              <div className="form-group">
                <label className="form-label" htmlFor="bTitle">بيان الفاتورة / العنوان</label>
                <input
                  id="bTitle"
                  type="text"
                  required
                  placeholder="مثال: إيجار قاعة أ أو سكرتارية"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bCategory">التصنيف</label>
                <select
                  id="bCategory"
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  style={{ padding: "0.7rem 0.5rem" }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="bAmount">القيمة (ج.م)</label>
                  <input
                    id="bAmount"
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    className="form-input"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ direction: "ltr", textAlign: "right" }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="bMonth">الشهر المالي</label>
                  <select
                    id="bMonth"
                    className="form-input"
                    value={billingMonth}
                    onChange={(e) => setBillingMonth(Number(e.target.value))}
                    style={{ padding: "0.7rem 0.5rem" }}
                  >
                    {arabicMonths.map((m, idx) => (
                      <option key={idx} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recurring Toggle */}
              <div 
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.85rem 1rem",
                  borderRadius: "10px",
                  border: isRecurring 
                    ? "1px solid rgba(16, 185, 129, 0.4)" 
                    : "1px solid var(--border-color)",
                  background: isRecurring 
                    ? "rgba(16, 185, 129, 0.07)" 
                    : "rgba(255,255,255,0.02)",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  marginBottom: "0.75rem"
                }}
                onClick={() => setIsRecurring(!isRecurring)}
              >
                <div style={{
                  width: "42px",
                  height: "24px",
                  borderRadius: "12px",
                  background: isRecurring ? "#10b981" : "rgba(255,255,255,0.1)",
                  position: "relative",
                  transition: "background 0.25s ease",
                  flexShrink: 0
                }}>
                  <div style={{
                    position: "absolute",
                    top: "3px",
                    right: isRecurring ? "3px" : "calc(100% - 21px)",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    transition: "right 0.25s ease",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.3)"
                  }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: isRecurring ? "#10b981" : "var(--text-primary)" }}>
                    <Repeat size={13} style={{ display: "inline", marginLeft: "4px", verticalAlign: "middle" }} />
                    فاتورة متكررة شهرياً
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    {isRecurring ? "ستُضاف تلقائياً لكل شهر بضغطة زر" : "فاتورة لمرة واحدة فقط"}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "0.25rem" }}
                disabled={actionLoading}
              >
                <Plus size={18} />
                <span>{actionLoading ? "جاري التسجيل..." : "تسجيل الفاتورة"}</span>
              </button>
            </form>
          </div>

          {/* Recurring Bills Auto-Generator Panel */}
          <div className="glass-panel panel-content" style={{ borderColor: "rgba(16,185,129,0.2)" }}>
            <h2 className="panel-title">
              <Zap size={18} style={{ color: "#10b981", background: "none", border: "none" }} />
              <span style={{ color: "#10b981" }}>توليد الفواتير المتكررة</span>
            </h2>

            {recurringTemplates.length === 0 ? (
              <div style={{ textAlign: "center", padding: "1rem 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                <Repeat size={32} style={{ opacity: 0.3, display: "block", margin: "0 auto 0.5rem auto" }} />
                لا توجد فواتير متكررة بعد.<br/>
                سجل فاتورة وفعّل خيار "متكررة شهرياً"
              </div>
            ) : (
              <>
                {/* Recurring templates summary */}
                <div style={{ marginBottom: "1rem" }}>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.6rem", fontWeight: 600 }}>
                    {recurringTemplates.length} فاتورة متكررة مسجلة:
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {/* Show distinct recurring bills (by title) */}
                    {Array.from(new Map(recurringTemplates.map(b => [b.title + b.amount, b])).values()).map(b => (
                      <div key={b.id} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        background: "rgba(16,185,129,0.06)",
                        border: "1px solid rgba(16,185,129,0.15)",
                        fontSize: "0.82rem"
                      }}>
                        <span style={{ color: "#d1fae5" }}>{b.title}</span>
                        <span className="monospace" style={{ color: "#f87171", fontWeight: 700 }}>-{b.amount} ج.م</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Month picker to generate for */}
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>
                  اختر الشهر لتوليد الفواتير له:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.4rem" }}>
                  {arabicMonths.map((m, idx) => {
                    const monthNum = idx + 1;
                    const alreadyGenerated = bills.some(
                      b => b.is_recurring && b.billing_month === monthNum
                    );
                    return (
                      <button
                        key={idx}
                        className="btn btn-secondary"
                        onClick={() => handleGenerateForMonth(monthNum)}
                        disabled={actionLoading}
                        style={{
                          padding: "0.4rem 0.25rem",
                          fontSize: "0.75rem",
                          position: "relative",
                          border: alreadyGenerated 
                            ? "1px solid rgba(16,185,129,0.4)"
                            : "1px solid var(--border-color)",
                          color: alreadyGenerated ? "#10b981" : "var(--text-secondary)"
                        }}
                        title={alreadyGenerated ? `تم التوليد لشهر ${m} مسبقاً` : `توليد فواتير ${m}`}
                      >
                        {alreadyGenerated && (
                          <Check size={10} style={{ position: "absolute", top: "3px", left: "3px", color: "#10b981" }} />
                        )}
                        {m}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Left Side: Bills List */}
        <section className="glass-panel panel-content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 className="panel-title" style={{ margin: 0 }}>
              <FileText size={18} style={{ color: "var(--color-info)" }} />
              <span>فواتير المصروفات ({filteredBills.length})</span>
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>إجمالي التصفية:</span>
              <span className="monospace" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f87171" }}>{totalAmountFiltered} ج.م</span>
            </div>
          </div>

          {/* Month Filter Chips */}
          <div className="chips-container">
            <button 
              className={`chip ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              كل الشهور
            </button>
            {arabicMonths.map((m, idx) => (
              <button 
                key={idx}
                className={`chip ${activeFilter === String(idx + 1) ? "active" : ""}`}
                onClick={() => setActiveFilter(String(idx + 1))}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Bills Table */}
          <div className="table-container">
            {filteredBills.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={48} className="empty-state-icon" />
                <p>لا توجد أي فواتير مسجلة لشهر التصفية الحالي.</p>
              </div>
            ) : (
              <table className="students-table">
                <thead>
                  <tr>
                    <th>بيان الفاتورة</th>
                    <th>التصنيف</th>
                    <th>الشهر المالي</th>
                    <th>القيمة المالية</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map(bill => (
                    <tr key={bill.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {bill.is_recurring && (
                            <span title="فاتورة متكررة">
                              <Repeat size={13} style={{ color: "#10b981", flexShrink: 0 }} />
                            </span>
                          )}
                          <span style={{ fontWeight: 600, color: "#ffffff" }}>{bill.title}</span>
                        </div>
                      </td>
                      <td>
                        <span 
                          style={{ 
                            display: "inline-block", 
                            fontSize: "0.8rem", 
                            padding: "2px 8px", 
                            borderRadius: "4px",
                            ...catStyle[bill.category]
                          }}
                        >
                          {bill.category}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Calendar size={14} style={{ color: "var(--text-muted)" }} />
                          <span>{arabicMonths[bill.billing_month - 1]}</span>
                        </div>
                      </td>
                      <td>
                        <span className="monospace" style={{ fontWeight: 700, color: "#f87171" }}>
                          -{bill.amount} ج.م
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-secondary btn-icon"
                          onClick={() => handleDeleteBill(bill.id)}
                          title="حذف الفاتورة"
                          style={{ border: "none", background: "none" }}
                        >
                          <Trash2 size={16} className="color-danger" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div className={`alert-toast ${toast.type === "success" ? "alert-success" : "alert-error"}`}>
          {toast.type === "error" ? <AlertCircle size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
