import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { dailyMenus, products } from "@/db/schema";
import { ensureDemoData, todayInBrazil } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDemoData();
  const today = todayInBrazil();
  const [catalog, menus] = await Promise.all([
    db.select().from(products).orderBy(products.id),
    db.select().from(dailyMenus).where(eq(dailyMenus.date, today)),
  ]);

  return NextResponse.json(
    { products: catalog, menus: menus.filter((menu) => menu.isPublished) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
