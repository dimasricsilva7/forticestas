"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const steps = [
  { key: "household", title: "Quantas pessoas vivem na sua casa?", subtitle: "Vamos considerar o tamanho da sua família para sugerir uma cesta adequada.", options: [
    ["1 pessoa", "Uma pessoa"],
    ["2 pessoas", "Duas pessoas"],
    ["3 a 4 pessoas", "De três a quatro pessoas"],
    ["5 pessoas ou mais", "Cinco pessoas ou mais"]
  ]},
  { key: "goal", title: "O que é mais importante para você?", subtitle: "Escolha o que melhor representa sua prioridade neste momento.", options: [
    ["Economizar", "Quero aproveitar melhor meu orçamento"],
    ["Itens essenciais", "Quero garantir o básico em casa"],
    ["Variedade", "Quero uma seleção mais completa"]
  ]},
  { key: "foods", title: "Quais itens não podem faltar?", subtitle: "Selecione uma ou mais opções que sua família costuma consumir.", multi: true, options: [
    ["Arroz e feijão", "A base das refeições"],
    ["Massas e molhos", "Praticidade durante a semana"],
    ["Café e açúcar", "Para a rotina diária"],
    ["Óleo e temperos", "Complementos para cozinhar"],
    ["Biscoitos e complementos", "Itens para lanches"]
  ]},
  { key: "budget", title: "Qual faixa de orçamento você planeja?", subtitle: "Essa resposta ajuda a filtrar sugestões. Os valores finais serão exibidos antes do pagamento.", options: [
    ["Até R$ 150", "Uma opção econômica"],
    ["R$ 151 a R$ 250", "Equilíbrio entre preço e variedade"],
    ["R$ 251 a R$ 350", "Uma cesta mais completa"],
    ["Acima de R$ 350", "Maior variedade de itens"]
  ]},
  { key: "frequency", title: "Com que frequência pretende comprar?", subtitle: "Queremos entender o ritmo ideal para sua casa.", options: [
    ["Uma vez", "Compra pontual"],
    ["Todo mês", "Reposição mensal"],
    ["A cada 15 dias", "Reposição quinzenal"]
  ]},
  { key: "basket", title: "Qual tipo de cesta prefere?", subtitle: "Você pode refinar a escolha antes de ver a recomendação.", options: [
    ["Tradicional", "Alimentos básicos para o dia a dia"],
    ["Econômica", "Foco nos itens essenciais"],
    ["Completa", "Mais variedade de produtos"]
  ]}
] as const;

type Answers = Record<string, string | string[]>;

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [cep, setCep] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const current = steps[step];
  const progress = useMemo(() => Math.round(((step + 1) / (steps.length + 1)) * 100), [step]);

  function choose(value: string) {
    setError("");
    setAnswers(prev => {
      if (!current.multi) return { ...prev, [current.key]: value };
      const selected = Array.isArray(prev[current.key]) ? prev[current.key] as string[] : [];
      return { ...prev, [current.key]: selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value] };
    });
  }

  function next() {
    const selected = answers[current.key];
    if (!selected || (Array.isArray(selected) && selected.length === 0)) {
      setError("Selecione uma opção para continuar.");
      return;
    }
    setError("");
    setStep(v => v + 1);
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
      const data = await response.json();
      if (data.erro) throw new Error("CEP não encontrado. Confira os números.");
      sessionStorage.setItem("forticestas_answers", JSON.stringify(answers));
      sessionStorage.setItem("forticestas_cep", digits);
      sessionStorage.setItem("forticestas_address", JSON.stringify(data));
      router.push("/resultado");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível validar o CEP.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="quiz-wrap">
      <section className="quiz-card">
        <header className="flex justify-between items-center">
          <Link href="/" className="brand"><span className="brand-mark">F</span> FortiCestas</Link>
          <span className="text-xs text-gray-500">Etapa {Math.min(step + 1, steps.length + 1)} de {steps.length + 1}</span>
        </header>
        <div className="progress-track"><div className="progress-fill" style={{width: `${progress}%`}} /></div>
        {step < steps.length ? <>
          <span className="quiz-kicker">Vamos encontrar sua cesta</span>
          <h1>{current.title}</h1>
          <p className="quiz-sub">{current.subtitle}</p>
          <div className="choice-list">
            {current.options.map(([value,description]) => {
              const selected = current.multi ? (answers[current.key] as string[] | undefined)?.includes(value) : answers[current.key] === value;
              return <button type="button" key={value} onClick={() => choose(value)} className={`choice ${selected ? "selected" : ""}`}>
                <span><strong>{value}</strong><small>{description}</small></span><span aria-hidden>{selected ? "✓" : "＋"}</span>
              </button>;
            })}
          </div>
          {error && <p className="error-text">{error}</p>}
          <div className="quiz-actions">
            <button type="button" className="secondary-btn" onClick={() => step === 0 ? router.push("/") : setStep(v => v - 1)}>Voltar</button>
            <button type="button" className="primary-btn" onClick={next}>Continuar →</button>
          </div>
        </> : <>
          <span className="quiz-kicker">Última etapa</span>
          <h1>Para onde enviamos sua cesta?</h1>
          <p className="quiz-sub">Informe seu CEP para consultar o endereço. A disponibilidade e o valor do frete serão confirmados antes do pagamento.</p>
          <label className="block text-sm font-bold mb-2" htmlFor="cep">CEP</label>
          <input id="cep" className="text-input" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={cep} onChange={e => setCep(e.target.value)} maxLength={9} />
          {error && <p className="error-text">{error}</p>}
          <div className="quiz-actions">
            <button type="button" className="secondary-btn" onClick={() => setStep(v => v - 1)}>Voltar</button>
            <button type="button" className="primary-btn" disabled={loading} onClick={submitCep}>{loading ? "Consultando..." : "Ver minha sugestão →"}</button>
          </div>
        </>}
      </section>
    </main>
  );
}
