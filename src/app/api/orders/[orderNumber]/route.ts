import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";

type RouteContext = { params: Promise<{ orderNumber: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { orderNumber } = await params;
  const [order] = await db
    .select({
      orderNumber: orders.orderNumber,
      status: orders.status,
      createdAt: orders.createdAt,
      total: orders.total,
      fulfillment: orders.fulfillment,
    })
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber.toUpperCase()))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  return NextResponse.json(order, { headers: { "Cache-Control": "no-store" } });
}
