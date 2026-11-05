import {NextRequest,NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {z} from "zod";
import {getAdminContext} from "@/lib/admin-auth";
import {readLocalStore,updateLocalStore,type LocalBasket} from "@/lib/local-store";
export const dynamic="force-dynamic";
const schema=z.object({name:z.string().trim().min(2).max(120),slug:z.string().trim().min(2).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),description:z.string().max(2000).default(""),price_cents:z.number().int().min(500),category:z.enum(["basic","economic","traditional","complete"]).default("traditional"),supported_households:z.array(z.string().trim().min(1).max(80)).default([]),food_tags:z.array(z.string().trim().min(1).max(100)).default([]),active:z.boolean().default(true),position:z.number().int().default(0),image_url:z.string().max(500).nullable().optional(),items:z.array(z.object({product_id:z.string().min(1),quantity:z.number().int().min(1).max(999)})).default([])});
function serialize(basket:LocalBasket,products:Awaited<ReturnType<typeof readLocalStore>>["products"]){return {...basket,basket_items:basket.basket_items.map((item)=>({product_id:item.product_id,quantity:item.quantity,products:products.find((p)=>p.id===item.product_id)||null}))};}
export async function GET(){const auth=await getAdminContext();if(!auth.ok)return NextResponse.json({error:auth.message},{status:auth.status});const store=await readLocalStore();return NextResponse.json({baskets:store.baskets.sort((a,b)=>a.position-b.position).map((basket)=>serialize(basket,store.products))});}
export async function POST(request:NextRequest){
 const auth=await getAdminContext();if(!auth.ok)return NextResponse.json({error:auth.message},{status:auth.status});
 const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Confira os campos e a composição da cesta."},{status:400});
 try{const basket=await updateLocalStore((store)=>{
  if(store.baskets.some((item)=>item.slug===parsed.data.slug))throw new Error("Já existe uma cesta com este identificador.");
  const {items,...fields}=parsed.data;for(const item of items)if(!store.products.some((p)=>p.id===item.product_id&&p.active))throw new Error("A composição contém um produto inexistente ou inativo.");
  const now=new Date().toISOString(),created:LocalBasket={...fields,id:randomUUID(),image_url:fields.image_url||null,basket_items:items,created_at:now,updated_at:now};
  store.baskets.push(created);return serialize(created,store.products);
 });return NextResponse.json({basket},{status:201});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Não foi possível salvar a cesta."},{status:400});}
}
