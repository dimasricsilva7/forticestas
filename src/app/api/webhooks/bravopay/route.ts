import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabase } from "@/lib/supabase/server";
import { verifyBravoPayWebhook } from "@/lib/integrations/bravopay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const eventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  created: z.number().optional(),
  data: z.object({
    id: z.string().min(1),
    external_reference: z.string().optional(),
    amount_cents: z.number().int().optional(),
    currency: z.string().optional(),
    status: z.string().optional(),
    paid_at: z.string().optional(),
  }).passthrough(),
}).passthrough();

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("BravoPay-Signature") ||
    request.headers.get("X-Bravopay-Signature") ||
    "";

  if (!verifyBravoPayWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Assinatura do webhook inválida." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = eventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Formato de evento não reconhecido." }, { status: 400 });
  }

  const db = createServiceSupabase();
  if (!db) {
    return NextResponse.json({ error: "Supabase não está configurado para processar webhooks." }, { status: 503 });
  }

  const event = parsed.data;
  const { data: existingEvent, error: readEventError } = await db
    .from("payment_webhook_events")
    .select("event_id, processed_at")
    .eq("event_id", event.id)
    .maybeSingle();

  if (readEventError) {
    return NextResponse.json({ error: "Não foi possível consultar o registro do webhook." }, { status: 503 });
  }
  if (existingEvent?.processed_at) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (!existingEvent) {
    const { error: insertEventError } = await db.from("payment_webhook_events").insert({
      event_id: event.id,
      event_type: event.type,
      payload: json,
    });
    if (insertEventError && insertEventError.code !== "23505") {
      return NextResponse.json({ error: "Não foi possível registrar o evento." }, { status: 503 });
    }
  }

  try {
    if (event.type.startsWith("transaction.") && event.type !== "transaction.created") {
      const orderId = event.data.external_reference;
      if (!orderId) throw new Error("Evento de transação sem external_reference.");

      const { data: order, error: orderError } = await db
        .from("orders")
        .select("id, total_cents, payment_reference, payment_status")
        .eq("id", orderId)
        .maybeSingle();

      if (orderError) throw new Error("Erro ao consultar o pedido associado ao evento.");
      if (!order) throw new Error("Pedido associado ao evento não foi encontrado.");
      if (order.payment_reference !== event.data.id) {
        throw new Error("A transação do evento não corresponde à transação salva no pedido.");
      }
      if (
        typeof event.data.amount_cents === "number" &&
        event.data.amount_cents !== order.total_cents
      ) {
        throw new Error("O valor informado no webhook não corresponde ao total do pedido.");
      }
      if (event.data.currency && event.data.currency !== "BRL") {
        throw new Error("Moeda do pagamento diferente de BRL.");
      }

      if (event.type === "transaction.paid") {
        if (order.payment_status === "pending" || order.payment_status === "failed") {
          const { error } = await db.from("orders").update({
            payment_status: "paid",
            paid_at: event.data.paid_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq("id", order.id).eq("payment_reference", event.data.id)
            .in("payment_status", ["pending", "failed"]);
          if (error) throw new Error("Não foi possível confirmar o pagamento no pedido.");
        }
      } else if (event.type === "transaction.refunded") {
        if (order.payment_status !== "chargeback") {
          const { error } = await db.from("orders").update({
            payment_status: "refunded",
            updated_at: new Date().toISOString(),
          }).eq("id", order.id).eq("payment_reference", event.data.id);
          if (error) throw new Error("Não foi possível registrar o reembolso.");
        }
      } else if (event.type === "transaction.chargeback") {
        const { error } = await db.from("orders").update({
          payment_status: "chargeback",
          updated_at: new Date().toISOString(),
        }).eq("id", order.id).eq("payment_reference", event.data.id);
        if (error) throw new Error("Não foi possível registrar o chargeback.");
      } else if (event.type === "transaction.expired" || event.type === "transaction.failed") {
        if (order.payment_status === "pending") {
          const { error } = await db.from("orders").update({
            payment_status: "failed",
            updated_at: new Date().toISOString(),
          }).eq("id", order.id).eq("payment_reference", event.data.id).eq("payment_status", "pending");
          if (error) throw new Error("Não foi possível atualizar o status da cobrança.");
        }
      }
    }

    const { error: finishError } = await db.from("payment_webhook_events")
      .update({ processed_at: new Date().toISOString(), processing_error: null })
      .eq("event_id", event.id);

    if (finishError) throw new Error("Evento processado, mas não foi possível salvar a confirmação do webhook.");
    return NextResponse.json({ received: true });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Erro ao processar o webhook.";
    await db.from("payment_webhook_events")
      .update({ processing_error: message })
      .eq("event_id", event.id);
    // BravoPay retries non-2xx responses. The same event id can be safely resumed.
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
