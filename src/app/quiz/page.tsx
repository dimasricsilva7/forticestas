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
  required?: boolean;
};
type Answers = Record<string, string | string[]>;

const budgetOptions: QuizOption[] = [
  { value: "Até R$ 100", description: "A opção de entrada" },
  { value: "R$ 101 a R$ 175", description: "Economia com mais variedade" },
  { value: "R$ 176 a R$ 250", description: "Uma cesta mais reforçada" },
  { value: "Acima de R$ 250", description: "Quero comparar as opções mais completas" },
];

const fallbackSteps: QuizStep[] = [
  {
    key: "household",
    title: "Quantas pessoas vivem na sua casa?",
    subtitle: "Assim conseguimos considerar o tamanho da sua família na recomendação.",
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
    subtitle: "Escolha a prioridade que melhor representa sua compra.",
    options: [
      { value: "Economizar", description: "Quero aproveitar melhor meu orçamento" },
      { value: "Itens essenciais", description: "Quero garantir o básico em casa" },
      { value: "Variedade", description: "Quero uma seleção mais completa" },
    ],
  },
  {
    key: "foods",
    title: "Quais itens não podem faltar?",
    subtitle: "Marque todos os grupos de alimentos que sua família costuma consumir.",
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
    subtitle: "Vamos priorizar cestas dentro do valor que pretende investir.",
    options: [
      { value: "Até R$ 100", description: "A opção de entrada" },
      { value: "R$ 101 a R$ 175", description: "Economia com mais variedade" },
      { value: "R$ 176 a R$ 250", description: "Uma cesta mais reforçada" },
      { value: "Acima de R$ 250", description: "Quero comparar as opções mais completas" },
    ],
  },
  {
    key: "frequency",
    title: "Com que frequência pretende comprar?",
    subtitle: "Essa informação ajuda a entender a rotina de reposição da sua casa.",
    options: [
      { value: "Uma vez", description: "Compra pontual" },
      { value: "Todo mês", description: "Reposição mensal" },
      { value: "A cada 15 dias", description: "Reposição quinzenal" },
    ],
  },
  {
    key: "basket",
    title: "Qual tipo de cesta prefere?",
    subtitle: "Escolha o perfil de cesta que mais combina com o que procura.",
    options: [
      { value: "Básica", description: "Só o essencial para a despensa" },
      { value: "Econômica", description: "Mais itens com foco no orçamento" },
      { value: "Tradicional", description: "Equilíbrio entre quantidade e variedade" },
      { value: "Completa", description: "Nossa seleção mais robusta" },
    ],
  },
];

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? digits.slice(0, 5) + "-" + digits.slice(5) : digits;
}

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [cep, setCep] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [quizSteps, setQuizSteps] = useState<QuizStep[]>(fallbackSteps);

  useEffect(() => {
    let active = true;
    fetch("/api/quiz-config", { cache: "no-store", signal: AbortSignal.timeout(5000) })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: { questions?: Array<{
        question_key: string;
        title: string;
        subtitle: string;
        options: QuizOption[];
        multi?: boolean;
        required?: boolean;
      }> }) => {
        const configured: QuizStep[] = (data.questions || [])
          .filter((question) =>
            typeof question.question_key === "string" &&
            typeof question.title === "string" &&
            Array.isArray(question.options) &&
            question.options.length >= 2,
          )
          .map((question) => ({
            key: question.question_key,
            title: question.title,
            subtitle: question.subtitle || "",
            options: question.question_key === "budget"
              ? budgetOptions
              : question.question_key === "basket"
                ? [...question.options.filter((option) => option.value !== "Básica"), { value: "Básica", description: "Só o essencial para a despensa" }]
                : question.options,
            multi: Boolean(question.multi),
            required: question.required !== false,
          }));
        if (active && configured.length) {
          setQuizSteps(configured);
        }
      })
      .catch(() => {
        // The built-in questionnaire remains available if Supabase is offline.
      })
      .finally(() => {
        if (active) setConfigLoading(false);
      });

    return () => { active = false; };
  }, []);

  const current = quizSteps[step] || fallbackSteps[0];
  const progress = useMemo(
    () => Math.round(((step + 1) / (quizSteps.length + 1)) * 100),
    [step, quizSteps.length],
  );
  const selectedCount = Array.isArray(answers[current.key])
    ? (answers[current.key] as string[]).length
    : answers[current.key] ? 1 : 0;

  function choose(value: string) {
    setError("");
    setAnswers((previous) => {
      if (!current.multi) return { ...previous, [current.key]: value };
      const selected = Array.isArray(previous[current.key])
        ? previous[current.key] as string[]
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
    if (current.required !== false && (!selected || (Array.isArray(selected) && selected.length === 0))) {
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
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error("Não foi possível consultar o CEP.");
      const data: {
        erro?: boolean;
        cep?: string;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      } = await response.json();

      if (data.erro) throw new Error("CEP não encontrado. Confira os números.");

      sessionStorage.setItem("forticestas_answers", JSON.stringify(answers));
      sessionStorage.setItem("forticestas_question_labels", JSON.stringify(
        quizSteps.map(({ key, title }) => ({ key, title })),
      ));
      sessionStorage.setItem("forticestas_cep", digits);
      sessionStorage.setItem("forticestas_address", JSON.stringify(data));
      sessionStorage.setItem("forticestas_quiz_completed_at", new Date().toISOString());
      router.push("/resultado");
    } catch (caught) {
      setError(caught instanceof Error
        ? caught.message
        : "Não foi possível validar o CEP. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="quiz-wrap">
      <section className="quiz-card">
        <header className="flex items-center justify-between gap-3">
          <Link href="/" className="brand">
            <span className="brand-mark">F</span> FortiCestas
          </Link>
          <span className="text-xs text-gray-500">
            {configLoading ? "Preparando quiz..." : `Etapa ${Math.min(step + 1, quizSteps.length + 1)} de ${quizSteps.length + 1}`}
          </span>
        </header>

        <div
          className="progress-track"
          role="progressbar"
          aria-label="Progresso do questionário"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={configLoading ? 0 : progress}
        >
          <div className="progress-fill" style={{ width: configLoading ? "0%" : `${progress}%` }} />
        </div>

        {configLoading ? (
          <div className="quiz-loading" aria-live="polite">
            <span className="quiz-spinner" />
            <strong>Preparando suas perguntas...</strong>
            <p>Estamos organizando as opções para encontrar uma cesta adequada à sua família.</p>
          </div>
        ) : step < quizSteps.length ? (
          <>
            <span className="quiz-kicker">Vamos encontrar sua cesta</span>
            <h1>{current.title}</h1>
            <p className="quiz-sub">{current.subtitle}</p>
            <div className="choice-list">
              {current.options.map((option) => {
                const selected = current.multi
                  ? (answers[current.key] as string[] | undefined)?.includes(option.value)
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
                    <span aria-hidden>{selected ? "✓" : current.multi ? "＋" : "○"}</span>
                  </button>
                );
              })}
            </div>
            {current.multi && (
              <p className="quiz-selection-count" aria-live="polite">
                {selectedCount === 0
                  ? "Você pode selecionar mais de uma opção."
                  : `${selectedCount} opção(ões) selecionada(s).`}
              </p>
            )}
            {error && <p className="error-text" role="alert">{error}</p>}
            <div className="quiz-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => step === 0 ? router.push("/") : setStep((value) => value - 1)}
              >
                Voltar
              </button>
              <button type="button" className="primary-btn" onClick={next}>
                {step === quizSteps.length - 1 ? "Continuar para o CEP →" : "Continuar →"}
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="quiz-kicker">Última etapa</span>
            <h1>Para onde enviamos sua cesta?</h1>
            <p className="quiz-sub">
              Informe seu CEP para identificar a região de entrega. O valor e o prazo do frete serão confirmados antes do pagamento.
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
              onChange={(event) => setCep(formatCep(event.target.value))}
              maxLength={9}
              aria-describedby={error ? "cep-error" : undefined}
            />
            {error && <p id="cep-error" className="error-text" role="alert">{error}</p>}
            <div className="quiz-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setStep((value) => value - 1)}
                disabled={loading}
              >
                Voltar
              </button>
              <button
                type="button"
                className="primary-btn"
                disabled={loading}
                onClick={submitCep}
              >
                {loading ? "Consultando CEP..." : "Ver minha recomendação →"}
              </button>
            </div>
            <p className="quiz-privacy-note">
              Usaremos o CEP apenas para identificar sua região e preparar a consulta de entrega.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
