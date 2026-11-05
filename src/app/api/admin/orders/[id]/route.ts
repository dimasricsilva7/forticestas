import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {getAdminContext} from "@/lib/admin-auth";
import {updateLocalStore} from "@/lib/local-store";
export const dynamic="force-dynamic";
const schema=z.object({fulfillment_status:z.enum(["pending","processing","shipped","delivered","cancelled"])});
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const auth=await getAdminContext();if(!auth.ok)return NextResponse.json({error:auth.message},{status:auth.status});
 const {id}=await params,parsed=schema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Status de entrega inválido."},{status:400});
 try{const order=await updateLocalStore((store)=>{const item=store.orders.find((entry)=>entry.id===id);if(!item)throw new Error("Pedido não encontrado.");item.fulfillment_status=parsed.data.fulfillment_status;item.updated_at=new Date().toISOString();return item;});return NextResponse.json({order});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Não foi possível atualizar o pedido."},{status:400});}
}
