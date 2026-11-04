import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {verifyBravoPayWebhook} from "@/lib/integrations/bravopay";
import {updateLocalStore} from "@/lib/local-store";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const eventSchema=z.object({
 id:z.string().min(1),type:z.string().min(1),created:z.number().optional(),
 data:z.object({id:z.string().min(1),external_reference:z.string().optional(),amount_cents:z.number().int().optional(),currency:z.string().optional(),status:z.string().optional(),paid_at:z.string().optional()}).passthrough()
}).passthrough();

export async function POST(request:NextRequest){
 const rawBody=await request.text();
 const signature=request.headers.get("BravoPay-Signature")||request.headers.get("X-Bravopay-Signature")||"";
 if(!verifyBravoPayWebhook(rawBody,signature))return NextResponse.json({error:"Assinatura do webhook inválida."},{status:401});
 let json:unknown;try{json=JSON.parse(rawBody);}catch{return NextResponse.json({error:"JSON inválido."},{status:400});}
 const parsed=eventSchema.safeParse(json);if(!parsed.success)return NextResponse.json({error:"Formato de evento não reconhecido."},{status:400});
 const event=parsed.data,orderId=event.data.external_reference;
 if(!orderId)return NextResponse.json({error:"Evento sem referência de pedido."},{status:400});
 try{
  const result=await updateLocalStore((store)=>{
   if(store.processed_payment_events.includes(event.id))return "duplicate" as const;
   const order=store.orders.find((item)=>item.id===orderId);if(!order)throw new Error("Pedido associado ao evento não foi encontrado.");
   if(order.payment_reference!==event.data.id)throw new Error("A transação do evento não corresponde à cobrança salva no pedido.");
   if(typeof event.data.amount_cents==="number"&&event.data.amount_cents!==order.total_cents)throw new Error("O valor do webhook não corresponde ao total do pedido.");
   if(event.data.currency&&event.data.currency!=="BRL")throw new Error("Moeda do pagamento diferente de BRL.");
   const now=new Date().toISOString();
   if(event.type==="transaction.paid"){
    if(order.payment_status==="pending"||order.payment_status==="failed"){order.payment_status="paid";order.paid_at=event.data.paid_at||now;order.updated_at=now;}
   }else if(event.type==="transaction.refunded"){
    if(order.payment_status!=="chargeback"){order.payment_status="refunded";order.updated_at=now;}
   }else if(event.type==="transaction.chargeback"){
    order.payment_status="chargeback";order.updated_at=now;
   }else if(event.type==="transaction.expired"||event.type==="transaction.failed"){
    if(order.payment_status==="pending"){order.payment_status="failed";order.updated_at=now;}
   }
   store.processed_payment_events.push(event.id);return "processed" as const;
  });
  return NextResponse.json({received:true,duplicate:result==="duplicate"});
 }catch(caught){return NextResponse.json({error:caught instanceof Error?caught.message:"Erro ao processar o webhook."},{status:503});}
}
