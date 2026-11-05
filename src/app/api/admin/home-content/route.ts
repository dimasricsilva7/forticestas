import {NextRequest,NextResponse} from "next/server";
import {getAdminContext} from "@/lib/admin-auth";
import {readLocalStore,updateLocalStore} from "@/lib/local-store";
import {DEFAULT_HOME_CONTENT} from "@/lib/home-content";
export const dynamic="force-dynamic";

export async function GET(){
 const auth=await getAdminContext();
 if(!auth.ok)return NextResponse.json({error:auth.message},{status:auth.status});
 const store=await readLocalStore();
 return NextResponse.json({content:store.home_content||DEFAULT_HOME_CONTENT});
}

export async function PUT(request:NextRequest){
 const auth=await getAdminContext();
 if(!auth.ok)return NextResponse.json({error:auth.message},{status:auth.status});
 const body=await request.json().catch(()=>null);
 if(!body||typeof body!=="object"||Array.isArray(body))return NextResponse.json({error:"Conteúdo inválido."},{status:400});
 const content={...DEFAULT_HOME_CONTENT};
 for(const key of Object.keys(DEFAULT_HOME_CONTENT) as (keyof typeof DEFAULT_HOME_CONTENT)[]){
  const value=(body as Record<string,unknown>)[key];
  if(typeof value!=="string"||value.length>2000)return NextResponse.json({error:"Confira os campos do conteúdo. Cada campo deve ser texto com até 2.000 caracteres."},{status:400});
  content[key]=value;
 }
 const imageKeys=["logo_url","hero_image_url"] as const;
 for(const key of imageKeys){
  const value=content[key].trim();
  if(value&&!(value.startsWith("/")&&!value.startsWith("//"))&&!/^https:\/\//i.test(value))return NextResponse.json({error:"As imagens precisam usar um caminho local ou uma URL HTTPS."},{status:400});
 }
 const linkKeys=["header_button_url","hero_primary_url","hero_secondary_url","quiz_banner_button_url"] as const;
 for(const key of linkKeys){
  const value=content[key].trim();
  if(value&&!(value.startsWith("/")&&!value.startsWith("//"))&&!/^https:\/\//i.test(value)&&!/^mailto:/i.test(value)&&!/^tel:/i.test(value))return NextResponse.json({error:"Os links dos botões devem ser internos, HTTPS, e-mail ou telefone."},{status:400});
 }
 try{
  const saved=await updateLocalStore(store=>{store.home_content=content;return store.home_content;});
  return NextResponse.json({content:saved});
 }catch(error){
  return NextResponse.json({error:error instanceof Error?error.message:"Não foi possível salvar o conteúdo."},{status:500});
 }
}
