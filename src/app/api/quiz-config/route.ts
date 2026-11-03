import { NextResponse } from "next/server";
import { createPublicSupabase } from "@/lib/supabase/server";

export const revalidate = 60;

export async function GET() {
  const db = createPublicSupabase();
  if (!db) return NextResponse.json({ questions: [] });

  const { data, error } = await db
    .from("quiz_questions")
    .select("question_key, title, subtitle, options, multi, required, position")
    .eq("active", true)
    .order("position", { ascending: true });

  if (error) return NextResponse.json({ questions: [], error: "Não foi possível carregar as perguntas." }, { status: 500 });
  return NextResponse.json({ questions: data || [] });
}
