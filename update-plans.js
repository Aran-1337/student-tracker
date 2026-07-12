const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: plans } = await supabase.from('plans').select('*');
  console.log('Found plans:', plans?.length);

  if (plans) {
    for (const plan of plans) {
      if (plan.name.includes("الحضور") || plan.price === 150) {
        await supabase.from('plans').update({
          name: "الباقة الأساسية",
          price: 250,
          annual_price: 2500,
          description: JSON.stringify({ summary: "مثالية للمعلم المستقل والمجموعات الصغيرة", customFeatures: ["إدارة الطلاب والمجموعات", "التقارير المالية المبسطة", "نظام الخصومات وتعديل ملف الطالب"] })
        }).eq('id', plan.id);
      } else if (plan.name.includes("الشاملة") || plan.price === 250) {
        await supabase.from('plans').update({
          name: "الباقة المحترفة",
          price: 450,
          annual_price: 4500,
          description: JSON.stringify({ summary: "الأكثر مبيعاً - إدارة احترافية وأتمتة كاملة", customFeatures: ["إدارة الطلاب والمجموعات", "نظام الخصومات وتعديل ملف الطالب", "الحضور والغياب + QR", "المصروفات والفواتير"] })
        }).eq('id', plan.id);
      } else if (plan.name.includes("السنتر") || plan.price === 500) {
        await supabase.from('plans').update({
          name: "باقة السنتر",
          price: 850,
          annual_price: 8500,
          description: JSON.stringify({ summary: "للمعلمين الكبار والسناتر - إدارة الفريق الفرعي وتعدد المدرسين", customFeatures: ["جميع مميزات الباقة المحترفة", "نظام السنتر وصلاحيات المعاونين", "حسابات إيرادات المدرسين المتعددين"] })
        }).eq('id', plan.id);
      }
    }
    console.log("Done updating plans!");
  }
}

main();
