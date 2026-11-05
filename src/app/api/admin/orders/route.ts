import {NextResponse} from "next/server";
import {getAdminContext} from "@/lib/admin-auth";
import {readLocalStore} from "@/lib/local-store";
export const dynamic="force-dynamic";
export async function GET(){
 const auth=await getAdminContext();if(!auth.ok)return NextResponse.json({error:auth.message},{status:auth.status});
 const store=await readLocalStore();return NextResponse.json({orders:[...store.orders].sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,100)});
}
