import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-auth";
import { melhorEnvioBaseUrl } from "@/lib/integrations/melhor-envio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const context = await getAdminContext();
  if (!context.ok) {
    const destination = context.status === 401 ? "/admin/login" : "/admin?shipping=configuration-error";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  const clientId = process.env.MELHORENVIO_CLIENT_ID || "";
  const redirectUri = process.env.MELHORENVIO_REDIRECT_URI || "";
  if (!clientId || !process.env.MELHORENVIO_CLIENT_SECRET || !redirectUri) {
    return NextResponse.redirect(new URL("/admin?shipping=missing-credentials", request.url));
  }

  const state = randomBytes(32).toString("hex");
  const authorizationUrl = new URL("/oauth/authorize", melhorEnvioBaseUrl());
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("scope", "shipping-calculate");

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set("melhorenvio_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
