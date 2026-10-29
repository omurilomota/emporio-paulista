import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders, products, type OrderItemSnapshot } from "@/db/schema";
import { MARMITEX_PROTEINS, MARMITEX_SIDES } from "@/lib/menu-options";
import { ensureDemoData } from "@/lib/seed";

export const dynamic = "force-dynamic";

const allowedProteins = new Set<string>(MARMITEX_PROTEINS);
const allowedSides = new Set<string>(MARMITEX_SIDES);
const allowedPaymentMethods = new Set(["pix", "cash", "card"]);

export async function POST(request: Request) {
  await ensureDemoData();

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Não foi possível ler o pedido." }, { status: 400 });
  }

  const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
  const customerPhone = typeof body.customerPhone === "string" ? body.customerPhone.trim() : "";
  const phoneDigits = customerPhone.replace(/\D/g, "");
  const fulfillment = body.fulfillment === "pickup" ? "pickup" : body.fulfillment === "delivery" ? "delivery" : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod : "";
  const privacyConsent = body.privacyConsent === true;
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 400) : "";
  const rawItems = Array.isArray(body.items) ? body.items : [];

  if (customerName.length < 2) {
    return NextResponse.json({ error: "Informe seu nome para continuar." }, { status: 400 });
  }
  if (phoneDigits.length < 10 || phoneDigits.length > 13) {
    return NextResponse.json({ error: "Informe um telefone válido com DDD." }, { status: 400 });
  }
  if (!fulfillment || (fulfillment === "delivery" && address.length < 6)) {
    return NextResponse.json({ error: "Confira os dados de entrega ou retirada." }, { status: 400 });
  }
  if (!allowedPaymentMethods.has(paymentMethod)) {
    return NextResponse.json({ error: "Escolha uma forma de pagamento válida." }, { status: 400 });
  }
  if (!privacyConsent) {
    return NextResponse.json({ error: "Autorize o uso dos dados necessários para este pedido." }, { status: 400 });
  }
  if (rawItems.length === 0 || rawItems.length > 30) {
    return NextResponse.json({ error: "Sua sacola está vazia ou tem itens demais." }, { status: 400 });
  }

  const normalizedItems = rawItems.map((item) => {
    const candidate = item as Record<string, unknown>;
    return {
      productId: Number(candidate.productId),
      quantity: Number(candidate.quantity),
      customizations: candidate.customizations as { protein?: unknown; sides?: unknown } | undefined,
    };
  });

  if (
    normalizedItems.some(
      (item) =>
        !Number.isInteger(item.productId) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 20,
    )
  ) {
    return NextResponse.json({ error: "Confira as quantidades da sua sacola." }, { status: 400 });
  }

  const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
  const foundProducts = await db.select().from(products).where(inArray(products.id, productIds));
  const productById = new Map(foundProducts.map((product) => [product.id, product]));

  if (productById.size !== productIds.length || foundProducts.some((product) => !product.available)) {
    return NextResponse.json({ error: "Um item ficou indisponível. Atualize a sacola." }, { status: 409 });
  }

  const snapshots: OrderItemSnapshot[] = [];
  let subtotalCents = 0;

  for (const item of normalizedItems) {
    const product = productById.get(item.productId);
    if (!product) continue;

    const unitPrice = Number(product.price);
    const customizations = item.customizations;
    let normalizedCustomizations: OrderItemSnapshot["customizations"];

    if (product.category === "Marmitas") {
      const protein = typeof customizations?.protein === "string" ? customizations.protein : "";
      const sides = Array.isArray(customizations?.sides) ? customizations.sides : [];
      if (
        !allowedProteins.has(protein) ||
        sides.length !== 2 ||
        sides.some((side) => typeof side !== "string" || !allowedSides.has(side)) ||
        new Set(sides).size !== 2
      ) {
        return NextResponse.json(
          { error: `Escolha uma carne e duas guarnições para ${product.name}.` },
          { status: 400 },
        );
      }
      normalizedCustomizations = { protein, sides: sides as string[] };
    }

    subtotalCents += Math.round(unitPrice * 100) * item.quantity;
    snapshots.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPrice,
      ...(normalizedCustomizations ? { customizations: normalizedCustomizations } : {}),
    });
  }

  // The restaurant advertises delivery with no fee ("🚫 Taxa de Entrega" on its official profile).
  const deliveryFeeCents = 0;
  const totalCents = subtotalCents + deliveryFeeCents;
  const orderNumber = `EP-${randomBytes(3).toString("hex").toUpperCase()}`;
  const [created] = await db
    .insert(orders)
    .values({
      orderNumber,
      customerName,
      customerPhone,
      fulfillment,
      address: fulfillment === "delivery" ? address : null,
      paymentMethod,
      privacyConsent: true,
      privacyConsentAt: new Date(),
      notes,
      items: snapshots,
      subtotal: (subtotalCents / 100).toFixed(2),
      deliveryFee: (deliveryFeeCents / 100).toFixed(2),
      total: (totalCents / 100).toFixed(2),
      status: "received",
    })
    .returning({ orderNumber: orders.orderNumber, status: orders.status, total: orders.total });

  return NextResponse.json({ ...created, fulfillment, deliveryFee: deliveryFeeCents / 100 }, { status: 201 });
}
