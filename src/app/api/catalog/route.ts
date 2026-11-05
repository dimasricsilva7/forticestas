import {NextResponse} from "next/server";
import {readLocalStore,publicCatalog} from "@/lib/local-store";
import {DEFAULT_HOME_CONTENT} from "@/lib/home-content";
export const dynamic="force-dynamic";
export async function GET(){
 try{const store=await readLocalStore();return NextResponse.json({configured:true,storage:"local-file",baskets:publicCatalog(store),products:[],content:store.home_content||DEFAULT_HOME_CONTENT});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Não foi possível carregar o catálogo.",content:DEFAULT_HOME_CONTENT},{status:500});}
}
