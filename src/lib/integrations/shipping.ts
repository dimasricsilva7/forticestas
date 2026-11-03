import "server-only";

export type ShippingItem = {
  sku: string;
  quantity: number;
  weightGrams: number;
  widthCm: number;
  heightCm: number;
  lengthCm: number;
  valueCents: number;
};

export type ShippingQuoteInput = {
  cep: string;
  items: ShippingItem[];
};

export type ShippingQuote = {
  service: string;
  priceCents: number;
  estimatedDays: number;
  quoteReference?: string;
};

export async function quoteShipping(input: ShippingQuoteInput): Promise<ShippingQuote[]> {
  const provider = process.env.SHIPPING_PROVIDER || "melhor_envio";
  if (provider === "melhor_envio") {
    const { quoteMelhorEnvio } = await import("@/lib/integrations/melhor-envio");
    return quoteMelhorEnvio(input);
  }
  throw new Error("Provedor de frete não configurado.");
}
