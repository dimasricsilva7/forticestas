"use client";

import { useState } from "react";
import type {HomeContent} from "@/lib/home-content";

type CheckoutBasket = {
  name: string;
  slug: string;
  price_cents: number;
};

type PixPayment = {
  copy_paste: string;
  qr_code?: string | null;
  expires_at: string;
};

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" }).format(cents / 100);
}

export default function CheckoutForm({ basket, content }: { basket: CheckoutBasket; content: HomeContent }) {
  const [customer,setCustomer] = useState({name:"",email:"",phone:""});
  const [address,setAddress] = useState({cep:"",number:"",complement:""});
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [payment,setPayment] = useState<{orderNumber:number;amountCents:number;pix:PixPayment}|null>(null);
  const [copied,setCopied] = useState(false);
  const [idempotencyKey,setIdempotencyKey] = useState("");

  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const key = idempotencyKey || crypto.randomUUID();
    if (!idempotencyKey) setIdempotencyKey(key);
    try {
      const response = await fetch("/api/checkout",{
        method:"POST",
        headers:{"Content-Type":"application/json","Idempotency-Key":key},
        body:JSON.stringify({
          basketSlug:basket.slug,
          customer,
          cep:address.cep,
          number:address.number,
          complement:address.complement,
        }),
      });
      const data = await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível iniciar o checkout.");
      setPayment(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível iniciar o checkout.");
    } finally {
      setLoading(false);
    }
  }

  async function copyPix() {
    if (!payment?.pix.copy_paste) return;
    try {
      await navigator.clipboard.writeText(payment.pix.copy_paste);
      setCopied(true);
    } catch {
      setError("Não foi possível copiar automaticamente. Selecione e copie o código Pix.");
    }
  }

  if (payment) {
    return (
      <section className="checkout-panel">
        <span className="eyebrow">{content.checkout_order_number_prefix} #{payment.orderNumber}</span>
        <h2>{content.checkout_pix_title}</h2>
        <p className="section-lead">{content.checkout_pix_description}</p>
        <div className="checkout-total"><span>{content.checkout_total_label}</span><strong>{money(payment.amountCents)}</strong></div><p className="text-xs text-green-700 font-bold">{content.checkout_free_shipping_label}</p>
        <label className="checkout-label" htmlFor="pix-code">{content.checkout_pix_code_label}</label>
        <textarea id="pix-code" className="text-input pix-code" readOnly value={payment.pix.copy_paste} rows={5}/>
        <button type="button" className="primary-btn" onClick={()=>void copyPix()}>{copied?content.checkout_pix_copied_button+" ✓":content.checkout_pix_copy_button}</button>
        <p className="text-xs text-gray-500 mt-4">{content.checkout_expiration_note} {new Date(payment.pix.expires_at).toLocaleString("pt-BR")}</p>
        <p className="text-xs text-gray-500 mt-2">{content.checkout_payment_help}</p>
      </section>
    );
  }

  return (
    <form className="checkout-panel" onSubmit={submit}>
      <span className="eyebrow">{content.checkout_form_title}</span>
      <h2>{basket.name}</h2>
      <div className="checkout-total"><span>{content.checkout_basket_value_label}</span><strong>{money(basket.price_cents)}</strong></div><p className="text-xs text-green-700 font-bold">Frete grátis · R$ 0,00</p>
      <div className="checkout-fields">
        <label className="checkout-label">{content.checkout_customer_name_label}<input className="text-input" required minLength={2} maxLength={120} autoComplete="name" value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})}/></label>
        <div className="form-row">
          <label className="checkout-label">{content.checkout_customer_email_label}<input className="text-input" type="email" autoComplete="email" value={customer.email} onChange={e=>setCustomer({...customer,email:e.target.value})}/></label>
          <label className="checkout-label">{content.checkout_customer_phone_label}<input className="text-input" type="tel" required minLength={10} autoComplete="tel" placeholder="(11) 99999-9999" value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})}/></label>
        </div>
        <div className="form-row">
          <label className="checkout-label">{content.checkout_cep_label}<input className="text-input" required inputMode="numeric" autoComplete="postal-code" maxLength={9} placeholder="00000-000" value={address.cep} onChange={e=>setAddress({...address,cep:e.target.value})}/></label>
          <label className="checkout-label">{content.checkout_number_label}<input className="text-input" required maxLength={30} autoComplete="address-line2" value={address.number} onChange={e=>setAddress({...address,number:e.target.value})}/></label>
        </div>
        <label className="checkout-label">{content.checkout_complement_label}<input className="text-input" maxLength={120} value={address.complement} onChange={e=>setAddress({...address,complement:e.target.value})}/></label>
      </div>
      {error&&<p className="admin-error" role="alert">{error}</p>}
      <button className="primary-btn w-full" type="submit" disabled={loading}>{loading?content.checkout_loading_button:content.checkout_submit_button}</button>
      <p className="text-xs text-gray-500 mt-4">{content.checkout_shipping_note}</p>
    </form>
  );
}
