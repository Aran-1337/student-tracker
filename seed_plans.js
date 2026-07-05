const { createClient } = require("@supabase/supabase-js");

const url = "https://sucemomxyjtinrtylymc.supabase.co";
const service_role = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9panN0cnNsZXF6Y3loZ25hdXF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjg5MjIwOCwiZXhwIjoyMDk4NDY4MjA4fQ.vJr1MU1E8mLUVgvXQszKu1T8lcUoNDVH0GDIsBCzr2M";

const supabase = createClient(url, service_role);

async function run() {
  const plans = [
    {
      name: "باقة الحضور والغياب",
      description: "إدارة كاملة لحضور وغياب الطلاب مع دعم QR Code",
      price: 150,
      duration_months: 1,
      has_bills: false,
      has_attendance: true,
      color: "#14b8a6",
      is_active: true
    },
    {
      name: "الباقة الشاملة",
      description: "إدارة الحضور والغياب بالإضافة إلى إدارة المصروفات والفواتير",
      price: 250,
      duration_months: 1,
      has_bills: true,
      has_attendance: true,
      color: "#8b5cf6",
      is_active: true
    }
  ];

  const { data, error } = await supabase.from("plans").insert(plans).select();
  if (error) {
    console.error("Error inserting plans:", error);
  } else {
    console.log("Success:", data);
  }
}

run();
