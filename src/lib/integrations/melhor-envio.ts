import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { z } from "zod";
import { createServiceSupabase } from "@/lib/supabase/server";
import type { ShippingItem, ShippingQuote, ShippingQuoteInput } from "@/lib/integrations/shipping";

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  scope: z.union([z.string(), z.array(z.string())]).optional(),
  token_type: z.string().optional(),
});

export function melhorEnvioBaseUrl() {
  return process.env.MELHORENVIO_ENV === "production"
    ? "https://melhorenvio.com.br"
    : "https://sandbox.melhorenvio.com.br";
}

function appCredentials() {
  const clientId = process.env.MELHORENVIO_CLIENT_ID || "";
  const clientSecret = process.env.MELHORENVIO_CLIENT_SECRET || "";
  const redirectUri = process.env.MELHORENVIO_REDIRECT_URI || "";
  const email = process.env.MELHORENVIO_USER_AGENT_EMAIL || "";
  const parsedClientId = Number(clientId);

  if (!Number.isSafeInteger(parsedClientId) || parsedClientId <= 0 || !clientSecret || !redirectUri || !email) {
    throw new Error("Configuração do aplicativo Melhor Envio incompleta no servidor.");
  }
  return { clientId: parsedClientId, clientSecret, redirectUri, email };
}

function encryptionKey() {
  const configured = process.env.MELHORENVIO_TOKEN_ENCRYPTION_KEY || "";
  let key: Buffer;
  if (/^[a-f0-9]{64}$/i.test(configured)) key = Buffer.from(configured, "hex");
  else key = Buffer.from(configured, "base64");

  if (key.length !== 32) {
    throw new Error("MELHORENVIO_TOKEN_ENCRYPTION_KEY deve conter 32 bytes em hexadecimal ou Base64.");
  }
  return key;
}

function encryptToken(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

function decryptToken(value: string) {
  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") throw new Error("Token do Melhor Envio armazenado em formato desconhecido.");
  const iv = Buffer.from(parts[1], "base64url");
  const tag = Buffer.from(parts[2], "base64url");
  const encrypted = Buffer.from(parts[3], "base64url");
  if (iv.length !== 12 || tag.length !== 16) throw new Error("Token do Melhor Envio armazenado está inválido.");

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

type OAuthTokens = z.infer<typeof tokenResponseSchema>;

async function tokenRequest(body: Record<string, string | number>) {
  const { email } = appCredentials();
  const response = await fetch(melhorEnvioBaseUrl() + "/oauth/token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "FortiCestas (" + email + ")",
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null &&
      "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "Melhor Envio retornou HTTP " + response.status + ".";
    throw new Error(message);
  }
  const parsed = tokenResponseSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Resposta de autorização do Melhor Envio em formato inesperado.");
  return parsed.data;
}

async function persistTokens(tokens: OAuthTokens) {
  const db = createServiceSupabase();
  if (!db) throw new Error("Supabase não configurado para armazenar a autorização do frete.");

  const scopes = Array.isArray(tokens.scope)
    ? tokens.scope
    : typeof tokens.scope === "string"
      ? tokens.scope.split(/\s+/).filter(Boolean)
      : ["shipping-calculate"];

  const { error } = await db.from("shipping_connections").upsert({
    provider: "melhor_envio",
    access_token_encrypted: encryptToken(tokens.access_token),
    refresh_token_encrypted: encryptToken(tokens.refresh_token),
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    scopes,
    updated_at: new Date().toISOString(),
  }, { onConflict: "provider" });

  if (error) throw new Error("Não foi possível salvar a autorização do Melhor Envio no banco.");
}

export async function exchangeAuthorizationCode(code: string) {
  const credentials = appCredentials();
  const tokens = await tokenRequest({
    grant_type: "authorization_code",
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    redirect_uri: credentials.redirectUri,
    code,
  });
  await persistTokens(tokens);
}

async function validAccessToken() {
  const db = createServiceSupabase();
  if (!db) throw new Error("Provedor de frete não configurado: Supabase indisponível.");

  const { data, error } = await db.from("shipping_connections")
    .select("access_token_encrypted, refresh_token_encrypted, expires_at")
    .eq("provider", "melhor_envio")
    .maybeSingle();

  if (error) throw new Error("Não foi possível consultar a conexão do Melhor Envio.");
  if (!data) throw new Error("Provedor de frete não configurado: conecte o Melhor Envio pelo painel.");

  const expiresAt = new Date(data.expires_at).getTime();
  if (Number.isFinite(expiresAt) && expiresAt - Date.now() > 120000) {
    return decryptToken(data.access_token_encrypted);
  }

  try {
    const credentials = appCredentials();
    const refreshed = await tokenRequest({
      grant_type: "refresh_token",
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: decryptToken(data.refresh_token_encrypted),
    });
    await persistTokens(refreshed);
    return refreshed.access_token;
  } catch {
    throw new Error("A autorização do Melhor Envio expirou. Reconecte a conta pelo painel administrativo.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return Number.NaN;
}

function normalizeQuotes(payload: unknown): ShippingQuote[] {
  const entries = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.data)
      ? payload.data
      : [];

  return entries.flatMap((entry): ShippingQuote[] => {
    if (!isRecord(entry) || entry.error) return [];
    const price = toNumber(entry.custom_price ?? entry.price);
    const deliveryDays = toNumber(entry.custom_delivery_time ?? entry.delivery_time);
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(deliveryDays) || deliveryDays < 0) return [];

    const company = isRecord(entry.company) && typeof entry.company.name === "string"
      ? entry.company.name
      : "";
    const name = typeof entry.name === "string" ? entry.name : "Serviço de entrega";
    const id = entry.id === undefined || entry.id === null ? undefined : String(entry.id);

    return [{
      service: company ? company + " · " + name : name,
      priceCents: Math.round(price * 100),
      estimatedDays: Math.ceil(deliveryDays),
      ...(id ? { quoteReference: id } : {}),
    }];
  });
}

export async function quoteMelhorEnvio(input: ShippingQuoteInput): Promise<ShippingQuote[]> {
  const originCep = (process.env.SHIPPING_ORIGIN_CEP || "").replace(/\D/g, "");
  if (!/^\d{8}$/.test(originCep)) {
    throw new Error("Provedor de frete não configurado: informe SHIPPING_ORIGIN_CEP com o CEP de expedição.");
  }
  const destinationCep = input.cep.replace(/\D/g, "");
  if (!/^\d{8}$/.test(destinationCep)) throw new Error("CEP de destino inválido.");
  if (!input.items.length) throw new Error("A cesta não tem produtos para cotar.");

  const accessToken = await validAccessToken();
  const credentials = appCredentials();

  const products = input.items.map((item: ShippingItem) => ({
    id: item.sku,
    width: item.widthCm,
    height: item.heightCm,
    length: item.lengthCm,
    weight: Math.max(0.001, item.weightGrams / 1000),
    insurance_value: Number((item.valueCents / 100).toFixed(2)),
    quantity: item.quantity,
  }));

  const response = await fetch(melhorEnvioBaseUrl() + "/api/v2/me/shipment/calculate", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "FortiCestas (" + credentials.email + ")",
    },
    body: JSON.stringify({
      from: { postal_code: originCep },
      to: { postal_code: destinationCep },
      products,
      options: { receipt: false, own_hand: false },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("A autorização do Melhor Envio expirou. Reconecte a conta pelo painel administrativo.");
    }
    throw new Error("Melhor Envio não conseguiu calcular o frete. Confira origem, medidas e dados da conta.");
  }

  return normalizeQuotes(payload);
}

export async function getMelhorEnvioConnectionStatus() {
  const db = createServiceSupabase();
  const configured = Boolean(
    process.env.MELHORENVIO_CLIENT_ID &&
    process.env.MELHORENVIO_CLIENT_SECRET &&
    process.env.MELHORENVIO_REDIRECT_URI &&
    process.env.MELHORENVIO_USER_AGENT_EMAIL &&
    process.env.MELHORENVIO_TOKEN_ENCRYPTION_KEY &&
    /^\d{8}$/.test((process.env.SHIPPING_ORIGIN_CEP || "").replace(/\D/g, "")),
  );

  if (!db) return { configured, connected: false, expiresAt: null as string | null, scopes: [] as string[] };

  const { data } = await db.from("shipping_connections")
    .select("expires_at, scopes")
    .eq("provider", "melhor_envio")
    .maybeSingle();

  return {
    configured,
    connected: Boolean(data && new Date(data.expires_at).getTime() > Date.now()),
    expiresAt: data?.expires_at ?? null,
    scopes: Array.isArray(data?.scopes) ? data.scopes as string[] : [],
  };
}
