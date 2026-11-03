import Link from "next/link";
import { createPublicSupabase } from "@/lib/supabase/server";

export const revalidate = 60;

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default async function CestasPage() {
  const db = createPublicSupabase();
  const { data: baskets } = db
    ? await db.from("baskets").select("id, name, slug, description, price_cents").eq("active", true).order("position")
    : { data: null };

  return (
    <main className="page-shell">
      <header className="topbar">
        <Link href="/" className="brand"><span className="brand-mark">F</span> FortiCestas</Link>
        <Link href="/quiz" className="primary-btn">Encontrar minha cesta</Link>
      </header>
      <section className="section" style={{paddingTop: "44px"}}>
        <span className="eyebrow">Catálogo FortiCestas</span>
        <h1 style={{fontSize:"clamp(36px,6vw,54px)",letterSpacing:"-.05em",margin:"18px 0 12px"}}>Cestas para facilitar sua rotina.</h1>
        <p className="section-lead">Veja as opções disponíveis. Composição, preço e estoque são definidos pela equipe FortiCestas.</p>
        {!db ? (
          <div className="empty-state">
            <h2>Catálogo em configuração</h2>
            <p>Estamos preparando as opções de cestas. Volte em breve ou use o quiz para informar o que sua família precisa.</p>
          </div>
        ) : !baskets?.length ? (
          <div className="empty-state">
            <h2>Novas cestas estão chegando.</h2>
            <p>O catálogo ainda não tem cestas publicadas. A equipe está cadastrando as primeiras opções.</p>
          </div>
        ) : (
          <div className="catalog-grid">
            {baskets.map((basket) => (
              <article className="catalog-card" key={basket.id}>
                <div className="catalog-image" aria-hidden>🧺</div>
                <div className="catalog-card-body">
                  <h2>{basket.name}</h2>
                  <p>{basket.description}</p>
                  <strong>{money(basket.price_cents)}</strong>
                  <Link className="primary-btn" href={`/cestas/${basket.slug}`}>Ver composição</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <footer className="footer">FortiCestas · Alimentos essenciais para o dia a dia</footer>
    </main>
  );
}
