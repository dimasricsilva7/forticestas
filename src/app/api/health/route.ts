import {NextResponse} from "next/server";
import {initializeLocalStore} from "@/lib/local-store";

export const dynamic="force-dynamic";

export async function GET(){
 try{
  await initializeLocalStore();
  return NextResponse.json({ok:true,service:"forticestas",storage:process.env.VERCEL==="1"?"vercel-blob":"local-file"},{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  return NextResponse.json({ok:false,service:"forticestas",error:error instanceof Error?error.message:"Storage initialization failed"},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
