import { eq } from "drizzle-orm";
import { db } from "@/db";
import { dailyMenus, products } from "@/db/schema";
import { ensureDemoData, todayInBrazil } from "@/lib/seed";
import type { MenuCard, ProductCard } from "@/lib/types";
import Storefront from "@/components/storefront";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureDemoData();
  const today = todayInBrazil();
  const [catalog, menus] = await Promise.all([
    db.select().from(products).orderBy(products.id),
    db.select().from(dailyMenus).where(eq(dailyMenus.date, today)),
  ]);

  const initialProducts: ProductCard[] = catalog.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    price: Number(product.price),
    imageUrl: product.imageUrl,
    available: product.available,
  }));
  const initialMenus: MenuCard[] = menus
    .filter((menu) => menu.isPublished)
    .map((menu) => ({
      id: menu.id,
      date: menu.date,
      shift: menu.shift,
      title: menu.title,
      description: menu.description,
      dishes: menu.dishes,
      isPublished: menu.isPublished,
    }));

  return <Storefront initialProducts={initialProducts} initialMenus={initialMenus} />;
}
