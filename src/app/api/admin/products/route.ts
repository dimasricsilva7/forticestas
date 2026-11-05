import {NextRequest,NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {z} from "zod";
import {getAdminContext} from "@/lib/admin-auth";
import {readLocalStore,updateLocalStore} from "@/lib/local-store";
export const dynamic="force-dynamic";
const schema=z.object({name:z.string().trim().min(2).max(120),slug:z.string().trim().min(2).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),description:z.string().max(2000).default(""),sku:z.string().trim().max(80).nullable().optional(),price_cents:z.number().int().min(0),stock_quantity:z.number().int().min(0).default(0),weight_grams:z.number().int().min(0).max(100000).default(0),width_cm:z.number().min(0).max(300).default(0),height_cm:z.number().min(0).max(300).default(0),length_cm:z.number().min(0).max(300).default(0),image_url:z.string().max(500).nullable().optional(),active:z.boolean().default(true)});
export async function GET(){const auth=await getAdminContext();if(!auth.ok)return NextResponse.json({error:auth.message},{status:auth.status});const store=await readLocalStore();return NextResponse.json({products:store.products.sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"))});}
export async function POST(request:NextRequest){
 const auth=await getAdminContext();if(!auth.ok)return NextResponse.json({error:auth.message},{status:auth.status});
 const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Confira os campos do produto."},{status:400});
 try{const product=await updateLocalStore((store)=>{
  if(store.products.some((item)=>item.slug===parsed.data.slug))throw new Error("Já existe um produto com este identificador.");
  const now=new Date().toISOString(),item={...parsed.data,id:randomUUID(),sku:parsed.data.sku||null,image_url:parsed.data.image_url||null,created_at:now,updated_at:now};
  store.products.push(item);return item;
 });return NextResponse.json({product},{status:201});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Não foi possível salvar o produto."},{status:500});}
}
