"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Package,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  AlertCircle,
  Receipt,
  ClipboardCheck,
  Users,
  TrendingUp,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  annual_price?: number;
  duration_months: number;
  has_bills: boolean;
  has_attendance: boolean;
  has_center_mode?: boolean;
  color: string;
  is_active: boolean;
  created_at: string;
}

const defaultForm = {
  name: "",
  description: "",
  customFeatures: [
    "إدارة الطلاب والمجموعات",
    "نظام الخصومات وتعديل ملف الطالب",
    "التقارير المالية",
    "الحضور والغياب + QR",
    "المصروفات والفواتير"
  ] as string[],
  price: "" as string | number,
  annual_price: "" as string | number,
  duration_months: 1,
  has_bills: false,
  has_attendance: false,
  has_center_mode: false,
  color: "#14b8a6",
  is_active: true
};

function parseDescription(desc: string | null): { summary: string; customFeatures: string[] } {
  if (!desc) return { summary: "", customFeatures: [] };
  try {
    const parsed = JSON.parse(desc);
    if (parsed && typeof parsed === "object") {
      return { 
        summary: parsed.summary || "", 
        customFeatures: Array.isArray(parsed.customFeatures) ? parsed.customFeatures : []
      };
    }
  } catch (e) {}
  return { summary: desc, customFeatures: [] };
}

const featureList = [
  { key: "has_bills", label: "المصروفات والفواتير", icon: Receipt, color: "#a78bfa" },
  { key: "has_attendance", label: "الحضور والغياب", icon: ClipboardCheck, color: "#14b8a6" },
  { key: "has_center_mode", label: "نظام السنتر (إضافة معلمين)", icon: Users, color: "#f59e0b" }
];

const colorOptions = [
  "#64748b", "#14b8a6", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981"
];

export default function PlansPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      const { data: teacher } = await supabase.from("teachers").select("is_admin").eq("id", session.user.id).single();
      if (!teacher?.is_admin) { router.replace("/dashboard"); return; }
      
      let { data: plansData, error } = await supabase.from("plans").select("*").order("created_at", { ascending: true });
      if (error) {
        showToast("فشل جلب الباقات من قاعدة البيانات", "error");
      }
      
      if (!plansData || plansData.length === 0) {
        const defaultPlans = [
          {
            id: "plan-1",
            name: "الباقة الأساسية",
            description: JSON.stringify({ summary: "مثالية للمعلم المستقل والمجموعات الصغيرة", customFeatures: ["إدارة الطلاب والمجموعات", "التقارير المالية المبسطة", "نظام الخصومات وتعديل ملف الطالب"] }),
            price: 250,
            annual_price: 2500,
            duration_months: 1,
            has_bills: false,
            has_attendance: false,
            has_center_mode: false,
            color: "#14b8a6",
            is_active: true
          },
          {
            id: "plan-2",
            name: "الباقة المحترفة",
            description: JSON.stringify({ summary: "الأكثر مبيعاً - إدارة احترافية وأتمتة كاملة", customFeatures: ["إدارة الطلاب والمجموعات", "نظام الخصومات وتعديل ملف الطالب", "الحضور والغياب + QR", "المصروفات والفواتير"] }),
            price: 450,
            annual_price: 4500,
            duration_months: 1,
            has_bills: true,
            has_attendance: true,
            has_center_mode: false,
            color: "#3b82f6",
            is_active: true
          },
          {
            id: "plan-3",
            name: "باقة السنتر",
            description: JSON.stringify({ summary: "للمعلمين الكبار والسناتر - إدارة الفريق الفرعي وتعدد المدرسين", customFeatures: ["جميع مميزات الباقة المحترفة", "نظام السنتر وصلاحيات المعاونين", "حسابات إيرادات المدرسين المتعددين"] }),
            price: 850,
            annual_price: 8500,
            duration_months: 1,
            has_bills: true,
            has_attendance: true,
            has_center_mode: true,
            color: "#f59e0b",
            is_active: true
          }
        ];
        
        await supabase.from("plans").insert(defaultPlans);
        setPlans(defaultPlans as any);
      } else {
        setPlans(plansData as any);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const openCreate = () => {
    setEditingPlan(null);
    setForm(defaultForm);
    setNewFeature("");
    setShowForm(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    const { summary, customFeatures } = parseDescription(plan.description);
    setForm({
      name: plan.name,
      description: summary,
      customFeatures: customFeatures,
      price: plan.price,
      annual_price: plan.annual_price || 0,
      duration_months: plan.duration_months,
      has_bills: plan.has_bills,
      has_attendance: plan.has_attendance,
      has_center_mode: plan.has_center_mode || false,
      color: plan.color,
      is_active: plan.is_active
    });
    setNewFeature("");
    setShowForm(true);
  };

  const [newFeature, setNewFeature] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { showToast("اسم الباقة مطلوب", "error"); return; }
    setSaving(true);
    
    const parsedAnnualPrice = Number(form.annual_price) || 0;

    // Serialize description and custom features
    const payloadDesc = JSON.stringify({
      summary: form.description,
      customFeatures: form.customFeatures
    });
    
    try {
      let updatedPlans = [...plans];
      const parsedPrice = Number(form.price) || 0;
      
      if (editingPlan) {
        const { error } = await supabase.from("plans").update({
          name: form.name,
          description: payloadDesc,
          price: parsedPrice,
          annual_price: parsedAnnualPrice,
          duration_months: form.duration_months,
          has_bills: form.has_bills,
          has_attendance: form.has_attendance,
          has_center_mode: form.has_center_mode,
          color: form.color,
          is_active: form.is_active
        }).eq("id", editingPlan.id);
        
        if (error) throw error;

        updatedPlans = plans.map(p => p.id === editingPlan.id ? { ...p, ...form, price: parsedPrice, annual_price: parsedAnnualPrice, description: payloadDesc } : p);
        showToast("✓ تم تحديث الباقة بنجاح");
      } else {
        const { customFeatures, ...restForm } = form;
        const newPlan = { id: `plan-${Date.now()}`, ...restForm, price: parsedPrice, annual_price: parsedAnnualPrice, description: payloadDesc, created_at: new Date().toISOString() };
        
        const { error } = await supabase.from("plans").insert([newPlan]);
        if (error) throw error;

        updatedPlans = [...plans, newPlan];
        showToast("✓ تم إنشاء الباقة بنجاح");
      }
      setPlans(updatedPlans as any);
      setShowForm(false);
    } catch (err: any) {
      showToast(err.message || "فشل حفظ الباقة", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`هل تريد حذف باقة "${plan.name}"؟ المعلمون المرتبطون بها لن يتأثروا.`)) return;
    
    const { error } = await supabase.from("plans").delete().eq("id", plan.id);
    if (error) {
      showToast("فشل حذف الباقة", "error");
      return;
    }
    
    const updatedPlans = plans.filter(p => p.id !== plan.id);
    setPlans(updatedPlans);
    showToast("✓ تم حذف الباقة");
  };

  if (loading) return <div className="loading-wrapper"><div className="spinner" /></div>;

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
            <Link href="/admin" style={{ color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.88rem" }}>
              <ArrowRight size={15} /> لوحة المدير
            </Link>
          </div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>باقات الاشتراك</h1>
          <p style={{ color: "var(--text-secondary)" }}>اختر الباقة المناسبة لطبيعة عملك لتنظيم سنترك بكفاءة تامة</p>
        </div>
        
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          {/* Toggle Switch */}
          <div style={{ 
            display: "inline-flex", alignItems: "center", background: "var(--bg-secondary)", 
            padding: "4px", borderRadius: "30px", border: "1px solid var(--border-color)"
          }}>
            <button 
              onClick={() => setIsAnnual(false)}
              style={{
                background: !isAnnual ? "var(--color-teal)" : "transparent",
                color: !isAnnual ? "#fff" : "var(--text-secondary)",
                padding: "8px 20px", borderRadius: "24px", border: "none",
                cursor: "pointer", fontSize: "0.95rem", fontWeight: !isAnnual ? 600 : 400,
                transition: "all 0.3s ease"
              }}
            >شهري</button>
            <button 
              onClick={() => setIsAnnual(true)}
              style={{
                background: isAnnual ? "var(--color-teal)" : "transparent",
                color: isAnnual ? "#fff" : "var(--text-secondary)",
                padding: "8px 20px", borderRadius: "24px", border: "none",
                cursor: "pointer", fontSize: "0.95rem", fontWeight: isAnnual ? 600 : 400,
                transition: "all 0.3s ease"
              }}
            >سنوي (وفر شهرين)</button>
          </div>

          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={18} />
            <span>باقة جديدة</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div className="glass-panel panel-content">
          <div className="empty-state">
            <Package size={56} className="empty-state-icon" />
            <p style={{ fontSize: "1.05rem" }}>لا توجد باقات بعد</p>
            <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /><span>أنشئ باقتك الأولى</span></button>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {plans.map(plan => (
            <div key={plan.id} className="glass-panel panel-content" style={{
              borderTop: `3px solid ${plan.color}`,
              opacity: plan.is_active ? 1 : 0.55
            }}>
              {/* Plan Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{
                      width: "10px", height: "10px", borderRadius: "50%",
                      background: plan.color, display: "inline-block", flexShrink: 0
                    }} />
                    <h3 style={{ fontSize: "1.2rem", color: "#fff" }}>{plan.name}</h3>
                    {!plan.is_active && <span style={{ fontSize: "0.7rem", padding: "1px 6px", borderRadius: "4px", background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>معطّلة</span>}
                  </div>
                  {(() => {
                    const { summary } = parseDescription(plan.description);
                    return summary ? <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{summary}</p> : null;
                  })()}
                </div>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button onClick={() => openEdit(plan)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }} title="تعديل">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(plan)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }} title="حذف">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Price */}
              <div style={{ marginBottom: "1.25rem", display: "flex", flexDirection: "column" }}>
                <div>
                  <span style={{ fontSize: "2.5rem", fontWeight: 900, color: plan.color, fontFamily: "JetBrains Mono, monospace" }}>
                    {isAnnual ? (plan.annual_price || plan.price * 10).toLocaleString("ar-EG") : plan.price.toLocaleString("ar-EG")}
                  </span>
                  <span style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginRight: "0.35rem" }}>
                    جنيه / {isAnnual ? "سنوياً" : "شهرياً"}
                  </span>
                </div>
                {isAnnual && plan.price > 0 && (
                  <div style={{ fontSize: "0.85rem", color: "#10b981", fontWeight: 600, marginTop: "4px" }}>
                    يوفر {(plan.price * 12) - (plan.annual_price || plan.price * 10)} جنيه مقارنة بالدفع الشهري!
                  </div>
                )}
              </div>

              {/* Custom Features */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {parseDescription(plan.description).customFeatures.map((f, i) => (
                  <div key={`custom-${i}`} style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    fontSize: "0.85rem", color: "var(--text-primary)"
                  }}>
                    <CheckCircle2 size={15} style={{ color: plan.color, flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>

              {/* Subscribe Button */}
              <button style={{
                width: "100%", marginTop: "1.5rem", padding: "10px",
                borderRadius: "8px", border: `1px solid ${plan.color}`,
                background: "transparent", color: plan.color,
                fontWeight: 600, fontSize: "1rem", cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = plan.color;
                e.currentTarget.style.color = "#fff";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = plan.color;
              }}>
                اشترك الآن
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
        }} onClick={() => setShowForm(false)}>
          <div style={{
            background: "var(--bg-secondary)", borderRadius: "20px",
            border: "1px solid var(--border-color)", padding: "2rem",
            width: "100%", maxWidth: "480px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
            maxHeight: "90vh", overflowY: "auto"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem" }}>{editingPlan ? "تعديل الباقة" : "باقة جديدة"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">اسم الباقة *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مثال: الباقة المحترفة" required />
              </div>

              <div className="form-group">
                <label className="form-label">وصف مختصر</label>
                <input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="وصف قصير للباقة" />
              </div>

              {/* Custom Features Input */}
              <div className="form-group" style={{ background: "rgba(0,0,0,0.1)", padding: "1rem", borderRadius: "8px", border: "1px dashed var(--border-color)" }}>
                <label className="form-label" style={{ marginBottom: "0.5rem" }}>مميزات إضافية (اختياري)</label>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <input 
                    className="form-input" 
                    value={newFeature} 
                    onChange={e => setNewFeature(e.target.value)} 
                    placeholder="مثال: استخراج تقارير PDF"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newFeature.trim()) {
                          setForm({ ...form, customFeatures: [...form.customFeatures, newFeature.trim()] });
                          setNewFeature("");
                        }
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      if (newFeature.trim()) {
                        setForm({ ...form, customFeatures: [...form.customFeatures, newFeature.trim()] });
                        setNewFeature("");
                      }
                    }}
                  >
                    إضافة
                  </button>
                </div>
                {form.customFeatures.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {form.customFeatures.map((f, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-primary)", padding: "0.4rem 0.75rem", borderRadius: "6px", fontSize: "0.85rem" }}>
                        <span>{f}</span>
                        <button type="button" onClick={() => setForm({ ...form, customFeatures: form.customFeatures.filter((_, idx) => idx !== i) })} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">السعر الشهري (جنيه)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={form.price === 0 ? "" : form.price} 
                    onChange={e => setForm({ ...form, price: e.target.value === "" ? 0 : Number(e.target.value) })} 
                    min={0} 
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">السعر السنوي (جنيه)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={form.annual_price === 0 ? "" : form.annual_price} 
                    onChange={e => setForm({ ...form, annual_price: e.target.value === "" ? 0 : Number(e.target.value) })} 
                    min={0} 
                  />
                </div>
              </div>

              {/* Color picker */}
              <div className="form-group">
                <label className="form-label">لون الباقة</label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {colorOptions.map(c => (
                    <button type="button" key={c} onClick={() => setForm({ ...form, color: c })} style={{
                      width: "32px", height: "32px", borderRadius: "50%",
                      background: c, border: form.color === c ? "3px solid #fff" : "2px solid transparent",
                      cursor: "pointer", outline: form.color === c ? `2px solid ${c}` : "none",
                      transition: "all 0.15s"
                    }} />
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: "0.25rem" }}>صلاحيات النظام البرمجية</label>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>تفعيل هذه الخيارات يمنح المعلم الصلاحية البرمجية، لكنها لن تظهر كنص في الباقة إلا إذا أضفتها يدوياً في "مميزات إضافية" بالأعلى.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {featureList.map(feat => {
                    const included = form[feat.key as keyof typeof form] as boolean;
                    return (
                      <label key={feat.key} style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        padding: "0.65rem 1rem", borderRadius: "10px", cursor: "pointer",
                        border: `1px solid ${included ? feat.color + "40" : "var(--border-color)"}`,
                        background: included ? feat.color + "12" : "transparent",
                        transition: "all 0.15s"
                      }}>
                        <input type="checkbox" checked={included}
                          onChange={e => setForm({ ...form, [feat.key]: e.target.checked })}
                          style={{ width: "16px", height: "16px", accentColor: feat.color }} />
                        <feat.icon size={16} style={{ color: feat.color }} />
                        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{feat.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Active toggle */}
              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                    style={{ width: "16px", height: "16px", accentColor: "var(--color-teal)" }} />
                  <span className="form-label" style={{ margin: 0 }}>الباقة متاحة (مفعّلة)</span>
                </label>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={saving}>
                  <Check size={16} />
                  <span>{saving ? "جاري الحفظ..." : (editingPlan ? "حفظ التعديلات" : "إنشاء الباقة")}</span>
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  <X size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`alert-toast ${toast.type === "success" ? "alert-success" : "alert-error"}`}>
          {toast.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
