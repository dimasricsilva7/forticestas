import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/admin-auth";

const statusSchema = z.object({
  fulfillment_status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getAdminContext();
  if (!context.ok) return NextResponse.json({ error: context.message }, { status: context.status });
  const { id } = await params;
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  const { data, error } = await context.db.from("orders")
    .update({ fulfillment_status: parsed.data.fulfillment_status, updated_at: new Date().toISOString() })
    .eq("id", id).select("id, fulfillment_status").single();
  if (error) return NextResponse.json({ error: "Não foi possível atualizar o pedido." }, { status: 400 });
  return NextResponse.json({ order: data });
}
