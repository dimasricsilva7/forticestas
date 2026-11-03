import { NextResponse } from "next/server";
import { createPublicSupabase } from "@/lib/supabase/server";

export const revalidate = 60;

export async function GET() {
  const db = createPublicSupabase();
  if (!db) return NextResponse.json({ configured: false, baskets: [], products: [] });

  const [baskets, products] = await Promise.all([
    db.from("baskets").select("id, name, slug, description, price_cents, position")
      .eq("active", true).order("position", { ascending: true }),
    db.from("products").select("id, name, slug, description, price_cents, image_url")
      .eq("active", true).order("name", { ascending: true }),
  ]);

  if (baskets.error || products.error) {
    return NextResponse.json({ configured: true, baskets: [], products: [], error: "Não foi possível carregar o catálogo." }, { status: 500 });
  }
  return NextResponse.json({ configured: true, baskets: baskets.data || [], products: products.data || [] });
}
