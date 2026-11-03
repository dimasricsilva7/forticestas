/**
 * Adaptador de frete — provedor nacional ainda não selecionado.
 * Implementar cotação e rastreio no servidor após definição do parceiro logístico.
 */
export type ShippingItem = {
  sku: string;
  quantity: number;
  weightGrams: number;
};

export type ShippingQuoteInput = {
  cep: string;
  items: ShippingItem[];
};

export type ShippingQuote = {
  service: string;
  priceCents: number;
  estimatedDays: number;
};

export async function quoteShipping(
  _input: ShippingQuoteInput,
): Promise<ShippingQuote[]> {
  throw new Error("Provedor de frete ainda não configurado.");
}
