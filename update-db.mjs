import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sucemomxyjtinrtylymc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1Y2Vtb214eWp0aW5ydHlseW1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzQ5NTE2MSwiZXhwIjoyMDUzMDcxMTYxfQ.R0k6j79h394Pob_fX2x5gYJv4jC-9-yq_dK3j4sFhC8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('questions').select('id').limit(1);
  console.log("We can't easily alter columns via REST if rpc is not there, we will need the user to run SQL or we try an RPC if we made one earlier.");
}
run();
