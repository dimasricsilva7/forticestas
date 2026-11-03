import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createBravoPayPixCharge } from "@/lib/integrations/bravopay";
import { quoteShipping } from "@/lib/integrations/shipping";
import { createServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  basketSlug: z.string().min(2).max(140),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(180).optional().or(z.literal("")),
    phone: z.string().trim().min(10).max(30),
  }),
  cep: z.string().transform(value => value.replace(/\D/g, "")).refine(value => /^\d{8}$/.test(value), "CEP inválido."),
  number: z.string().trim().min(1).max(30),
  complement: z.string().trim().max(120).optional().default(""),
});

type BasketProduct = {
  id: string;
  name: string;
  sku: string | null;
  price_cents: number;
  weight_grams: number;
  active: boolean;
  stock_quantity: number;
};
type BasketItem = { quantity: number; products: BasketProduct | BasketProduct[] | null };
type BasketRow = {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  active: boolean;
  basket_items: BasketItem[];
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const idempotencyKey = request.headers.get("Idempotency-Key") || "";
  if (!z.string().uuid().safeParse(idempotencyKey).success) {
    return errorResponse("Chave de idempotência inválida. Atualize a página e tente novamente.", 400);
  }

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Confira os dados do comprador, CEP e endereço.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = createServiceSupabase();
  if (!db) return errorResponse("Checkout indisponível: banco de dados não configurado.", 503);

  let order = null as {
    id: string;
    order_number: number;
    customer_name: string;
    customer_email: string | null;
    customer_phone: string;
    total_cents: number;
    payment_status: string;
    payment_reference: string | null;
    payment_payload: { copy_paste?: string; qr_code?: string | null; expires_at?: string } | null;
  } | null;

  const { data: previousOrder, error: previousError } = await db
    .from("orders")
    .select("id, order_number, customer_name, customer_email, customer_phone, total_cents, payment_status, payment_reference, payment_payload")
    .eq("checkout_idempotency_key", idempotencyKey)
    .maybeSingle();

  if (previousError) return errorResponse("Não foi possível consultar o pedido.", 503);
  if (previousOrder) {
    order = previousOrder;
  } else {
    const { data: basketData, error: basketError } = await db
      .from("baskets")
      .select("id, name, slug, price_cents, active, basket_items(quantity, products(id, name, sku, price_cents, weight_grams, active, stock_quantity))")
      .eq("slug", parsed.data.basketSlug)
      .eq("active", true)
      .maybeSingle();

    if (basketError) return errorResponse("Não foi possível consultar a cesta.", 503);
    if (!basketData) return errorResponse("Esta cesta não está disponível.", 404);

    const basket = basketData as unknown as BasketRow;
    if (!basket.basket_items?.length) return errorResponse("Esta cesta ainda não tem produtos cadastrados.", 422);

    const shippingItems = [];
    for (const item of basket.basket_items) {
      const product = Array.isArray(item.products) ? item.products[0] : item.products;
      if (!product || !product.active) return errorResponse("Um dos produtos desta cesta não está disponível.", 409);
      if (product.stock_quantity < item.quantity) return errorResponse(`Estoque insuficiente para ${product.name}.`, 409);
      if (!Number.isInteger(product.weight_grams) || product.weight_grams <= 0) {
        return errorResponse(`Cadastre o peso de envio do produto ${product.name} antes de habilitar o checkout.`, 422);
      }
      shippingItems.push({
        sku: product.sku || product.id,
        quantity: item.quantity,
        weightGrams: product.weight_grams,
      });
    }

    let addressData: Record<string, unknown>;
    try {
      const cepResponse = await fetch(`https://viacep.com.br/ws/${parsed.data.cep}/json/`, {
        cache: "no-store",
        signal: AbortSignal.timeout(7000),
      });
      if (!cepResponse.ok) throw new Error("ViaCEP indisponível.");
      addressData = await cepResponse.json() as Record<string, unknown>;
      if (addressData.erro) return errorResponse("CEP não encontrado.", 422);
    } catch {
      return errorResponse("Não foi possível consultar o CEP agora. Tente novamente.", 503);
    }

    let shipping;
    try {
      const quotes = await quoteShipping({ cep: parsed.data.cep, items: shippingItems });
      shipping = [...quotes].sort((a, b) => a.priceCents - b.priceCents)[0];
      if (!shipping) return errorResponse("Não há modalidade de entrega disponível para este CEP.", 422);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "";
      if (message.includes("não configurado")) {
        return errorResponse("O cálculo de frete nacional ainda está sendo configurado. Nenhuma cobrança foi criada.", 503);
      }
      return errorResponse("Não foi possível calcular o frete. Nenhuma cobrança foi criada.", 503);
    }

    const subtotalCents = Number(basket.price_cents);
    const shippingCents = Number(shipping.priceCents);
    if (!Number.isInteger(subtotalCents) || subtotalCents < 500 || !Number.isInteger(shippingCents) || shippingCents < 0) {
      return errorResponse("Preço da cesta ou frete inválido. Entre em contato com o atendimento.", 422);
    }

    const address = {
      ...addressData,
      number: parsed.data.number,
      complement: parsed.data.complement,
    };
    const { data: createdOrder, error: createOrderError } = await db.from("orders").insert({
      customer_name: parsed.data.customer.name,
      customer_email: parsed.data.customer.email || null,
      customer_phone: parsed.data.customer.phone,
      cep: parsed.data.cep,
      address,
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      total_cents: subtotalCents + shippingCents,
      shipping_service: shipping.service,
      checkout_idempotency_key: idempotencyKey,
      payment_provider: "bravopay",
    }).select("id, order_number, customer_name, customer_email, customer_phone, total_cents, payment_status, payment_reference, payment_payload").single();

    if (createOrderError || !createdOrder) {
      if (createOrderError?.code === "23505") {
        return errorResponse("Este checkout já está sendo processado. Atualize a página e tente novamente.", 409);
      }
      return errorResponse("Não foi possível registrar o pedido.", 503);
    }

    const { error: itemError } = await db.from("order_items").insert({
      order_id: createdOrder.id,
      product_id: null,
      product_name: basket.name,
      sku: null,
      unit_price_cents: subtotalCents,
      quantity: 1,
    });
    if (itemError) {
      await db.from("orders").delete().eq("id", createdOrder.id);
      return errorResponse("Não foi possível registrar os itens do pedido.", 503);
    }

    order = createdOrder;
  }

  if (!order) return errorResponse("Não foi possível iniciar o pagamento.", 500);
  if (order.payment_status !== "pending") {
    return errorResponse("Este pedido não está mais aguardando pagamento.", 409);
  }
  if (order.payment_reference && order.payment_payload?.copy_paste) {
    return NextResponse.json({
      orderNumber: order.order_number,
      amountCents: order.total_cents,
      pix: order.payment_payload,
    });
  }

  try {
    const charge = await createBravoPayPixCharge({
      orderId: order.id,
      amountCents: order.total_cents,
      idempotencyKey: `forticestas-order-${order.id}`,
      description: `Pedido #${order.order_number} - FortiCestas`,
      customer: {
        name: order.customer_name,
        email: order.customer_email || undefined,
        phone: order.customer_phone,
      },
      expiresInSeconds: 3600,
    });

    const paymentPayload = {
      copy_paste: charge.copyPaste,
      qr_code: charge.qrCode || null,
      expires_at: charge.expiresAt,
    };
    const { error: savePaymentError } = await db.from("orders").update({
      payment_reference: charge.providerPaymentId,
      payment_payload: paymentPayload,
      updated_at: new Date().toISOString(),
    }).eq("id", order.id).eq("payment_status", "pending");

    if (savePaymentError) {
      return errorResponse("A cobrança foi gerada, mas não foi possível salvar o pagamento no pedido. Entre em contato com o atendimento antes de tentar novamente.", 503);
    }

    return NextResponse.json({
      orderNumber: order.order_number,
      amountCents: charge.amountCents,
      pix: paymentPayload,
    }, { status: 201 });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Não foi possível criar a cobrança Pix.";
    return errorResponse(message, 502);
  }
}
