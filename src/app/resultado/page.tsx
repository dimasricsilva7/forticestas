"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { STARTER_BASKETS } from "@/lib/catalog";
import { rankBaskets, type QuizAnswers } from "@/lib/recommendation";

type Answers = Record<string, string | string[]>;
type Basket = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  category: "basic" | "economic" | "traditional" | "complete";
  image_url: string | null;
  supported_households: string[];
  food_tags: string[];
  active: boolean;
};
type QuestionLabel = { key: string; title: string };

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

const categoryLabels: Record<Basket["category"], string> = {
  basic: "Básica",
  economic: "Econômica",
  traditional: "Tradicional",
  complete: "Completa",
};

export default function ResultPage() {
  const [answers, setAnswers] = useState<Answers>({});
  const [questionLabels, setQuestionLabels] = useState<QuestionLabel[]>([]);
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState<Record<string, string>>({});
  const [baskets, setBaskets] = useState<Basket[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      try {
        setAnswers(JSON.parse(sessionStorage.getItem("forticestas_answers") || "{}"));
        setQuestionLabels(JSON.parse(sessionStorage.getItem("forticestas_question_labels") || "[]"));
        setCep(sessionStorage.getItem("forticestas_cep") || "");
        setAddress(JSON.parse(sessionStorage.getItem("forticestas_address") || "{}"));
      } catch {
        // Invalid or expired browser session: show the fallback state.
      }
    });

    fetch("/api/catalog", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Não foi possível consultar o catálogo.");
        return response.json();
      })
      .then((data: { baskets?: Basket[]; error?: string }) => {
        if (!active) return;
        setBaskets(data.baskets || []);
        if (data.error) setCatalogError(data.error);
      })
      .catch((caught) => {
        if (!active) return;
        setCatalogError(caught instanceof Error ? caught.message : "Não foi possível consultar o catálogo.");
        setBaskets([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const quizAnswers: QuizAnswers = {
    household: typeof answers.household === "string" ? answers.household : undefined,
    goal: typeof answers.goal === "string" ? answers.goal : undefined,
    foods: Array.isArray(answers.foods)
      ? answers.foods
      : typeof answers.foods === "string" ? [answers.foods] : undefined,
    budget: typeof answers.budget === "string" ? answers.budget : undefined,
    frequency: typeof answers.frequency === "string" ? answers.frequency : undefined,
    basket: typeof answers.basket === "string" ? answers.basket : undefined,
  };
  const ranked = useMemo(
    () => rankBaskets(
      baskets.map((basket) => ({
        id: basket.id,
        name: basket.name,
        category: basket.category || "traditional",
        priceCents: basket.price_cents,
        active: basket.active !== false,
        supportedHouseholds: basket.supported_households || [],
        foodTags: basket.food_tags || [],
      })),
      quizAnswers,
    ),
    [baskets, quizAnswers],
  );
  const rankedBaskets = ranked.map((item) => ({
    ...baskets.find((basket) => basket.id === item.basket.id)!,
    score: item.score,
    reasons: item.reasons,
  }));

  const answeredItems = questionLabels
    .filter((question) => answers[question.key] !== undefined)
    .map((question) => ({
      title: question.title,
      value: Array.isArray(answers[question.key])
        ? (answers[question.key] as string[]).join(", ")
        : String(answers[question.key]),
    }));

  return (
    <main className="quiz-wrap">
      <section className="quiz-card result-card">
        <Link href="/" className="forti-brand"><Image src="/images/logo.svg" alt="" width={38} height={38}/><span><strong>FortiCestas</strong><small>Cestas básicas para sua família</small></span></Link>
        <div className="mt-8">
          <span className="quiz-kicker">Perfil concluído</span>
          <h1>Encontramos opções para sua família.</h1>
          <p className="quiz-sub">
            Consideramos seu orçamento, o tamanho da família, os alimentos escolhidos e o tipo de cesta preferido.
          </p>

          {answeredItems.length > 0 && (
            <div className="profile-summary">
              <div className="profile-summary-title">Resumo das suas respostas</div>
              {answeredItems.map((item) => (
                <div className="profile-row" key={item.title}>
                  <span>{item.title}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          )}

          <div className="result-section-heading">
            <div>
              <span className="quiz-kicker">Recomendação personalizada</span>
              <h2>As cestas mais alinhadas ao seu perfil</h2>
            </div>
          </div>

          {loading ? (
            <div className="quiz-loading" aria-live="polite">
              <span className="quiz-spinner" />
              <strong>Analisando suas respostas...</strong>
              <p>Comparando seu perfil com as cestas disponíveis no catálogo.</p>
            </div>
          ) : catalogError ? (
            <div className="empty-state mt-4">
              <h2>Não foi possível carregar as cestas agora.</h2>
              <p>{catalogError}</p>
              <button className="secondary-btn mt-3" onClick={() => window.location.reload()}>Tentar novamente</button>
            </div>
          ) : rankedBaskets.length ? (
            <div className="recommendation-list">
              {rankedBaskets.slice(0, 3).map((basket, index) => (
                <article className={index === 0 ? "recommendation-card recommended" : "recommendation-card"} key={basket.id}>
                  <div className="recommendation-image"><Image src={basket.image_url || STARTER_BASKETS.find((item) => item.slug === basket.slug)?.image_url || "/images/hero.svg"} alt={"Ilustração da " + basket.name} fill unoptimized sizes="(max-width: 760px) 100vw, 680px" /></div>
                  {index === 0 && <span className="recommendation-label">Mais alinhada ao seu perfil</span>}
                  <div className="recommendation-card-heading">
                    <div>
                      <span className="recommendation-category">{categoryLabels[basket.category]}</span>
                      <h3>{basket.name}</h3>
                    </div>
                    <strong className="recommendation-price">{money(basket.price_cents)}</strong>
                  </div>
                  <p>{basket.description}</p>
                  {basket.reasons.length > 0 && (
                    <ul className="recommendation-reasons">
                      {basket.reasons.map((reason) => <li key={reason}>✓ {reason}</li>)}
                    </ul>
                  )}
                  <Link href={"/cestas/" + basket.slug} className="primary-btn mt-3">
                    Ver composição da cesta →
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state mt-4">
              <h2>Estamos preparando as primeiras cestas.</h2>
              <p>Seu perfil foi concluído, mas ainda não há cestas publicadas no catálogo. Volte em breve para ver as opções.</p>
              <Link href="/cestas" className="secondary-btn mt-3">Abrir catálogo</Link>
            </div>
          )}

          <div className="result-address">
            <h3>Região informada</h3>
            <p>{cep ? `${cep.slice(0, 5)}-${cep.slice(5)} · ${address.localidade || ""} / ${address.uf || ""}` : "CEP não informado"}</p>
            {(address.logradouro || address.bairro) && (
              <p>{[address.logradouro, address.bairro].filter(Boolean).join(" · ")}</p>
            )}
            <small>O frete e o prazo exatos serão calculados no checkout, antes do pagamento.</small>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/quiz" className="primary-btn">Refazer meu perfil</Link>
            <Link href="/cestas" className="secondary-btn">Ver todo o catálogo</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
