import Image from "next/image";
import Link from "next/link";
import {createPublicSupabase} from "@/lib/supabase/server";
import {getStarterBasket,formatBRL} from "@/lib/catalog";

export const revalidate=60;

export default async function BasketDetailPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const starter=getStarterBasket(slug);
 const db=createPublicSupabase();
 let basket:{id:string;name:string;slug:string;description:string;price_cents:number;image_url:string|null;basket_items?:Array<{quantity:number;products?:Array<{name:string}>|{name:string}|null}>}|null=null;
 if(db){
  const {data}=await db.from("baskets").select("id,name,slug,description,price_cents,image_url,basket_items(quantity,products(name))").eq("slug",slug).eq("active",true).maybeSingle();
  basket=data;
 }
 if(!basket&&!starter)return <main className="quiz-wrap"><section className="quiz-card"><h1>Cesta não encontrada.</h1><Link href="/cestas" className="secondary-btn">Voltar ao catálogo</Link></section></main>;
 const name=basket?.name||starter!.name;
 const description=basket?.description||starter!.description;
 const priceCents=basket?.price_cents??starter!.price_cents;
 const imageUrl=basket?.image_url||starter?.image_url||"/images/hero.svg";
 const items=starter?.items||(basket?.basket_items||[]).map((item)=>{
  const product=Array.isArray(item.products)?item.products[0]:item.products;
  return {name:product?.name||"Produto",quantity:item.quantity,unit:"unidade(s)"};
 });
 return <main className="page-shell">
  <header className="topbar forti-topbar"><Link href="/" className="forti-brand"><Image src="/images/logo.svg" alt="" width={48} height={48}/><span><strong>FortiCestas</strong><small>Cestas básicas para sua família</small></span></Link><Link href="/cestas" className="secondary-btn">Voltar ao catálogo</Link></header>
  <section className="section forti-detail-layout">
   <div className="forti-detail-image"><Image src={imageUrl} alt={"Ilustração da "+name} fill priority sizes="(max-width: 760px) 100vw, 50vw"/></div>
   <div className="forti-detail-copy"><span className="eyebrow">Composição transparente</span><h1>{name}</h1><p className="section-lead">{description}</p>
    <strong className="detail-main-price">{formatBRL(priceCents)}</strong><p className="detail-disclaimer">Ilustração representativa. Marcas e apresentação das embalagens podem variar, mantendo os itens e quantidades descritos.</p>
    <h2>O que vem nesta cesta</h2><ul className="forti-items-list">{items.map((item,index)=><li key={item.name+"-"+index}><span>{item.name}</span><strong>{item.quantity} × {item.unit}</strong></li>)}</ul>
    <div className="forti-purchase-notes"><span>✓ Composição informada antes da compra</span><span>✓ Frete calculado pelo CEP no checkout</span></div>
    <Link href={"/checkout/"+slug} className="primary-btn forti-buy-button">Continuar para o checkout <span aria-hidden>→</span></Link><Link href="/quiz" className="detail-quiz-link">Não sabe qual escolher? Faça o quiz.</Link>
   </div>
  </section><footer className="footer forti-footer"><span>FortiCestas · Alimentos essenciais para o dia a dia</span></footer>
 </main>;
}
