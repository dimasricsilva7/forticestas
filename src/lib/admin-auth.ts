import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";

export async function getAdminContext() {
  const authClient = await createServerSupabase();
  if (!authClient) return { ok: false as const, status: 503, message: "Supabase não configurado." };

  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) return { ok: false as const, status: 401, message: "Faça login para continuar." };

  const { data: adminRecord, error: adminError } = await authClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !adminRecord) {
    return { ok: false as const, status: 403, message: "Este usuário não tem permissão administrativa." };
  }

  const db = createServiceSupabase();
  if (!db) return { ok: false as const, status: 503, message: "Chave de servidor do Supabase não configurada." };

  return { ok: true as const, user, db };
}
