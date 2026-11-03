import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await getAdminContext();
  if (!context.ok) return NextResponse.json({ error: context.message }, { status: context.status });

  const [products, baskets, orders, paidOrders] = await Promise.all([
    context.db.from("products").select("id", { count: "exact", head: true }),
    context.db.from("baskets").select("id", { count: "exact", head: true }),
    context.db.from("orders").select("id", { count: "exact", head: true }),
    context.db.from("orders").select("total_cents").eq("payment_status", "paid"),
  ]);

  const revenueCents = (paidOrders.data || []).reduce((sum, row) => sum + Number(row.total_cents || 0), 0);
  return NextResponse.json({
    products: products.count || 0,
    baskets: baskets.count || 0,
    orders: orders.count || 0,
    paidRevenueCents: revenueCents,
    paidOrders: (paidOrders.data || []).length,
  });
}
