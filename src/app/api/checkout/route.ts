import {NextRequest,NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {z} from "zod";
import {createBravoPayPixCharge} from "@/lib/integrations/bravopay";
import {readLocalStore,updateLocalStore,type LocalOrder} from "@/lib/local-store";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const schema=z.object({
 basketSlug:z.string().min(2).max(140),
 customer:z.object({name:z.string().trim().min(2).max(120),email:z.string().trim().email().max(180).optional().or(z.literal("")),phone:z.string().trim().min(10).max(30)}),
 cep:z.string().transform((value)=>value.replace(/\D/g,"")).refine((value)=>/^\d{8}$/.test(value),"CEP inválido."),
 number:z.string().trim().min(1).max(30),complement:z.string().trim().max(120).optional().default("")
});
function error(message:string,status:number){return NextResponse.json({error:message},{status});}

export async function POST(request:NextRequest){
 const key=request.headers.get("Idempotency-Key")||"";
 if(!z.string().uuid().safeParse(key).success)return error("Chave de pedido inválida. Atualize a página e tente novamente.",400);
 const parsed=schema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Confira os dados do comprador, CEP e endereço.",details:parsed.error.flatten()},{status:400});

 let order:LocalOrder|undefined;
 try{
  const store=await readLocalStore();
  const existing=store.orders.find((item)=>item.idempotency_key===key);
  if(existing)order=existing;
  else{
   const basket=store.baskets.find((item)=>item.slug===parsed.data.basketSlug&&item.active);
   if(!basket)return error("Esta cesta não está disponível.",404);
   if(basket.price_cents<500)return error("O preço desta cesta está inválido para pagamento Pix.",422);

   let addressData:Record<string,unknown>;
   try{
    const response=await fetch("https://viacep.com.br/ws/"+parsed.data.cep+"/json/",{cache:"no-store",signal:AbortSignal.timeout(7000)});
    if(!response.ok)throw new Error("ViaCEP indisponível.");
    addressData=await response.json() as Record<string,unknown>;
    if(addressData.erro)return error("CEP não encontrado.",422);
   }catch{return error("Não foi possível validar o CEP agora. Tente novamente.",503);}

   order=await updateLocalStore((current)=>{
    const duplicate=current.orders.find((item)=>item.idempotency_key===key);
    if(duplicate)return duplicate;
    const now=new Date().toISOString(),id=randomUUID(),subtotal=basket.price_cents;
    const created:LocalOrder={
     id,order_number:current.next_order_number++,idempotency_key:key,
     customer_name:parsed.data.customer.name,customer_email:parsed.data.customer.email||null,customer_phone:parsed.data.customer.phone,
     cep:parsed.data.cep,address:{...addressData,number:parsed.data.number,complement:parsed.data.complement},
     subtotal_cents:subtotal,shipping_cents:0,total_cents:subtotal,shipping_service:"Frete grátis",
     payment_status:"pending",fulfillment_status:"pending",payment_reference:null,payment_payload:null,
     order_items:[{product_name:basket.name,sku:null,quantity:1,line_total_cents:subtotal}],
     created_at:now,updated_at:now,paid_at:null
    };
    current.orders.push(created);return created;
   });
  }
 }catch(caught){return error(caught instanceof Error?caught.message:"Não foi possível salvar o pedido no armazenamento local.",503);}

 if(!order)return error("Não foi possível iniciar o pagamento.",500);
 if(order.payment_status!=="pending")return error("Este pedido não está mais aguardando pagamento.",409);
 if(order.payment_reference&&order.payment_payload?.copy_paste){
  return NextResponse.json({orderNumber:order.order_number,amountCents:order.total_cents,pix:order.payment_payload,shippingCents:0});
 }

 try{
  const charge=await createBravoPayPixCharge({
   orderId:order.id,amountCents:order.total_cents,idempotencyKey:"forticestas-order-"+order.id,
   description:"Pedido #"+order.order_number+" - FortiCestas",
   customer:{name:order.customer_name,email:order.customer_email||undefined,phone:order.customer_phone},
   expiresInSeconds:3600
  });
  const paymentPayload={copy_paste:charge.copyPaste,qr_code:charge.qrCode||null,expires_at:charge.expiresAt};
  const saved=await updateLocalStore((current)=>{
   const item=current.orders.find((candidate)=>candidate.id===order!.id);
   if(!item)throw new Error("Pedido não encontrado no armazenamento local.");
   if(item.payment_reference&&item.payment_payload?.copy_paste)return item;
   item.payment_reference=charge.providerPaymentId;item.payment_payload=paymentPayload;item.updated_at=new Date().toISOString();return item;
  });
  return NextResponse.json({orderNumber:saved.order_number,amountCents:charge.amountCents,shippingCents:0,pix:paymentPayload},{status:201});
 }catch(caught){
  const message=caught instanceof Error?caught.message:"Não foi possível criar a cobrança Pix.";
  return error(message,502);
 }
}
