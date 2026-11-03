"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Answers = Record<string, string | string[]>;
type Basket = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
};

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" }).format(cents / 100);
}

function budgetRange(budget: string): [number,number] | null {
  const ranges: Record<string,[number,number]> = {
    "Até R$ 150":[0,15000],
    "R$ 151 a R$ 250":[15100,25000],
    "R$ 251 a R$ 350":[25100,35000],
    "Acima de R$ 350":[35001,Number.POSITIVE_INFINITY],
  };
  return ranges[budget] || null;
}

export default function ResultPage() {
  const [answers, setAnswers] = useState<Answers>({});
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState<Record<string,string>>({});
  const [baskets,setBaskets] = useState<Basket[]>([]);
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    try {
      setAnswers(JSON.parse(sessionStorage.getItem("forticestas_answers") || "{}"));
      setCep(sessionStorage.getItem("forticestas_cep") || "");
      setAddress(JSON.parse(sessionStorage.getItem("forticestas_address") || "{}"));
    } catch {
      // Ignore invalid local session data and show the catalog fallback.
    }
    fetch("/api/catalog",{cache:"no-store"})
      .then(response=>response.ok?response.json():Promise.reject())
      .then((data:{baskets?:Basket[]})=>setBaskets(data.baskets||[]))
      .catch(()=>setBaskets([]))
      .finally(()=>setLoading(false));
  },[]);

  const budget = typeof answers.budget === "string" ? answers.budget : "";
  const suggestions = useMemo(() => {
    const range = budgetRange(budget);
    const ordered = [...baskets].sort((a,b)=>a.price_cents-b.price_cents);
    if (!range) return ordered.slice(0,3);
    const within = ordered.filter(item=>item.price_cents>=range[0]&&item.price_cents<=range[1]);
    if (within.length) return within.slice(0,3);
    return ordered.slice(0,3);
  },[baskets,budget]);

  return (
    <main className="quiz-wrap">
      <section className="quiz-card">
        <Link href="/" className="brand"><span className="brand-mark">F</span> FortiCestas</Link>
        <div className="mt-8">
          <span className="quiz-kicker">Perfil concluído</span>
          <h1>Sua seleção está pronta.</h1>
          <p className="quiz-sub">Usamos suas respostas para direcionar a escolha. As opções abaixo vêm do catálogo publicado pela FortiCestas.</p>
          <div className="rounded-2xl bg-green-50 border border-green-100 p-5 my-6">
            <div className="text-sm text-green-800 font-bold">Resumo do seu perfil</div>
            <p className="text-sm text-gray-700 mt-2">Família: {String(answers.household || "não informado")}</p>
            <p className="text-sm text-gray-700 mt-1">Objetivo: {String(answers.goal || "não informado")}</p>
            <p className="text-sm text-gray-700 mt-1">Orçamento: {budget || "não informado"}</p>
            <p className="text-sm text-gray-700 mt-1">Tipo de cesta: {String(answers.basket || "não informado")}</p>
          </div>
          <h2 className="font-bold text-xl">Cestas disponíveis</h2>
          {loading ? <p className="text-sm text-gray-500 mt-3">Consultando catálogo...</p> :
            suggestions.length ? <div className="grid gap-3 mt-4">
              {suggestions.map(item=><article key={item.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="font-extrabold">{item.name}</h3><p className="text-sm text-gray-500 mt-1">{item.description}</p></div>
                  <strong className="text-green-800 whitespace-nowrap">{money(item.price_cents)}</strong>
                </div>
                <Link href={"/cestas/"+item.slug} className="primary-btn mt-4">Ver composição</Link>
              </article>)}
            </div> :
            <div className="empty-state mt-4">
              <h2>Estamos cadastrando as primeiras cestas.</h2>
              <p>Seu perfil foi registrado nesta sessão. Assim que a equipe publicar as cestas no catálogo, elas aparecerão aqui.</p>
              <Link href="/cestas" className="secondary-btn mt-3">Abrir catálogo</Link>
            </div>
          }
          <h3 className="font-bold text-lg mt-7">Região informada</h3>
          <p className="text-sm text-gray-600 mt-1">{cep ? `${cep.slice(0,5)}-${cep.slice(5)} · ${address.localidade || ""} / ${address.uf || ""}` : "Nenhum CEP salvo nesta sessão."}</p>
          <p className="text-xs text-gray-500 mt-3">Frete, prazo e disponibilidade precisam ser confirmados com a transportadora antes do pagamento.</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/quiz" className="primary-btn">Refazer meu perfil</Link>
            <Link href="/cestas" className="secondary-btn">Ver todo o catálogo</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
