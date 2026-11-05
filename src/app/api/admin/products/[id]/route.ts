import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {getAdminContext} from "@/lib/admin-auth";
import {updateLocalStore} from "@/lib/local-store";
export const dynamic="force-dynamic";
const schema=z.object({name:z.string().trim().min(2).max(120),slug:z.string().trim().min(2).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),description:z.string().max(2000).default(""),sku:z.string().trim().max(80).nullable().optional(),price_cents:z.number().int().min(0),stock_quantity:z.number().int().min(0).default(0),weight_grams:z.number().int().min(0).max(100000).default(0),width_cm:z.number().min(0).max(300).default(0),height_cm:z.number().min(0).max(300).default(0),length_cm:z.number().min(0).max(300).default(0),image_url:z.string().max(500).nullable().optional(),active:z.boolean().default(true)});
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const auth=await getAdminContext();if(!auth.ok)return NextResponse.json({error:auth.message},{status:auth.status});
 const {id}=await params,parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Confira os campos do produto."},{status:400});
 try{const product=await updateLocalStore((store)=>{
  const index=store.products.findIndex((item)=>item.id===id);if(index<0)throw new Error("Produto não encontrado.");
  if(store.products.some((item)=>item.id!==id&&item.slug===parsed.data.slug))throw new Error("Já existe um produto com este identificador.");
  store.products[index]={...store.products[index],...parsed.data,sku:parsed.data.sku||null,image_url:parsed.data.image_url||null,updated_at:new Date().toISOString()};return store.products[index];
 });return NextResponse.json({product});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Não foi possível atualizar o produto."},{status:400});}
}
export async function DELETE(_request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const auth=await getAdminContext();if(!auth.ok)return NextResponse.json({error:auth.message},{status:auth.status});const {id}=await params;
 try{await updateLocalStore((store)=>{
  if(store.baskets.some((basket)=>basket.basket_items.some((item)=>item.product_id===id)))throw new Error("Este produto está na composição de uma cesta. Remova-o antes de excluir.");
  store.products=store.products.filter((item)=>item.id!==id);
 });return NextResponse.json({success:true});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Não foi possível excluir o produto."},{status:400});}
}
