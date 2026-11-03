import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const questionSchema = z.object({
  question_key: z.string().trim().min(2).max(80).regex(/^[a-z0-9_-]+$/),
  title: z.string().trim().min(5).max(240),
  subtitle: z.string().max(600).default(""),
  options: z.array(z.object({
    value: z.string().trim().min(1).max(100),
    description: z.string().trim().max(240).default(""),
  })).min(2).max(20),
  multi: z.boolean().default(false),
  required: z.boolean().default(true),
  position: z.number().int().min(0).max(1000).default(0),
  active: z.boolean().default(true),
});

export async function GET() {
  const context = await getAdminContext();
  if (!context.ok) return NextResponse.json({ error: context.message }, { status: context.status });
  const { data, error } = await context.db.from("quiz_questions").select("*").order("position", { ascending: true });
  if (error) return NextResponse.json({ error: "Não foi possível carregar as perguntas." }, { status: 500 });
  return NextResponse.json({ questions: data || [] });
}

export async function POST(request: NextRequest) {
  const context = await getAdminContext();
  if (!context.ok) return NextResponse.json({ error: context.message }, { status: context.status });
  const parsed = questionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Confira a pergunta e as opções." }, { status: 400 });
  const { data, error } = await context.db.from("quiz_questions").insert(parsed.data).select("*").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Esta chave de pergunta já existe." : "Não foi possível salvar a pergunta." }, { status: 400 });
  return NextResponse.json({ question: data }, { status: 201 });
}
