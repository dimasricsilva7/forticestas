import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await getAdminContext();
  if (!context.ok) return NextResponse.json({ error: context.message }, { status: context.status });
  const { data, error } = await context.db.from("orders")
    .select("id, order_number, customer_name, customer_phone, cep, total_cents, payment_status, fulfillment_status, shipping_service, created_at, order_items(product_name, sku, quantity, line_total_cents)")
    .order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Não foi possível carregar os pedidos." }, { status: 500 });
  return NextResponse.json({ orders: data || [] });
}
