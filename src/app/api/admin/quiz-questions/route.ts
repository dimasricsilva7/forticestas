import {NextRequest,NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {z} from "zod";
import {getAdminContext} from "@/lib/admin-auth";
import {readLocalStore,updateLocalStore} from "@/lib/local-store";
export const dynamic="force-dynamic";
const schema=z.object({question_key:z.string().trim().min(2).max(80).regex(/^[a-z0-9_-]+$/),title:z.string().trim().min(5).max(240),subtitle:z.string().max(600).default(""),options:z.array(z.object({value:z.string().trim().min(1).max(100),description:z.string().trim().max(240).default("")})).min(2).max(20),multi:z.boolean().default(false),required:z.boolean().default(true),position:z.number().int().min(0).max(1000).default(0),active:z.boolean().default(true)});
export async function GET(){const auth=await getAdminContext();if(!auth.ok)return NextResponse.json({error:auth.message},{status:auth.status});const store=await readLocalStore();return NextResponse.json({questions:store.quiz_questions.sort((a,b)=>a.position-b.position)});}
export async function POST(request:NextRequest){
 const auth=await getAdminContext();if(!auth.ok)return NextResponse.json({error:auth.message},{status:auth.status});
 const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Confira a pergunta e as opções."},{status:400});
 try{const question=await updateLocalStore((store)=>{if(store.quiz_questions.some((item)=>item.question_key===parsed.data.question_key))throw new Error("Esta chave de pergunta já existe.");const created={...parsed.data,id:randomUUID()};store.quiz_questions.push(created);return created;});return NextResponse.json({question},{status:201});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Não foi possível salvar a pergunta."},{status:400});}
}
