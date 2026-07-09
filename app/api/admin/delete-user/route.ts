import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    // 1. Check if the requester is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify admin status from DB using admin client to bypass RLS
    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from("teachers")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (teacherError || !teacher?.is_admin) {
      return NextResponse.json({ error: "Forbidden: Not an admin" }, { status: 403 });
    }

    // 2. Get the target user ID to delete
    const body = await req.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
    }

    // 4. Delete the Auth User
    // Due to ON DELETE CASCADE on public.teachers (id references auth.users(id)),
    // this will automatically delete the teacher row and all their related data.
    const { data: deleteData, error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      targetUserId
    );

    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
