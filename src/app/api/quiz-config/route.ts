import {NextResponse} from "next/server";
import {readLocalStore} from "@/lib/local-store";
export const dynamic="force-dynamic";
export async function GET(){
 try{const store=await readLocalStore();return NextResponse.json({questions:store.quiz_questions.filter((item)=>item.active).sort((a,b)=>a.position-b.position)});}
 catch{return NextResponse.json({questions:[]});}
}
