import { supabase } from "@/lib/supabaseClient";

export interface SystemSettings {
  id?: number;
  site_name: string;
  sidebar_name?: string;
  site_logo: string;
  site_favicon?: string;
  hide_sidebar_name?: boolean;
}

export const SystemSettingsService = {
  async getSettings(): Promise<SystemSettings | null> {
    const { data, error } = await supabase
      .from("system_settings")
      .select("*")
      .limit(1)
      .single();
    
    if (error || !data) return null;

    const settings: SystemSettings = { ...data, hide_sidebar_name: false };
    
    // Parse the hidden flag if it exists
    if (settings.site_name && settings.site_name.startsWith("[HIDDEN]")) {
      settings.hide_sidebar_name = true;
      settings.site_name = settings.site_name.replace("[HIDDEN]", "");
    }

    // Parse the sidebar_name if it exists
    if (settings.site_name && settings.site_name.includes("|||SIDEBAR|||")) {
      const parts = settings.site_name.split("|||SIDEBAR|||");
      settings.site_name = parts[0];
      settings.sidebar_name = parts[1];
    } else {
      settings.sidebar_name = settings.site_name;
    }

    // Parse the favicon if it exists
    if (settings.site_logo && settings.site_logo.includes("|||FAVICON|||")) {
      const parts = settings.site_logo.split("|||FAVICON|||");
      settings.site_logo = parts[0];
      settings.site_favicon = parts[1];
    }

    return settings;
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<void> {
    const current = await this.getSettings();

    // Serialize the sidebar_name into site_name
    let finalSiteName = settings.site_name || "إدارة السناتر والمعلمين";
    if (settings.sidebar_name && settings.sidebar_name !== settings.site_name) {
      finalSiteName += "|||SIDEBAR|||" + settings.sidebar_name;
    }

    // Serialize the hidden flag
    if (settings.hide_sidebar_name) {
      finalSiteName = "[HIDDEN]" + finalSiteName;
    }

    // Serialize the favicon into the site_logo
    let finalSiteLogo = settings.site_logo || "";
    if (settings.site_favicon) {
      finalSiteLogo += "|||FAVICON|||" + settings.site_favicon;
    }

    const payload = {
      site_name: finalSiteName,
      site_logo: finalSiteLogo
    };

    if (!current) {
      // Insert
      const { error } = await supabase
        .from("system_settings")
        .insert([payload]);
      if (error) console.error("Error inserting settings", error);
    } else {
      // Update
      const { error } = await supabase
        .from("system_settings")
        .update(payload)
        .eq("id", current.id || 1);
        
      if (error) {
        await supabase.from("system_settings").update(payload).neq("site_name", "impossible_string");
      }
    }
  }
};
