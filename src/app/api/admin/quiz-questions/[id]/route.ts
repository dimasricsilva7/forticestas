import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {getAdminContext} from "@/lib/admin-auth";
import {updateLocalStore} from "@/lib/local-store";
export const dynamic="force-dynamic";
const schema=z.object({question_key:z.string().trim().min(2).max(80).regex(/^[a-z0-9_-]+$/),title:z.string().trim().min(5).max(240),subtitle:z.string().max(600).default(""),options:z.array(z.object({value:z.string().trim().min(1).max(100),description:z.string().trim().max(240).default("")})).min(2).max(20),multi:z.boolean().default(false),required:z.boolean().default(true),position:z.number().int().min(0).max(1000).default(0),active:z.boolean().default(true)});
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const auth=await getAdminContext();if(!auth.ok)return NextResponse.json({error:auth.message},{status:auth.status});const {id}=await params;
 const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Confira a pergunta e as opções."},{status:400});
 try{const question=await updateLocalStore((store)=>{const index=store.quiz_questions.findIndex((item)=>item.id===id);if(index<0)throw new Error("Pergunta não encontrada.");if(store.quiz_questions.some((item)=>item.id!==id&&item.question_key===parsed.data.question_key))throw new Error("Esta chave já existe.");store.quiz_questions[index]={...parsed.data,id};return store.quiz_questions[index];});return NextResponse.json({question});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Não foi possível atualizar a pergunta."},{status:400});}
}
export async function DELETE(_request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const auth=await getAdminContext();if(!auth.ok)return NextResponse.json({error:auth.message},{status:auth.status});const {id}=await params;
 try{await updateLocalStore((store)=>{store.quiz_questions=store.quiz_questions.filter((item)=>item.id!==id);});return NextResponse.json({success:true});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Não foi possível excluir."},{status:400});}
}
