import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { teacherId, newPassword, adminId } = await req.json();

    if (!teacherId || !newPassword || !adminId) {
      return NextResponse.json(
        { error: "بيانات غير مكتملة" },
        { status: 400 }
      );
    }

    // Initialize Supabase admin client to bypass RLS and manage users
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify that the user making the request is an admin
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from("teachers")
      .select("is_admin")
      .eq("id", adminId)
      .single();

    if (adminError || !adminData?.is_admin) {
      return NextResponse.json(
        { error: "غير مصرح لك بإجراء هذا التعديل" },
        { status: 403 }
      );
    }

    // Update the teacher's password
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      teacherId,
      { password: newPassword }
    );

    if (error) {
      console.error("Change password error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Change password API error:", err);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
