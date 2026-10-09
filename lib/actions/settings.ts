"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateSettings(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const name_a = formData.get("name_a") as string;
  const name_b = formData.get("name_b") as string;
  const start_date = formData.get("start_date") as string;
  const theme = formData.get("theme") as string;

  if (!name_a || !name_b || !start_date || !theme) {
    throw new Error("Missing required fields");
  }

  const { error } = await supabase
    .from("couple_settings")
    .update({ name_a, name_b, start_date, theme })
    .eq("id", 1);

  if (error) {
    console.error("Error updating settings:", error);
    throw new Error("Failed to update settings");
  }

  revalidatePath("/", "layout"); // Revalidate entire app to apply theme and names
}
