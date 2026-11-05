import Image from "next/image";
import Link from "next/link";
import {notFound} from "next/navigation";
import {readLocalStore,publicBasket} from "@/lib/local-store";
import {formatBRL} from "@/lib/catalog";
import {DEFAULT_HOME_CONTENT} from "@/lib/home-content";
export const dynamic="force-dynamic";
export default async function BasketDetailPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params,store=await readLocalStore(),saved=store.baskets.find((item)=>item.slug===slug&&item.active);
 if(!saved)notFound();
 const basket=publicBasket(saved,store),c=store.home_content||DEFAULT_HOME_CONTENT;
 return <main className="page-shell">
  <header className="topbar forti-topbar"><Link href="/" className="forti-brand"><Image src={c.logo_url||"/images/logo.svg"} alt="" width={48} height={48} unoptimized/><span><strong>{c.brand_name}</strong><small>{c.brand_tagline}</small></span></Link><Link href="/cestas" className="secondary-btn">Voltar ao catálogo</Link></header>
  <section className="section forti-detail-layout">
   <div className="forti-detail-image"><Image src={basket.image_url} alt={basket.name} fill priority unoptimized sizes="(max-width: 760px) 100vw, 50vw"/></div>
   <div className="forti-detail-copy"><span className="eyebrow">{c.detail_eyebrow}</span><h1>{basket.name}</h1><p className="section-lead">{basket.description}</p><strong className="detail-main-price">{formatBRL(basket.price_cents)}</strong>
    <p className="detail-disclaimer">{c.detail_disclaimer}</p>
    <h2>{c.detail_items_title}</h2><ul className="forti-items-list">{basket.items.map((item,index)=><li key={item.name+"-"+index}><span>{item.name}</span><strong>{item.quantity} × {item.unit}</strong></li>)}</ul>
    <div className="forti-purchase-notes"><span>✓ {c.detail_trust_one}</span><span>✓ {c.detail_trust_two}</span><span>✓ {c.detail_trust_three}</span></div>
    <Link href={"/checkout/"+slug} className="primary-btn forti-buy-button">{c.detail_buy_button} <span aria-hidden>→</span></Link><Link href="/quiz" className="detail-quiz-link">{c.detail_quiz_link}</Link>
   </div>
  </section><footer className="footer forti-footer"><Link href="/" className="forti-brand"><Image src={c.logo_url||"/images/logo.svg"} alt="" width={38} height={38} unoptimized/><span><strong>{c.brand_name}</strong><small>{c.brand_tagline}</small></span></Link><p>{c.footer_description}</p></footer>
 </main>;
}
