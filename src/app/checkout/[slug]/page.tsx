import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicSupabase } from "@/lib/supabase/server";
import CheckoutForm from "@/components/checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = createPublicSupabase();
  if (!db) {
    return <main className="quiz-wrap"><section className="quiz-card">
      <h1>Checkout em configuração</h1>
      <p className="quiz-sub">O catálogo precisa estar conectado ao Supabase antes de receber pedidos.</p>
      <Link className="secondary-btn" href="/cestas">Voltar ao catálogo</Link>
    </section></main>;
  }

  const { data: basket, error } = await db.from("baskets")
    .select("name, slug, description, price_cents")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    return <main className="quiz-wrap"><section className="quiz-card">
      <h1>Não foi possível abrir o checkout.</h1>
      <p className="quiz-sub">Tente novamente mais tarde.</p>
    </section></main>;
  }
  if (!basket) notFound();

  return (
    <main className="page-shell">
      <header className="topbar">
        <Link href="/" className="brand"><span className="brand-mark">F</span> FortiCestas</Link>
        <Link href={"/cestas/"+basket.slug} className="secondary-btn">Voltar à cesta</Link>
      </header>
      <section className="section checkout-layout" style={{paddingTop:"36px"}}>
        <div className="checkout-intro">
          <span className="eyebrow">Compra segura</span>
          <h1>Falta pouco para receber sua cesta.</h1>
          <p className="section-lead">Informe os dados de contato e o endereço de entrega. O frete será consultado antes da criação da cobrança Pix.</p>
          <div className="checkout-trust"><span>🔒 Dados protegidos</span><span>⚡ Pix pela BravoPay</span><span>🚚 Cotação de entrega antes de pagar</span></div>
        </div>
        <CheckoutForm basket={basket}/>
      </section>
      <footer className="footer">FortiCestas · Alimentos essenciais para o dia a dia</footer>
    </main>
  );
}
