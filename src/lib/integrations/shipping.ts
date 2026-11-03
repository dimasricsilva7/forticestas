/**
 * Adaptador de frete.
 * Contrato independente de provedor: todos os dados são consultados no servidor.
 * O provedor precisa ser escolhido e autenticado antes de habilitar checkout real.
 */
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

export async function quoteShipping(
  input: ShippingQuoteInput,
): Promise<ShippingQuote[]> {
  void input;
  throw new Error("Provedor de frete ainda não configurado.");
}
