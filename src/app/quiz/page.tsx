"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type QuizOption = { value: string; description: string };
type QuizStep = {
  key: string;
  title: string;
  subtitle: string;
  options: QuizOption[];
  multi?: boolean;
};

const fallbackSteps: QuizStep[] = [
  {
    key: "household",
    title: "Quantas pessoas vivem na sua casa?",
    subtitle: "Vamos considerar o tamanho da sua família para sugerir uma cesta adequada.",
    options: [
      { value: "1 pessoa", description: "Uma pessoa" },
      { value: "2 pessoas", description: "Duas pessoas" },
      { value: "3 a 4 pessoas", description: "De três a quatro pessoas" },
      { value: "5 pessoas ou mais", description: "Cinco pessoas ou mais" },
    ],
  },
  {
    key: "goal",
    title: "O que é mais importante para você?",
    subtitle: "Escolha o que melhor representa sua prioridade neste momento.",
    options: [
      { value: "Economizar", description: "Quero aproveitar melhor meu orçamento" },
      { value: "Itens essenciais", description: "Quero garantir o básico em casa" },
      { value: "Variedade", description: "Quero uma seleção mais completa" },
    ],
  },
  {
    key: "foods",
    title: "Quais itens não podem faltar?",
    subtitle: "Selecione uma ou mais opções que sua família costuma consumir.",
    multi: true,
    options: [
      { value: "Arroz e feijão", description: "A base das refeições" },
      { value: "Massas e molhos", description: "Praticidade durante a semana" },
      { value: "Café e açúcar", description: "Para a rotina diária" },
      { value: "Óleo e temperos", description: "Complementos para cozinhar" },
      { value: "Biscoitos e complementos", description: "Itens para lanches" },
    ],
  },
  {
    key: "budget",
    title: "Qual faixa de orçamento você planeja?",
    subtitle: "Essa resposta ajuda a filtrar sugestões. Os valores finais serão exibidos antes do pagamento.",
    options: [
      { value: "Até R$ 150", description: "Uma opção econômica" },
      { value: "R$ 151 a R$ 250", description: "Equilíbrio entre preço e variedade" },
      { value: "R$ 251 a R$ 350", description: "Uma cesta mais completa" },
      { value: "Acima de R$ 350", description: "Maior variedade de itens" },
    ],
  },
  {
    key: "frequency",
    title: "Com que frequência pretende comprar?",
    subtitle: "Queremos entender o ritmo ideal para sua casa.",
    options: [
      { value: "Uma vez", description: "Compra pontual" },
      { value: "Todo mês", description: "Reposição mensal" },
      { value: "A cada 15 dias", description: "Reposição quinzenal" },
    ],
  },
  {
    key: "basket",
    title: "Qual tipo de cesta prefere?",
    subtitle: "Você pode refinar a escolha antes de ver a recomendação.",
    options: [
      { value: "Tradicional", description: "Alimentos básicos para o dia a dia" },
      { value: "Econômica", description: "Foco nos itens essenciais" },
      { value: "Completa", description: "Mais variedade de produtos" },
    ],
  },
];

type Answers = Record<string, string | string[]>;

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [cep, setCep] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [quizSteps, setQuizSteps] = useState<QuizStep[]>(fallbackSteps);
  useEffect(() => {
    let active = true;
    fetch("/api/quiz-config", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: { questions?: Array<{ question_key: string; title: string; subtitle: string; options: QuizOption[]; multi?: boolean }> }) => {
        const configured = (data.questions || [])
          .filter((question) => question.title && Array.isArray(question.options) && question.options.length >= 2)
          .map((question) => ({
            key: question.question_key,
            title: question.title,
            subtitle: question.subtitle || "",
            options: question.options,
            multi: Boolean(question.multi),
          }));
        if (active && configured.length) {
          setQuizSteps(configured);
          setStep(0);
          setAnswers({});
        }
      })
      .catch(() => {
        // Keep the built-in fallback questions if the database is not configured.
      });
    return () => { active = false; };
  }, []);
  const current = quizSteps[Math.min(step, quizSteps.length - 1)];
  const progress = useMemo(
    () => Math.round(((step + 1) / (quizSteps.length + 1)) * 100),
    [step, quizSteps.length],
  );

  function choose(value: string) {
    setError("");
    setAnswers((previous) => {
      if (!current.multi) return { ...previous, [current.key]: value };
      const selected = Array.isArray(previous[current.key])
        ? (previous[current.key] as string[])
        : [];
      return {
        ...previous,
        [current.key]: selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
      };
    });
  }

  function next() {
    const selected = answers[current.key];
    if (!selected || (Array.isArray(selected) && selected.length === 0)) {
      setError("Selecione uma opção para continuar.");
      return;
    }
    setError("");
    setStep((value) => value + 1);
  }

  async function submitCep() {
    const digits = cep.replace(/\D/g, "");
    if (!/^\d{8}$/.test(digits)) {
      setError("Digite um CEP válido com 8 números.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!response.ok) throw new Error("Não foi possível consultar o CEP.");
      const data: { erro?: boolean; localidade?: string; uf?: string } =
        await response.json();
      if (data.erro) throw new Error("CEP não encontrado. Confira os números.");

      sessionStorage.setItem("forticestas_answers", JSON.stringify(answers));
      sessionStorage.setItem("forticestas_cep", digits);
      sessionStorage.setItem("forticestas_address", JSON.stringify(data));
      router.push("/resultado");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível validar o CEP.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="quiz-wrap">
      <section className="quiz-card">
        <header className="flex items-center justify-between">
          <Link href="/" className="brand">
            <span className="brand-mark">F</span> FortiCestas
          </Link>
          <span className="text-xs text-gray-500">
            Etapa {Math.min(step + 1, quizSteps.length + 1)} de {quizSteps.length + 1}
          </span>
        </header>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {step < quizSteps.length ? (
          <>
            <span className="quiz-kicker">Vamos encontrar sua cesta</span>
            <h1>{current.title}</h1>
            <p className="quiz-sub">{current.subtitle}</p>
            <div className="choice-list">
              {current.options.map((option) => {
                const selected = current.multi
                  ? (answers[current.key] as string[] | undefined)?.includes(
                      option.value,
                    )
                  : answers[current.key] === option.value;

                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => choose(option.value)}
                    className={`choice ${selected ? "selected" : ""}`}
                    aria-pressed={Boolean(selected)}
                  >
                    <span>
                      <strong>{option.value}</strong>
                      <small>{option.description}</small>
                    </span>
                    <span aria-hidden>{selected ? "✓" : "＋"}</span>
                  </button>
                );
              })}
            </div>
            {error && <p className="error-text" role="alert">{error}</p>}
            <div className="quiz-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() =>
                  step === 0 ? router.push("/") : setStep((value) => value - 1)
                }
              >
                Voltar
              </button>
              <button type="button" className="primary-btn" onClick={next}>
                Continuar →
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="quiz-kicker">Última etapa</span>
            <h1>Para onde enviamos sua cesta?</h1>
            <p className="quiz-sub">
              Informe seu CEP para consultar o endereço. A disponibilidade e o
              valor do frete serão confirmados antes do pagamento.
            </p>
            <label className="mb-2 block text-sm font-bold" htmlFor="cep">
              CEP
            </label>
            <input
              id="cep"
              className="text-input"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              value={cep}
              onChange={(event) => setCep(event.target.value)}
              maxLength={9}
            />
            {error && <p className="error-text" role="alert">{error}</p>}
            <div className="quiz-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setStep((value) => value - 1)}
              >
                Voltar
              </button>
              <button
                type="button"
                className="primary-btn"
                disabled={loading}
                onClick={submitCep}
              >
                {loading ? "Consultando..." : "Ver minha sugestão →"}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
