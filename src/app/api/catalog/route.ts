import {NextResponse} from "next/server";
import {readLocalStore,publicCatalog} from "@/lib/local-store";
export const dynamic="force-dynamic";
export async function GET(){
 try{const store=await readLocalStore();return NextResponse.json({configured:true,storage:"local-file",baskets:publicCatalog(store),products:[]});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Não foi possível carregar o catálogo."},{status:500});}
}
