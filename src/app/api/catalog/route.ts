import {NextResponse} from "next/server";
import {createPublicSupabase} from "@/lib/supabase/server";
import {STARTER_BASKETS} from "@/lib/catalog";

export const revalidate=60;

function starterResponse(configured:boolean){
 return {configured,usingStarterCatalog:true,baskets:STARTER_BASKETS.filter((basket)=>basket.active).map((basket)=>({
  id:basket.id,name:basket.name,slug:basket.slug,description:basket.description,
  price_cents:basket.price_cents,position:basket.position,category:basket.category,
  supported_households:basket.supported_households,food_tags:basket.food_tags,
  active:basket.active,image_url:basket.image_url,item_count:basket.items.length,items:basket.items
 })),products:[]};
}

export async function GET(){
 const db=createPublicSupabase();
 if(!db)return NextResponse.json(starterResponse(false));
 const {data,error}=await db.from("baskets")
  .select("id,name,slug,description,price_cents,position,category,supported_households,food_tags,image_url,active,basket_items(quantity)")
  .eq("active",true).order("position",{ascending:true});
 if(error||!data?.length)return NextResponse.json(starterResponse(true));
 const baskets=data.map((basket)=>{
  const fallback=STARTER_BASKETS.find((item)=>item.slug===basket.slug);
  return {...basket,image_url:basket.image_url||fallback?.image_url||"/images/hero.svg",item_count:fallback?.items.length||basket.basket_items?.length||0,items:fallback?.items||[]};
 });
 return NextResponse.json({configured:true,usingStarterCatalog:false,baskets,products:[]});
}
