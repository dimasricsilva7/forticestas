import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getAdminContext();
  if (!context.ok) return NextResponse.json({ error: context.message }, { status: context.status });

  const { id } = await params;
  const { data, error } = await context.db.from("orders")
    .select("*, order_items(id, product_name, sku, unit_price_cents, quantity, line_total_cents)")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Não foi possível carregar os detalhes do pedido." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });

  return NextResponse.json({ order: data });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getAdminContext();
  if (!context.ok) return NextResponse.json({ error: context.message }, { status: context.status });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.fulfillment_status;

  const allowed = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status)) return NextResponse.json({ error: "Status de entrega inválido." }, { status: 400 });

  const { data, error } = await context.db.from("orders")
    .update({ fulfillment_status: status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, fulfillment_status")
    .single();

  if (error) return NextResponse.json({ error: "Não foi possível atualizar o pedido." }, { status: 400 });
  return NextResponse.json({ order: data });
}
