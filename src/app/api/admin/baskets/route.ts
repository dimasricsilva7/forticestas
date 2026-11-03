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

export async function GET() {
  const context = await getAdminContext();
  if (!context.ok) return NextResponse.json({ error: context.message }, { status: context.status });
  const { data, error } = await context.db.from("baskets")
    .select("*, basket_items(product_id, quantity, products(id, name, sku, price_cents))")
    .order("position", { ascending: true });
  if (error) return NextResponse.json({ error: "Não foi possível carregar as cestas." }, { status: 500 });
  return NextResponse.json({ baskets: data || [] });
}

export async function POST(request: NextRequest) {
  const context = await getAdminContext();
  if (!context.ok) return NextResponse.json({ error: context.message }, { status: context.status });
  const parsed = basketSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Confira os campos e os itens da cesta." }, { status: 400 });

  const { items, ...basketData } = parsed.data;
  const { data: basket, error } = await context.db.from("baskets").insert(basketData).select("*").single();
  if (error || !basket) return NextResponse.json({ error: error?.code === "23505" ? "Já existe uma cesta com este slug." : "Não foi possível salvar a cesta." }, { status: 400 });

  if (items.length) {
    const { error: itemsError } = await context.db.from("basket_items").insert(items.map(item => ({ ...item, basket_id: basket.id })));
    if (itemsError) {
      await context.db.from("baskets").delete().eq("id", basket.id);
      return NextResponse.json({ error: "Não foi possível salvar a composição da cesta." }, { status: 400 });
    }
  }
  return NextResponse.json({ basket }, { status: 201 });
}
