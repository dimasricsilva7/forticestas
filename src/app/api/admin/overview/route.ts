import {NextResponse} from "next/server";
import {getAdminContext} from "@/lib/admin-auth";
import {readLocalStore} from "@/lib/local-store";
export const dynamic="force-dynamic";
export async function GET(){
 const auth=await getAdminContext();if(!auth.ok)return NextResponse.json({error:auth.message},{status:auth.status});
 const store=await readLocalStore(),paid=store.orders.filter((order)=>order.payment_status==="paid");
 return NextResponse.json({products:store.products.length,baskets:store.baskets.length,orders:store.orders.length,paidRevenueCents:paid.reduce((sum,order)=>sum+order.total_cents,0),paidOrders:paid.length});
}
