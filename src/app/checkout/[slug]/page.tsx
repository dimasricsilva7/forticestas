import Image from "next/image";
import Link from "next/link";
import {notFound} from "next/navigation";
import CheckoutForm from "@/components/checkout-form";
import {readLocalStore,publicBasket} from "@/lib/local-store";
export const dynamic="force-dynamic";
export default async function CheckoutPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params,store=await readLocalStore(),basket=store.baskets.find((item)=>item.slug===slug&&item.active);
 if(!basket)notFound();
 const product=publicBasket(basket,store);
 return <main className="page-shell">
  <header className="topbar forti-topbar"><Link href="/" className="forti-brand"><Image src="/images/logo.svg" alt="" width={44} height={44}/><span><strong>FortiCestas</strong><small>Cestas básicas para sua família</small></span></Link><Link href={"/cestas/"+slug} className="secondary-btn">Voltar à cesta</Link></header>
  <section className="section checkout-layout" style={{paddingTop:"36px"}}>
   <div className="checkout-intro"><span className="eyebrow">Compra segura</span><h1>Falta pouco para receber sua cesta.</h1><p className="section-lead">Informe os dados de contato e o endereço de entrega. O frete é grátis para o endereço informado.</p><div className="checkout-trust"><span>🔒 Dados protegidos</span><span>⚡ Pix pela BravoPay</span><span>🚚 Frete grátis</span></div></div>
   <CheckoutForm basket={{name:product.name,slug:product.slug,price_cents:product.price_cents}}/>
  </section>
  <footer className="footer forti-footer"><span>FortiCestas · Frete grátis · Pagamento via Pix</span></footer>
 </main>;
}
