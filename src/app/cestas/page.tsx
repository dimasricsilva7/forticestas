import Image from "next/image";
import Link from "next/link";
import {readLocalStore,publicCatalog} from "@/lib/local-store";
import {formatBRL} from "@/lib/catalog";
export const dynamic="force-dynamic";
export default async function CestasPage(){
 const store=await readLocalStore(),baskets=publicCatalog(store);
 return <main className="page-shell">
  <header className="topbar forti-topbar"><Link href="/" className="forti-brand"><Image src="/images/logo.svg" alt="" width={48} height={48}/><span><strong>FortiCestas</strong><small>Cestas básicas para sua família</small></span></Link><Link href="/quiz" className="header-cta">Encontrar minha cesta <span aria-hidden>→</span></Link></header>
  <section className="section forti-catalog-page"><span className="eyebrow">Catálogo FortiCestas</span><h1>Quatro opções para abastecer sua casa.</h1><p className="section-lead">Compare os preços, confira a composição de cada cesta e escolha a opção que faz sentido para sua família. Todas com frete grátis.</p>
   <div className="forti-product-grid">{baskets.map((basket)=><article className="forti-product-card" key={basket.slug}>
    <Link href={"/cestas/"+basket.slug} className="forti-product-image"><Image src={basket.image_url} alt={"Ilustração da "+basket.name} fill unoptimized sizes="(max-width: 760px) 90vw, 25vw"/></Link>
    <div className="forti-product-body"><div className="product-topline"><span>{basket.item_count} tipos de itens</span><span>{basket.supported_households[0]||"Várias famílias"}</span></div><h2>{basket.name}</h2><p>{basket.description}</p><strong className="product-price">{formatBRL(basket.price_cents)}</strong><Link href={"/cestas/"+basket.slug} className="product-link">Conferir itens da cesta <span aria-hidden>→</span></Link></div>
   </article>)}</div>
   <div className="forti-quiz-banner"><div><span className="quiz-banner-icon">✓</span><div><strong>Quer uma recomendação personalizada?</strong><p>Responda às perguntas do quiz e compare as opções adequadas ao seu perfil.</p></div></div><Link href="/quiz" className="primary-btn">Começar quiz <span aria-hidden>→</span></Link></div>
  </section><footer className="footer forti-footer"><span>FortiCestas · Frete grátis · Pagamento via Pix</span></footer>
 </main>;
}
