const PROJECT_REF = "sucemomxyjtinrtylymc";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1Y2Vtb214eWp0aW5ydHlseW1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzE5MzAxOCwiZXhwIjoyMDk4NzY5MDE4fQ.S5Hniy5SG4nG2sC7AOK7GSUOkBeOzGzy7Z5UowigOnw";

const queries = [
  `ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS session_date date`,
  `ALTER TABLE public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_student_id_session_number_month_year_key`,
  `ALTER TABLE public.attendance_records ALTER COLUMN session_number DROP NOT NULL`,
];

const checkConstraint = `
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'attendance_records' AND constraint_name = 'attendance_records_student_id_session_date_key'
`;

const addConstraint = `ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_student_id_session_date_key UNIQUE (student_id, session_date)`;

async function runSQL(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

for (const q of queries) {
  console.log("Running:", q.substring(0, 60) + "...");
  const r = await runSQL(q);
  console.log("→", r.status, r.body, "\n");
}

// Check and add constraint
const check = await runSQL(checkConstraint);
console.log("Constraint check:", check.body);
if (!check.body.includes("attendance_records_student_id_session_date_key")) {
  console.log("Adding unique constraint...");
  const r = await runSQL(addConstraint);
  console.log("→", r.status, r.body);
} else {
  console.log("Constraint already exists ✓");
}
