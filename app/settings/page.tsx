import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { MusicManager } from "@/components/settings/MusicManager";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { getPlaylist } from "@/lib/actions/music";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: settings } = await supabase.from("couple_settings").select("*").eq("id", 1).single();
  const playlist = await getPlaylist();

  return (
    <main style={{
      minHeight: "100dvh",
      backgroundColor: "var(--color-bg)",
      padding: "2rem 1rem 6rem",
    }}>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <SettingsForm initialSettings={settings} />
        <NotificationSettings />
        <MusicManager playlist={playlist} />
        <ChangePasswordForm />
      </div>
    </main>
  );
}

