"use client";

import { useEffect, useState } from "react";

type Status = {
  configured: boolean;
  connected: boolean;
  expiresAt: string | null;
  scopes: string[];
};

export default function AdminShippingCard() {
  const [status,setStatus] = useState<Status | null>(null);
  const [result,setResult] = useState<string | null>(null);
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    setResult(new URLSearchParams(window.location.search).get("shipping"));
    let active = true;
    fetch("/api/admin/shipping/status",{cache:"no-store"})
      .then(response=>response.ok?response.json():Promise.reject())
      .then((data:Status)=>{if(active)setStatus(data);})
      .catch(()=>{if(active)setStatus(null);})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[]);

  const messages:Record<string,string> = {
    connected:"Conta do Melhor Envio conectada com sucesso.",
    "missing-credentials":"Configure Client ID, Client Secret e Callback na Vercel antes de conectar.",
    "authorization-denied":"A autorização foi cancelada no Melhor Envio.",
    "invalid-state":"A validação de segurança da autorização falhou. Tente novamente.",
    "connection-failed":"Não foi possível concluir a autorização. Confira as credenciais e o callback.",
    "configuration-error":"Não foi possível validar o acesso administrativo.",
  };

  return (
    <section className="shipping-panel">
      <div>
        <span className="quiz-kicker">Entrega nacional</span>
        <h2>Integração de frete</h2>
        <p>Conecte sua conta para consultar tarifas reais e prazos das transportadoras antes de criar uma cobrança Pix.</p>
      </div>
      {result && messages[result] && <p className="shipping-message">{messages[result]}</p>}
      {loading ? <p className="muted-copy">Verificando conexão...</p> : status?.connected ? (
        <div className="shipping-connected">
          <strong>Melhor Envio conectado</strong>
          <span>Token válido até {status.expiresAt ? new Date(status.expiresAt).toLocaleString("pt-BR") : "—"}</span>
          <span>Permissão: {status.scopes.join(", ") || "shipping-calculate"}</span>
        </div>
      ) : (
        <div className="shipping-disconnected">
          <strong>{status?.configured ? "Autorização necessária" : "Configuração pendente"}</strong>
          <span>{status?.configured ? "Autorize a conta da loja para habilitar cotações." : "Faltam credenciais do aplicativo, CEP de expedição ou chave de criptografia."}</span>
        </div>
      )}
      <a className="primary-btn" href="/api/admin/shipping/melhor-envio/authorize">
        {status?.connected ? "Reconectar Melhor Envio" : "Conectar Melhor Envio"}
      </a>
      <p className="text-xs text-gray-500">A integração solicita somente a permissão de cotação de frete. A compra de etiquetas não está habilitada neste fluxo.</p>
    </section>
  );
}
