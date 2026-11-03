import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-auth";
import { getMelhorEnvioConnectionStatus } from "@/lib/integrations/melhor-envio";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await getAdminContext();
  if (!context.ok) return NextResponse.json({ error: context.message }, { status: context.status });
  return NextResponse.json(await getMelhorEnvioConnectionStatus());
}
