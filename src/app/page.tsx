import Image from "next/image";
import Link from "next/link";
import {readLocalStore,publicCatalog} from "@/lib/local-store";
import {formatBRL} from "@/lib/catalog";
export const dynamic="force-dynamic";

export default async function HomePage(){
 const store=await readLocalStore(),baskets=publicCatalog(store);
 return <main className="page-shell">
  <header className="topbar forti-topbar">
   <Link href="/" className="forti-brand" aria-label="FortiCestas - início"><Image src="/images/logo.svg" alt="" width={48} height={48} priority/><span><strong>FortiCestas</strong><small>Cestas básicas para sua família</small></span></Link>
   <nav className="forti-nav" aria-label="Navegação principal"><Link href="/">Início</Link><Link href="/cestas">Catálogo</Link><Link href="/quiz">Encontre sua cesta</Link></nav>
   <Link href="/quiz" className="header-cta">Encontrar minha cesta <span aria-hidden>→</span></Link>
  </header>
  <section className="forti-hero">
   <div className="forti-hero-copy"><span className="eyebrow">Mais praticidade para sua casa</span>
    <h1>O essencial da sua despensa, <em>em uma cesta só.</em></h1>
    <p>Escolha entre quatro opções de cestas básicas ou responda ao nosso quiz para encontrar a composição que combina com a rotina da sua família.</p>
    <div className="forti-hero-actions"><Link href="/quiz" className="primary-btn">Descobrir minha cesta <span aria-hidden>→</span></Link><Link href="/cestas" className="secondary-btn">Ver as quatro cestas</Link></div>
    <div className="forti-trust-row"><span><b>✓</b> Composição transparente</span><span><b>✓</b> Frete grátis</span><span><b>✓</b> Pagamento via Pix</span></div>
   </div>
   <div className="forti-hero-image"><Image src="/images/hero.svg" alt="Ilustração de uma cesta de alimentos com arroz, feijão, massas, óleo, café e leite" fill priority sizes="(max-width: 760px) 100vw, 52vw"/><div className="hero-image-caption"><span>FortiCestas</span><small>Alimentos essenciais para o dia a dia</small></div></div>
  </section>
  <section className="forti-benefits" aria-label="Vantagens">
   <div><span className="benefit-emoji">🧺</span><strong>Quatro opções</strong><small>Da básica à completa</small></div>
   <div><span className="benefit-emoji">🚚</span><strong>Frete grátis</strong><small>Sem custo adicional no checkout</small></div>
   <div><span className="benefit-emoji">⚡</span><strong>Pagamento via Pix</strong><small>Pix copia e cola pela BravoPay</small></div>
  </section>
  <section className="section forti-catalog-section" id="cestas">
   <div className="forti-section-heading"><div><span className="eyebrow">Catálogo FortiCestas</span><h2>Escolha a cesta ideal para sua casa.</h2><p className="section-lead">Quatro tamanhos de compra, com preços e itens apresentados antes de finalizar.</p></div><Link href="/cestas" className="text-link">Ver catálogo completo →</Link></div>
   <div className="forti-product-grid">{baskets.map((basket)=><article className="forti-product-card" key={basket.slug}>
    <Link href={"/cestas/"+basket.slug} className="forti-product-image"><Image src={basket.image_url} alt={"Ilustração da "+basket.name} fill sizes="(max-width: 760px) 90vw, 25vw"/></Link>
    <div className="forti-product-body"><div className="product-topline"><span>{basket.item_count} tipos de itens</span><span>{basket.supported_households[0]||"Várias famílias"}</span></div><h3>{basket.name}</h3><p>{basket.description}</p><strong className="product-price">{formatBRL(basket.price_cents)}</strong><Link href={"/cestas/"+basket.slug} className="product-link">Ver composição <span aria-hidden>→</span></Link></div>
   </article>)}</div>
   <div className="forti-quiz-banner"><div><span className="quiz-banner-icon">✓</span><div><strong>Não sabe qual escolher?</strong><p>Responda ao quiz e receba uma recomendação com base no orçamento e no tamanho da sua família.</p></div></div><Link href="/quiz" className="primary-btn">Fazer o quiz agora <span aria-hidden>→</span></Link></div>
  </section>
  <footer className="footer forti-footer"><Link href="/" className="forti-brand"><Image src="/images/logo.svg" alt="" width={38} height={38}/><span><strong>FortiCestas</strong><small>Cestas básicas para sua família</small></span></Link><p>Frete grátis. Pagamento via Pix. Consulte a composição de cada cesta antes de finalizar seu pedido.</p></footer>
 </main>;
}
