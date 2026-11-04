import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {getAdminContext} from "@/lib/admin-auth";
import {updateLocalStore,type LocalBasket} from "@/lib/local-store";
export const dynamic="force-dynamic";
const schema=z.object({name:z.string().trim().min(2).max(120),slug:z.string().trim().min(2).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),description:z.string().max(2000).default(""),price_cents:z.number().int().min(500),category:z.enum(["basic","economic","traditional","complete"]).default("traditional"),supported_households:z.array(z.string().trim().min(1).max(80)).default([]),food_tags:z.array(z.string().trim().min(1).max(100)).default([]),active:z.boolean().default(true),position:z.number().int().default(0),image_url:z.string().max(500).nullable().optional(),items:z.array(z.object({product_id:z.string().min(1),quantity:z.number().int().min(1).max(999)})).default([])});
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const auth=await getAdminContext();if(!auth.ok)return NextResponse.json({error:auth.message},{status:auth.status});const {id}=await params;
 const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Confira os campos e a composição da cesta."},{status:400});
 try{const basket=await updateLocalStore((store)=>{
  const index=store.baskets.findIndex((item)=>item.id===id);if(index<0)throw new Error("Cesta não encontrada.");
  if(store.baskets.some((item)=>item.id!==id&&item.slug===parsed.data.slug))throw new Error("Já existe uma cesta com este identificador.");
  const {items,...fields}=parsed.data;for(const item of items)if(!store.products.some((p)=>p.id===item.product_id&&p.active))throw new Error("A composição contém um produto inexistente ou inativo.");
  store.baskets[index]={...store.baskets[index],...fields,image_url:fields.image_url||null,basket_items:items,updated_at:new Date().toISOString()};
  const saved=store.baskets[index] as LocalBasket;return {...saved,basket_items:saved.basket_items.map((item)=>({product_id:item.product_id,quantity:item.quantity,products:store.products.find((p)=>p.id===item.product_id)||null}))};
 });return NextResponse.json({basket});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Não foi possível atualizar a cesta."},{status:400});}
}
export async function DELETE(_request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const auth=await getAdminContext();if(!auth.ok)return NextResponse.json({error:auth.message},{status:auth.status});const {id}=await params;
 try{await updateLocalStore((store)=>{const basket=store.baskets.find((item)=>item.id===id);if(!basket)throw new Error("Cesta não encontrada.");basket.active=false;basket.updated_at=new Date().toISOString();});return NextResponse.json({success:true});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Não foi possível ocultar a cesta."},{status:400});}
}
