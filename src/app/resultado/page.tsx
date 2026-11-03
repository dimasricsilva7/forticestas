"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Answers = Record<string, string | string[]>;
const recommendations: Record<string,string> = {
  "Até R$ 150": "Sugestão econômica",
  "R$ 151 a R$ 250": "Sugestão equilibrada",
  "R$ 251 a R$ 350": "Sugestão completa",
  "Acima de R$ 350": "Sugestão de maior variedade"
};

export default function ResultPage() {
  const [answers, setAnswers] = useState<Answers>({});
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState<Record<string,string>>({});
  useEffect(() => {
    try {
      setAnswers(JSON.parse(sessionStorage.getItem("forticestas_answers") || "{}"));
      setCep(sessionStorage.getItem("forticestas_cep") || "");
      setAddress(JSON.parse(sessionStorage.getItem("forticestas_address") || "{}"));
    } catch { /* Ignore invalid local session data and show the fallback state. */ }
  }, []);
  const budget = typeof answers.budget === "string" ? answers.budget : "";
  return (
    <main className="quiz-wrap">
      <section className="quiz-card">
        <Link href="/" className="brand"><span className="brand-mark">F</span> FortiCestas</Link>
        <div className="mt-8">
          <span className="quiz-kicker">Perfil concluído</span>
          <h1>Sua sugestão está pronta.</h1>
          <p className="quiz-sub">Com base nas suas respostas, esta é a direção inicial para encontrar sua cesta.</p>
          <div className="rounded-2xl bg-green-50 border border-green-100 p-5 my-6">
            <div className="text-sm text-green-800 font-bold">Sua recomendação</div>
            <h2 className="text-2xl font-black mt-2">{recommendations[budget] || "Cesta personalizada"}</h2>
            <p className="text-sm text-gray-600 mt-2">Perfil: {String(answers.household || "não informado")} · Objetivo: {String(answers.goal || "não informado")}</p>
            <p className="text-sm text-gray-600 mt-1">Tipo escolhido: {String(answers.basket || "não informado")}</p>
          </div>
          <h3 className="font-bold text-lg">Endereço informado</h3>
          <p className="text-sm text-gray-600 mt-1">{cep ? `${cep.slice(0,5)}-${cep.slice(5)} · ${address.localidade || ""} / ${address.uf || ""}` : "Nenhum CEP salvo nesta sessão."}</p>
          <p className="text-sm text-gray-600 mt-5">Ainda não há produtos cadastrados. A equipe FortiCestas poderá disponibilizar as cestas e confirmar o frete assim que o catálogo e a integração logística forem configurados.</p>
          <Link href="/quiz" className="primary-btn mt-6">Refazer meu perfil</Link>
        </div>
      </section>
    </main>
  );
}
