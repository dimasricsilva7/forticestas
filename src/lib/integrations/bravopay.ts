import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const BRAVOPAY_API_BASE_URL = "https://bravopay.club/api/v1";

const pixResponseSchema = z.object({
  id: z.string().min(1),
  status: z.string(),
  amount_cents: z.number().int(),
  pix: z.object({
    copy_paste: z.string().min(1),
    expires_at: z.string().min(1),
    qr_code: z.string().optional(),
  }),
});

export type PixChargeInput = {
  orderId: string;
  amountCents: number;
  idempotencyKey: string;
  description: string;
  customer: {
    name: string;
    email?: string;
    cpf?: string;
    phone?: string;
  };
  expiresInSeconds?: number;
};

export type PixChargeResult = {
  providerPaymentId: string;
  status: string;
  amountCents: number;
  copyPaste: string;
  qrCode?: string;
  expiresAt: string;
};

export async function createBravoPayPixCharge(
  input: PixChargeInput,
): Promise<PixChargeResult> {
  const apiKey = process.env.BRAVOPAY_API_KEY;
  if (!apiKey) throw new Error("BRAVOPAY_API_KEY não está configurada no servidor.");
  if (!Number.isInteger(input.amountCents) || input.amountCents < 500) {
    throw new Error("A BravoPay exige cobrança mínima de R$ 5,00.");
  }
  if (!input.idempotencyKey.trim()) {
    throw new Error("Chave de idempotência obrigatória para criar a cobrança.");
  }

  const response = await fetch(`${BRAVOPAY_API_BASE_URL}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      amount_cents: input.amountCents,
      method: "pix",
      customer: {
        name: input.customer.name,
        ...(input.customer.email ? { email: input.customer.email } : {}),
        ...(input.customer.cpf ? { cpf: input.customer.cpf } : {}),
        ...(input.customer.phone ? { phone: input.customer.phone } : {}),
      },
      description: input.description.slice(0, 300),
      external_reference: input.orderId,
      expires_in: input.expiresInSeconds ?? 3600,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const apiMessage =
      typeof payload === "object" && payload !== null &&
      "error" in payload && typeof payload.error === "object" && payload.error !== null &&
      "message" in payload.error && typeof payload.error.message === "string"
        ? payload.error.message
        : `BravoPay retornou HTTP ${response.status}.`;
    throw new Error(apiMessage);
  }

  const parsed = pixResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("A BravoPay respondeu em um formato inesperado. A cobrança não foi validada.");
  }
  if (parsed.data.amount_cents !== input.amountCents) {
    throw new Error("O valor retornado pela BravoPay não corresponde ao total do pedido.");
  }

  return {
    providerPaymentId: parsed.data.id,
    status: parsed.data.status,
    amountCents: parsed.data.amount_cents,
    copyPaste: parsed.data.pix.copy_paste,
    qrCode: parsed.data.pix.qr_code,
    expiresAt: parsed.data.pix.expires_at,
  };
}

export function verifyBravoPayWebhook(
  rawBody: string,
  signatureHeader: string,
  secret = process.env.BRAVOPAY_WEBHOOK_SECRET,
  toleranceSeconds = 300,
): boolean {
  if (!secret || !signatureHeader || !rawBody) return false;

  const fields = new Map<string, string>();
  for (const part of signatureHeader.split(",")) {
    const separator = part.indexOf("=");
    if (separator <= 0) continue;
    fields.set(part.slice(0, separator).trim(), part.slice(separator + 1).trim());
  }

  const timestampText = fields.get("t");
  const receivedHex = fields.get("v1");
  if (!timestampText || !receivedHex || !/^\d+$/.test(timestampText) || !/^[a-f0-9]{64}$/i.test(receivedHex)) {
    return false;
  }

  const timestamp = Number(timestampText);
  if (!Number.isSafeInteger(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestampText}.${rawBody}`, "utf8")
    .digest();
  const received = Buffer.from(receivedHex, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
