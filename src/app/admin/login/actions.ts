"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signInAdmin(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) redirect("/admin/login?error=preencha-os-campos");

  const supabase = await createServerSupabase();
  if (!supabase) redirect("/admin/login?error=supabase-nao-configurado");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?error=credenciais-invalidas");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?error=nao-foi-possivel-validar");

  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=usuario-sem-permissao");
  }

  redirect("/admin");
}

export async function signOutAdmin() {
  const supabase = await createServerSupabase();
  if (supabase) await supabase.auth.signOut();
  redirect("/admin/login");
}
