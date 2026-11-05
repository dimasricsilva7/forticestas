import Image from "next/image";
import Link from "next/link";
import {readLocalStore,publicCatalog} from "@/lib/local-store";
import {formatBRL} from "@/lib/catalog";
import {DEFAULT_HOME_CONTENT} from "@/lib/home-content";
export const dynamic="force-dynamic";

export default async function HomePage(){
 const store=await readLocalStore(),baskets=publicCatalog(store),c=store.home_content||DEFAULT_HOME_CONTENT;
 return <main className="page-shell forti-storefront">
  <div className="forti-promo-bar">
   <span><b aria-hidden>✓</b> Frete grátis nas cestas</span>
   <span><b aria-hidden>✓</b> Pagamento via Pix</span>
   <span><b aria-hidden>✓</b> Composição transparente</span>
  </div>
  <header className="topbar forti-topbar">
   <Link href="/" className="forti-brand" aria-label={c.brand_name+" - início"}><Image src={c.logo_url||"/images/logo.svg"} alt="" width={52} height={52} priority unoptimized/><span><strong>{c.brand_name}</strong><small>{c.brand_tagline}</small></span></Link>
   <nav className="forti-nav" aria-label="Navegação principal"><Link href={c.nav_home_url}>{c.nav_home_label}</Link><Link href={c.nav_catalog_url}>{c.nav_catalog_label}</Link><Link href={c.nav_quiz_url}>{c.nav_quiz_label}</Link></nav>
   <Link href={c.header_button_url} className="header-cta">{c.header_button_text} <span aria-hidden>→</span></Link>
  </header>
  <section className="forti-hero">
   <div className="forti-hero-copy">
    <span className="eyebrow forti-hero-eyebrow"><i aria-hidden/> {c.hero_eyebrow}</span>
    <h1>{c.hero_title} <em>{c.hero_highlight}</em></h1>
    <p>{c.hero_description}</p>
    <div className="forti-hero-actions"><Link href={c.hero_primary_url} className="primary-btn">{c.hero_primary_text} <span aria-hidden>→</span></Link><Link href={c.hero_secondary_url} className="secondary-btn">{c.hero_secondary_text}</Link></div>
    <div className="forti-trust-row"><span><b>✓</b> {c.trust_one_text}</span><span><b>✓</b> {c.trust_two_text}</span><span><b>✓</b> {c.trust_three_text}</span></div>
    <div className="forti-hero-note"><span aria-hidden>🧺</span><div><strong>Praticidade para o dia a dia</strong><small>Confira os itens e escolha a opção ideal para sua casa.</small></div></div>
   </div>
   <div className="forti-hero-image"><Image src={c.hero_image_url||"/images/hero-forticestas.svg"} alt={c.hero_image_alt} fill priority unoptimized sizes="(max-width: 760px) 100vw, 52vw"/><div className="hero-image-caption"><span>{c.hero_image_caption}</span><small>{c.hero_image_subtitle}</small></div><div className="forti-image-seal"><span aria-hidden>✓</span><div><strong>Escolha com confiança</strong><small>Veja a composição de cada cesta</small></div></div></div>
  </section>
  <section className="forti-benefits" aria-label="Vantagens">
   <div><span className="benefit-emoji">{c.benefit_one_icon}</span><strong>{c.benefit_one_title}</strong><small>{c.benefit_one_description}</small></div>
   <div><span className="benefit-emoji">{c.benefit_two_icon}</span><strong>{c.benefit_two_title}</strong><small>{c.benefit_two_description}</small></div>
   <div><span className="benefit-emoji">{c.benefit_three_icon}</span><strong>{c.benefit_three_title}</strong><small>{c.benefit_three_description}</small></div>
  </section>
  <section className="section forti-catalog-section" id="cestas">
   <div className="forti-section-heading"><div><span className="eyebrow">{c.catalog_eyebrow}</span><h2>{c.catalog_title}</h2><p className="section-lead">{c.catalog_description}</p></div><Link href={c.catalog_link_url} className="text-link">{c.catalog_link_text}</Link></div>
   <div className="forti-product-grid">{baskets.map((basket)=><article className="forti-product-card" key={basket.slug}>
    <Link href={"/cestas/"+basket.slug} className="forti-product-image"><Image src={basket.image_url} alt={"Imagem da "+basket.name} fill unoptimized sizes="(max-width: 760px) 90vw, 25vw"/></Link>
    <div className="forti-product-body"><div className="product-topline"><span>{basket.item_count} tipos de itens</span><span>{basket.supported_households[0]||"Várias famílias"}</span></div><h3>{basket.name}</h3><p>{basket.description}</p><strong className="product-price">{formatBRL(basket.price_cents)}</strong><Link href={"/cestas/"+basket.slug} className="product-link">{c.basket_card_button_text} <span aria-hidden>→</span></Link></div>
   </article>)}</div>
   <div className="forti-quiz-banner"><div><span className="quiz-banner-icon">✓</span><div><strong>{c.quiz_banner_title}</strong><p>{c.quiz_banner_description}</p></div></div><Link href={c.quiz_banner_button_url} className="primary-btn">{c.quiz_banner_button_text} <span aria-hidden>→</span></Link></div>
  </section>
  <footer className="footer forti-footer"><Link href="/" className="forti-brand"><Image src={c.logo_url||"/images/logo.svg"} alt="" width={42} height={42} unoptimized/><span><strong>{c.brand_name}</strong><small>{c.brand_tagline}</small></span></Link><p>{c.footer_description}</p></footer>
 </main>;
}
