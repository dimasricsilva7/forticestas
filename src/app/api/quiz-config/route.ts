import {NextResponse} from "next/server";
import {readLocalStore} from "@/lib/local-store";
import {DEFAULT_HOME_CONTENT} from "@/lib/home-content";
export const dynamic="force-dynamic";
export async function GET(){
 try{const store=await readLocalStore();return NextResponse.json({questions:store.quiz_questions.filter((item)=>item.active).sort((a,b)=>a.position-b.position),content:store.home_content||DEFAULT_HOME_CONTENT});}
 catch{return NextResponse.json({questions:[],content:DEFAULT_HOME_CONTENT});}
}
