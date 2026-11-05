import Image from "next/image";
import Link from "next/link";
import {notFound} from "next/navigation";
import {readLocalStore,publicBasket} from "@/lib/local-store";
import {formatBRL} from "@/lib/catalog";
export const dynamic="force-dynamic";
export default async function BasketDetailPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params,store=await readLocalStore(),saved=store.baskets.find((item)=>item.slug===slug&&item.active);
 if(!saved)notFound();
 const basket=publicBasket(saved,store);
 return <main className="page-shell">
  <header className="topbar forti-topbar"><Link href="/" className="forti-brand"><Image src="/images/logo.svg" alt="" width={48} height={48}/><span><strong>FortiCestas</strong><small>Cestas básicas para sua família</small></span></Link><Link href="/cestas" className="secondary-btn">Voltar ao catálogo</Link></header>
  <section className="section forti-detail-layout">
   <div className="forti-detail-image"><Image src={basket.image_url} alt={"Ilustração da "+basket.name} fill priority unoptimized sizes="(max-width: 760px) 100vw, 50vw"/></div>
   <div className="forti-detail-copy"><span className="eyebrow">Composição transparente</span><h1>{basket.name}</h1><p className="section-lead">{basket.description}</p><strong className="detail-main-price">{formatBRL(basket.price_cents)}</strong>
    <p className="detail-disclaimer">Ilustração representativa. Marcas e apresentação das embalagens podem variar, mantendo os itens e quantidades descritos.</p>
    <h2>O que vem nesta cesta</h2><ul className="forti-items-list">{basket.items.map((item,index)=><li key={item.name+"-"+index}><span>{item.name}</span><strong>{item.quantity} × {item.unit}</strong></li>)}</ul>
    <div className="forti-purchase-notes"><span>✓ Composição informada antes da compra</span><span>✓ Frete grátis</span><span>✓ Pagamento via Pix</span></div>
    <Link href={"/checkout/"+slug} className="primary-btn forti-buy-button">Continuar para o checkout <span aria-hidden>→</span></Link><Link href="/quiz" className="detail-quiz-link">Não sabe qual escolher? Faça o quiz.</Link>
   </div>
  </section><footer className="footer forti-footer"><span>FortiCestas · Frete grátis · Pagamento via Pix</span></footer>
 </main>;
}
