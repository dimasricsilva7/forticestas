"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <Link href="/" className="brand"><span className="brand-mark">F</span> FortiCestas</Link>
        <span className="top-note">Praticidade para cuidar da sua família</span>
      </header>
      <section className="hero">
        <div>
          <span className="eyebrow">Sua compra mais simples</span>
          <h1>Uma cesta que combina com a <em>sua família.</em></h1>
          <p>Conte um pouco sobre sua casa e encontre uma sugestão de cesta básica de acordo com o tamanho da família, suas preferências e seu orçamento.</p>
          <Link href="/quiz" className="primary-btn">Encontrar minha cesta <span aria-hidden>→</span></Link>
          <div className="trust-row"><span>✓ Escolhas personalizadas</span><span>✓ Opções por orçamento</span><span>✓ Consulta de entrega por CEP</span></div>
        </div>
        <div className="hero-art" aria-label="Ilustração de cesta de alimentos">
          <div className="basket">
            <div className="basket-title"><span>Uma seleção para sua casa</span><span>🥬</span></div>
            <div className="basket-items">
              {["🍚","🫘","🛢️","🍝","☕","🥫","🍪","🧂","🥛"].map((food,i)=><div className="food" key={i}>{food}</div>)}
            </div>
            <div className="basket-foot"><span>Itens essenciais do dia a dia</span><strong>FortiCestas</strong></div>
          </div>
        </div>
      </section>
      <section className="section">
        <h2>Comprar pode ser mais fácil.</h2>
        <p className="section-lead">Uma experiência simples para entender o que faz sentido para a rotina da sua família.</p>
        <div className="benefits">
          <article className="benefit"><div className="benefit-icon">🧺</div><h3>Escolha orientada</h3><p>Responda algumas perguntas e receba uma sugestão alinhada ao que você procura.</p></article>
          <article className="benefit"><div className="benefit-icon">💰</div><h3>Respeite seu orçamento</h3><p>Informe a faixa de valor que pretende investir antes de ver as opções.</p></article>
          <article className="benefit"><div className="benefit-icon">🚚</div><h3>Consulte sua região</h3><p>Informe seu CEP para verificar as condições de entrega disponíveis.</p></article>
        </div>
      </section>
      <footer className="footer">FortiCestas · Alimentos essenciais para o dia a dia</footer>
    </main>
  );
}
