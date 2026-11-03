import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const basketSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(2000).default(""),
  price_cents: z.number().int().min(0),
  active: z.boolean().default(true),
  position: z.number().int().default(0),
  items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().min(1).max(999) })).default([]),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getAdminContext();
  if (!context.ok) return NextResponse.json({ error: context.message }, { status: context.status });
  const { id } = await params;
  const parsed = basketSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Confira os campos e os itens da cesta." }, { status: 400 });

  const { items, ...basketData } = parsed.data;
  const { data: basket, error } = await context.db.from("baskets")
    .update({ ...basketData, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
  if (error || !basket) return NextResponse.json({ error: "Não foi possível atualizar a cesta." }, { status: 400 });

  const { error: deleteError } = await context.db.from("basket_items").delete().eq("basket_id", id);
  if (deleteError) return NextResponse.json({ error: "Cesta atualizada, mas não foi possível atualizar os itens." }, { status: 500 });
  if (items.length) {
    const { error: insertError } = await context.db.from("basket_items").insert(items.map(item => ({ ...item, basket_id: id })));
    if (insertError) return NextResponse.json({ error: "Cesta atualizada, mas não foi possível salvar os itens." }, { status: 500 });
  }
  return NextResponse.json({ basket });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getAdminContext();
  if (!context.ok) return NextResponse.json({ error: context.message }, { status: context.status });
  const { id } = await params;
  const { error } = await context.db.from("baskets").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Não foi possível excluir a cesta." }, { status: 400 });
  return NextResponse.json({ success: true });
}
