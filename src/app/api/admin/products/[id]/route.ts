import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(2000).default(""),
  sku: z.string().trim().max(80).nullable().optional(),
  price_cents: z.number().int().min(0),
  stock_quantity: z.number().int().min(0),
  image_url: z.string().url().nullable().optional(),
  active: z.boolean().default(true),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getAdminContext();
  if (!context.ok) return NextResponse.json({ error: context.message }, { status: context.status });
  const { id } = await params;
  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Confira os campos do produto." }, { status: 400 });

  const { data, error } = await context.db.from("products").update({ ...parsed.data, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: "Não foi possível atualizar o produto." }, { status: 400 });
  return NextResponse.json({ product: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getAdminContext();
  if (!context.ok) return NextResponse.json({ error: context.message }, { status: context.status });
  const { id } = await params;
  const { error } = await context.db.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Não foi possível excluir. Verifique se o produto está em alguma cesta ou pedido." }, { status: 400 });
  return NextResponse.json({ success: true });
}
