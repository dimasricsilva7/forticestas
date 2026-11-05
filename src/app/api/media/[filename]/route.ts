import {NextRequest,NextResponse} from "next/server";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {get as getBlob} from "@vercel/blob";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const mime:Record<string,string>={jpg:"image/jpeg",png:"image/png",webp:"image/webp",avif:"image/avif",gif:"image/gif"};
export async function GET(_request:NextRequest,{params}:{params:Promise<{filename:string}>}){
 const {filename}=await params;
 if(!/^[0-9a-f-]{36}\.(jpg|png|webp|avif|gif)$/i.test(filename))return new NextResponse("Not found",{status:404});
 const extension=filename.split(".").pop()||"";
 try{
  if(process.env.VERCEL==="1"||process.env.VERCEL==="true"){
   if(!process.env.BLOB_READ_WRITE_TOKEN)return new NextResponse("Image storage is not configured",{status:503});
   const result=await getBlob("media/"+filename,{access:"private",useCache:false});
   if(!result||result.statusCode!==200)return new NextResponse("Not found",{status:404});
   return new NextResponse(result.stream,{headers:{
    "Content-Type":result.blob.contentType||mime[extension],
    "Cache-Control":"public, max-age=31536000, immutable",
    "X-Content-Type-Options":"nosniff"
   }});
  }
  const directory=path.join(process.env.FORTI_STORAGE_DIR||path.join(process.cwd(),"data"),"uploads");
  const data=await readFile(path.join(directory,filename));
  return new NextResponse(new Uint8Array(data),{headers:{
   "Content-Type":mime[extension],
   "Cache-Control":"public, max-age=31536000, immutable",
   "X-Content-Type-Options":"nosniff"
  }});
 }catch{return new NextResponse("Not found",{status:404});}
}
