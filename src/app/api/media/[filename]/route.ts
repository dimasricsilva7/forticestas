import {NextRequest,NextResponse} from "next/server";
import {readFile} from "node:fs/promises";
import path from "node:path";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const mime:Record<string,string>={jpg:"image/jpeg",png:"image/png",webp:"image/webp",avif:"image/avif",gif:"image/gif"};
export async function GET(_request:NextRequest,{params}:{params:Promise<{filename:string}>}){
 const {filename}=await params;
 if(!/^[0-9a-f-]{36}\.(jpg|png|webp|avif|gif)$/i.test(filename))return new NextResponse("Not found",{status:404});
 const extension=filename.split(".").pop()||"";
 try{
  const directory=path.join(process.env.FORTI_STORAGE_DIR||path.join(process.cwd(),"data"),"uploads");
  const data=await readFile(path.join(directory,filename));
  return new NextResponse(new Uint8Array(data),{headers:{"Content-Type":mime[extension],"Cache-Control":"public, max-age=31536000, immutable","X-Content-Type-Options":"nosniff"}});
 }catch{return new NextResponse("Not found",{status:404});}
}
