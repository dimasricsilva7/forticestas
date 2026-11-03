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

export async function GET() {
  const context = await getAdminContext();
  if (!context.ok) return NextResponse.json({ error: context.message }, { status: context.status });

  const { data, error } = await context.db.from("products").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Não foi possível carregar os produtos." }, { status: 500 });
  return NextResponse.json({ products: data || [] });
}

export async function POST(request: NextRequest) {
  const context = await getAdminContext();
  if (!context.ok) return NextResponse.json({ error: context.message }, { status: context.status });

  const body = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Confira os campos do produto.", details: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await context.db.from("products").insert(parsed.data).select("*").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Já existe um produto com este slug ou SKU." : "Não foi possível salvar o produto." }, { status: 400 });
  return NextResponse.json({ product: data }, { status: 201 });
}
