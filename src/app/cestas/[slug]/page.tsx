import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicSupabase } from "@/lib/supabase/server";

export const revalidate = 60;

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default async function BasketDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = createPublicSupabase();
  if (!db) return (
    <main className="quiz-wrap"><section className="quiz-card">
      <Link href="/" className="brand"><span className="brand-mark">F</span> FortiCestas</Link>
      <h1 className="mt-8">Catálogo em configuração</h1>
      <p className="quiz-sub">O catálogo será exibido quando o Supabase estiver configurado.</p>
    </section></main>
  );

  const { data: basket } = await db.from("baskets")
    .select("id, name, slug, description, price_cents, basket_items(quantity, products(name, sku, price_cents))")
    .eq("slug", slug).eq("active", true).maybeSingle();

  if (!basket) notFound();

  return (
    <main className="page-shell">
      <header className="topbar">
        <Link href="/" className="brand"><span className="brand-mark">F</span> FortiCestas</Link>
        <Link href="/cestas" className="secondary-btn">Voltar ao catálogo</Link>
      </header>
      <section className="section" style={{paddingTop:"44px",maxWidth:"900px"}}>
        <span className="eyebrow">Detalhes da cesta</span>
        <h1 style={{fontSize:"clamp(36px,6vw,54px)",letterSpacing:"-.05em",margin:"18px 0"}}>{basket.name}</h1>
        <p className="section-lead">{basket.description}</p>
        <div className="detail-panel">
          <h2>O que vem nesta cesta</h2>
          {basket.basket_items?.length ? (
            <ul className="detail-list">
              {basket.basket_items.map((item, index) => (
                <li key={index}><span>{item.products?.name || "Produto"}</span><strong>Quantidade: {item.quantity}</strong></li>
              ))}
            </ul>
          ) : <p className="section-lead">A composição será informada em breve.</p>}
          <div className="detail-price"><span>Valor da cesta</span><strong>{money(basket.price_cents)}</strong></div>
          <p className="text-xs text-gray-500 mt-3">Frete e prazo são calculados conforme o CEP antes da confirmação do pedido.</p>
          <Link className="primary-btn mt-5" href="/quiz">Encontrar a cesta ideal</Link>
        </div>
      </section>
      <footer className="footer">FortiCestas · Alimentos essenciais para o dia a dia</footer>
    </main>
  );
}
