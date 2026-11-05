import Image from "next/image";
import Link from "next/link";
import {readLocalStore,publicCatalog} from "@/lib/local-store";
import {formatBRL} from "@/lib/catalog";
import {DEFAULT_HOME_CONTENT} from "@/lib/home-content";
export const dynamic="force-dynamic";
export default async function CestasPage(){
 const store=await readLocalStore(),baskets=publicCatalog(store),c=store.home_content||DEFAULT_HOME_CONTENT;
 return <main className="page-shell">
  <header className="topbar forti-topbar"><Link href="/" className="forti-brand"><Image src={c.logo_url||"/images/logo.svg"} alt="" width={48} height={48} unoptimized/><span><strong>{c.brand_name}</strong><small>{c.brand_tagline}</small></span></Link><Link href={c.header_button_url} className="header-cta">{c.header_button_text} <span aria-hidden>→</span></Link></header>
  <section className="section forti-catalog-page"><span className="eyebrow">{c.catalog_page_eyebrow}</span><h1>{c.catalog_page_title}</h1><p className="section-lead">{c.catalog_page_description}</p>
   <div className="forti-product-grid">{baskets.map((basket)=><article className="forti-product-card" key={basket.slug}>
    <Link href={"/cestas/"+basket.slug} className="forti-product-image"><Image src={basket.image_url} alt={"Imagem da "+basket.name} fill unoptimized sizes="(max-width: 760px) 90vw, 25vw"/></Link>
    <div className="forti-product-body"><div className="product-topline"><span>{basket.item_count} tipos de itens</span><span>{basket.supported_households[0]||"Várias famílias"}</span></div><h2>{basket.name}</h2><p>{basket.description}</p><strong className="product-price">{formatBRL(basket.price_cents)}</strong><Link href={"/cestas/"+basket.slug} className="product-link">{c.basket_card_button_text} <span aria-hidden>→</span></Link></div>
   </article>)}</div>
   <div className="forti-quiz-banner"><div><span className="quiz-banner-icon">✓</span><div><strong>{c.catalog_quiz_title}</strong><p>{c.catalog_quiz_description}</p></div></div><Link href={c.quiz_banner_button_url} className="primary-btn">{c.catalog_quiz_button_text} <span aria-hidden>→</span></Link></div>
  </section><footer className="footer forti-footer"><Link href="/" className="forti-brand"><Image src={c.logo_url||"/images/logo.svg"} alt="" width={38} height={38} unoptimized/><span><strong>{c.brand_name}</strong><small>{c.brand_tagline}</small></span></Link><p>{c.footer_description}</p></footer>
 </main>;
}
