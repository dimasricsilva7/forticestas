import { NextRequest, NextResponse } from "next/server";
import { exchangeAuthorizationCode } from "@/lib/integrations/melhor-envio";
import { getAdminContext } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function finish(request: NextRequest, result: string) {
  const response = NextResponse.redirect(new URL("/admin?shipping=" + result, request.url));
  response.cookies.set("melhorenvio_oauth_state", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}

export async function GET(request: NextRequest) {
  const context = await getAdminContext();
  if (!context.ok) {
    const destination = context.status === 401 ? "/admin/login" : "/admin?shipping=configuration-error";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  const expectedState = request.cookies.get("melhorenvio_oauth_state")?.value || "";
  const receivedState = request.nextUrl.searchParams.get("state") || "";
  const code = request.nextUrl.searchParams.get("code") || "";
  const providerError = request.nextUrl.searchParams.get("error");

  if (providerError) return finish(request, "authorization-denied");
  if (!expectedState || !receivedState || expectedState !== receivedState || !code) {
    return finish(request, "invalid-state");
  }

  try {
    await exchangeAuthorizationCode(code);
    return finish(request, "connected");
  } catch {
    return finish(request, "connection-failed");
  }
}
