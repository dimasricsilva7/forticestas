import {NextRequest,NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import {getAdminContext} from "@/lib/admin-auth";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const types:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/avif":"avif","image/gif":"gif"};
export async function POST(request:NextRequest){
 const auth=await getAdminContext();
 if(!auth.ok)return NextResponse.json({error:auth.message},{status:auth.status});
 try{
  const form=await request.formData(),file=form.get("file");
  if(!(file instanceof File))return NextResponse.json({error:"Selecione um arquivo de imagem."},{status:400});
  const extension=types[file.type];
  if(!extension)return NextResponse.json({error:"Formato não permitido. Use JPG, PNG, WEBP, AVIF ou GIF."},{status:415});
  if(file.size<1||file.size>8*1024*1024)return NextResponse.json({error:"A imagem deve ter no máximo 8 MB."},{status:413});
  const filename=randomUUID()+"."+extension;
  const directory=path.join(process.env.FORTI_STORAGE_DIR||path.join(process.cwd(),"data"),"uploads");
  await mkdir(directory,{recursive:true});
  await writeFile(path.join(directory,filename),Buffer.from(await file.arrayBuffer()),{flag:"wx",mode:0o644});
  return NextResponse.json({url:"/api/media/"+filename});
 }catch(error){
  return NextResponse.json({error:error instanceof Error?error.message:"Não foi possível enviar a imagem."},{status:500});
 }
}
