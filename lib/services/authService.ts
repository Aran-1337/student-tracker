import { supabase } from "@/lib/supabaseClient";

export const AuthService = {
  async getSession() {
    return supabase.auth.getSession();
  },
  async getUser() {
    return supabase.auth.getUser();
  },
  async signOut() {
    return supabase.auth.signOut();
  }
};
