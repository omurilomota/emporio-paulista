import { NextResponse } from "next/server";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { dailyMenus, orders, products } from "@/db/schema";
import { isAdminConfigured, isValidAdminSession } from "@/lib/admin-auth";
import { ensureDemoData, todayInBrazil } from "@/lib/seed";

export const dynamic = "force-dynamic";

const orderStatuses = new Set([
  "received",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);

export async function GET(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Configure ADMIN_PASSWORD com no mínimo 12 caracteres." }, { status: 503 });
  }
  if (!isValidAdminSession(request)) {
    return NextResponse.json({ error: "Entre no painel para continuar." }, { status: 401 });
  }
  await ensureDemoData();
  const [catalog, menus, recentOrders, aggregate] = await Promise.all([
    db.select().from(products).orderBy(products.id),
    db.select().from(dailyMenus).where(eq(dailyMenus.date, todayInBrazil())),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(40),
    db
      .select({
        orderCount: count(),
        revenue: sql<string>`COALESCE(SUM(CASE WHEN ${orders.status} <> 'cancelled' THEN ${orders.total}::numeric ELSE 0 END), 0)::text`,
      })
      .from(orders),
  ]);

  return NextResponse.json(
    {
      products: catalog,
      menus,
      orders: recentOrders,
      stats: {
        orderCount: aggregate[0]?.orderCount ?? 0,
        revenue: Number(aggregate[0]?.revenue ?? 0),
        activeOrders: recentOrders.filter((order) => !["delivered", "cancelled"].includes(order.status)).length,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Configure ADMIN_PASSWORD com no mínimo 12 caracteres." }, { status: 503 });
  }
  if (!isValidAdminSession(request)) {
    return NextResponse.json({ error: "Entre no painel para continuar." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  if (body.action === "menu") {
    const date = typeof body.date === "string" ? body.date : todayInBrazil();
    const shift = body.shift === "jantar" ? "jantar" : body.shift === "almoco" ? "almoco" : "";
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 100) : "";
    const description = typeof body.description === "string" ? body.description.trim().slice(0, 500) : "";
    const rawDishes = Array.isArray(body.dishes)
      ? body.dishes
      : typeof body.dishes === "string"
        ? body.dishes.split("\n")
        : [];
    const dishes = rawDishes
      .filter((dish): dish is string => typeof dish === "string")
      .map((dish) => dish.trim().slice(0, 80))
      .filter(Boolean)
      .slice(0, 20);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !shift || title.length < 3) {
      return NextResponse.json({ error: "Confira data, turno e título do cardápio." }, { status: 400 });
    }

    const [menu] = await db
      .insert(dailyMenus)
      .values({
        date,
        shift,
        title,
        description,
        dishes,
        isPublished: body.isPublished !== false,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [dailyMenus.date, dailyMenus.shift],
        set: {
          title,
          description,
          dishes,
          isPublished: body.isPublished !== false,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({ menu });
  }

  if (body.action === "status") {
    const orderId = Number(body.orderId);
    const status = typeof body.status === "string" ? body.status : "";
    if (!Number.isInteger(orderId) || !orderStatuses.has(status)) {
      return NextResponse.json({ error: "Status de pedido inválido." }, { status: 400 });
    }
    const [updated] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, orderId))
      .returning({ id: orders.id, status: orders.status });
    if (!updated) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    return NextResponse.json({ order: updated });
  }

  if (body.action === "product") {
    const productId = Number(body.productId);
    const changes: { price?: string; available?: boolean } = {};
    if (typeof body.price === "number" && Number.isFinite(body.price)) {
      if (body.price < 1 || body.price > 9999) {
        return NextResponse.json({ error: "O preço deve ficar entre R$ 1 e R$ 9.999." }, { status: 400 });
      }
      changes.price = body.price.toFixed(2);
    }
    if (typeof body.available === "boolean") changes.available = body.available;
    if (!Number.isInteger(productId) || Object.keys(changes).length === 0) {
      return NextResponse.json({ error: "Informe um produto e uma alteração válida." }, { status: 400 });
    }
    const [updated] = await db
      .update(products)
      .set(changes)
      .where(eq(products.id, productId))
      .returning();
    if (!updated) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
    return NextResponse.json({ product: updated });
  }

  return NextResponse.json({ error: "Ação não reconhecida." }, { status: 400 });
}
