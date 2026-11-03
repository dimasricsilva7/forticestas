/**
 * Adaptador BravoPay — implementação pendente.
 * Chamar somente em Route Handlers/server actions, nunca em componentes client.
 * Confirmar endpoint, autenticação, payload e assinatura de webhook na documentação
 * oficial e nas credenciais da conta antes de habilitar pagamentos reais.
 */
export type PixChargeInput = {
  orderId: string;
  amountCents: number;
  customer: { name: string; email?: string; document?: string };
};

export type PixChargeResult = {
  providerPaymentId: string;
  copyPaste: string;
  qrCodeBase64?: string;
  expiresAt: string;
};

export async function createBravoPayPixCharge(
  input: PixChargeInput,
): Promise<PixChargeResult> {
  void input;
  throw new Error("Integração BravoPay ainda não configurada.");
}

export async function verifyBravoPayWebhook(
  rawBody: string,
  signature: string,
): Promise<boolean> {
  void rawBody;
  void signature;
  throw new Error("Validação do webhook BravoPay ainda não implementada.");
}
