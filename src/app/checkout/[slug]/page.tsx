import Image from "next/image";
import Link from "next/link";
import {notFound} from "next/navigation";
import {QrCode,ShieldCheck,Truck} from "lucide-react";
import CheckoutForm from "@/components/checkout-form";
import {readLocalStore,publicBasket} from "@/lib/local-store";
import {DEFAULT_HOME_CONTENT} from "@/lib/home-content";
export const dynamic="force-dynamic";
export default async function CheckoutPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params,store=await readLocalStore(),basket=store.baskets.find((item)=>item.slug===slug&&item.active);
 if(!basket)notFound();
 const product=publicBasket(basket,store),c=store.home_content||DEFAULT_HOME_CONTENT;
 return <main className="page-shell">
  <header className="topbar forti-topbar"><Link href="/" className="forti-brand"><Image src={c.logo_url||"/images/logo.svg"} alt="" width={44} height={44} unoptimized/><span><strong>{c.brand_name}</strong><small>{c.brand_tagline}</small></span></Link><Link href={"/cestas/"+slug} className="secondary-btn">Voltar à cesta</Link></header>
  <section className="section checkout-layout" style={{paddingTop:"36px"}}>
   <div className="checkout-intro">
    <span className="eyebrow">{c.checkout_eyebrow}</span>
    <h1>{c.checkout_title}</h1>
    <p className="section-lead">{c.checkout_description}</p>
    <div className="checkout-trust" aria-label="Informações da compra">
     <div className="checkout-trust-item"><span className="checkout-trust-icon"><ShieldCheck size={21} strokeWidth={2}/></span><span><strong>{c.checkout_trust_one}</strong><small>Usamos seus dados para processar o pedido e organizar a entrega.</small></span></div>
     <div className="checkout-trust-item"><span className="checkout-trust-icon"><QrCode size={21} strokeWidth={2}/></span><span><strong>Pagamento via Pix</strong><small>O código é gerado após o preenchimento dos dados.</small></span></div>
     <div className="checkout-trust-item"><span className="checkout-trust-icon"><Truck size={21} strokeWidth={2}/></span><span><strong>{c.checkout_trust_three}</strong><small>Sem cobrança adicional de entrega no total do pedido.</small></span></div>
    </div>
   </div>
   <CheckoutForm basket={{name:product.name,slug:product.slug,price_cents:product.price_cents}} content={c}/>
  </section>
  <footer className="footer forti-footer"><Link href="/" className="forti-brand"><Image src={c.logo_url||"/images/logo.svg"} alt="" width={38} height={38} unoptimized/><span><strong>{c.brand_name}</strong><small>{c.brand_tagline}</small></span></Link><p>{c.footer_description}</p></footer>
 </main>;
}
