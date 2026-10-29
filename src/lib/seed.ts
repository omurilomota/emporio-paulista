import { db } from "@/db";
import { dailyMenus, products } from "@/db/schema";

export function todayInBrazil() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

// Reference catalog. Prices must be confirmed by the restaurant and can be edited in /admin.
const initialProducts = [
  {
    name: "Marmitex P",
    description: "Arroz e feijão, 1 carne e 2 guarnições. Embalagem redonda.",
    category: "Marmitas",
    price: "22.00",
    imageUrl: "/images/products/marmitex.jpg",
  },
  {
    name: "Marmitex M",
    description: "Arroz e feijão, 1 carne e 2 guarnições. Tamanho médio.",
    category: "Marmitas",
    price: "26.00",
    imageUrl: "/images/products/marmitex.jpg",
  },
  {
    name: "Marmitex G",
    description: "Arroz e feijão, 1 carne e 2 guarnições. Tamanho grande.",
    category: "Marmitas",
    price: "32.00",
    imageUrl: "/images/products/marmitex.jpg",
  },
  {
    name: "Filé de frango grelhado",
    description: "Arroz, feijão, batata frita e salada.",
    category: "Executivos",
    price: "24.90",
    imageUrl: "/images/products/file-frango.jpg",
  },
  {
    name: "Prato do dia",
    description: "Arroz, feijão ou feijoada, farofa e a carne do dia.",
    category: "Executivos",
    price: "27.90",
    imageUrl: "/images/products/prato-do-dia.jpg",
  },
  {
    name: "Porção de batata frita",
    description: "Batata frita sequinha, porção para dividir.",
    category: "Porções",
    price: "28.00",
    imageUrl: "/images/products/fritas.jpg",
  },
  {
    name: "Linguiça toscana acebolada",
    description: "Feita na chapa com cebola e pimentão.",
    category: "Porções",
    price: "34.00",
    imageUrl: "/images/products/linguica.jpg",
  },
  {
    name: "Coxinha de frango",
    description: "Massa de batata e recheio de frango temperado.",
    category: "Salgados",
    price: "8.00",
    imageUrl: "/images/products/coxinha.jpg",
  },
  {
    name: "Refrigerante lata 350 ml",
    description: "Coca-Cola, Guaraná e outros sabores. Informe o sabor nas observações.",
    category: "Bebidas",
    price: "6.00",
    imageUrl: "/images/products/refrigerante.jpg",
  },
];

let productsReady = false;
let menuReadyFor = "";
let pending: Promise<void> | null = null;

async function seed(today: string) {
  if (!productsReady) {
    const existingProducts = await db.select({ id: products.id }).from(products).limit(1);
    if (existingProducts.length === 0) {
      await db.insert(products).values(initialProducts);
    }
    productsReady = true;
  }

  if (menuReadyFor !== today) {
    await db
      .insert(dailyMenus)
      .values([
        {
          date: today,
          shift: "almoco",
          title: "Hoje no almoço",
          description: "Self-service por quilo, marmitex e pratos executivos.",
          dishes: [
            "Arroz branco",
            "Feijão carioca",
            "Feijoada",
            "Frango assado",
            "Bisteca de porco",
            "Bife acebolado",
            "Carne ao molho madeira",
            "Farofa",
            "Couve refogada",
            "Macarrão ao sugo",
            "Salada",
          ],
          isPublished: true,
        },
        {
          date: today,
          shift: "jantar",
          title: "Hoje no jantar",
          description: "Pratos executivos, porções e salgados, de segunda a sexta.",
          dishes: [
            "Filé de frango grelhado",
            "Prato do dia",
            "Porção de batata frita",
            "Linguiça toscana acebolada",
            "Coxinha de frango",
          ],
          isPublished: true,
        },
      ])
      .onConflictDoNothing({ target: [dailyMenus.date, dailyMenus.shift] });
    menuReadyFor = today;
  }
}

/** Seeds the demo catalog once per server process and today's menus once per day. */
export async function ensureDemoData() {
  const today = todayInBrazil();
  if (productsReady && menuReadyFor === today) return;
  if (!pending) {
    pending = seed(today).finally(() => {
      pending = null;
    });
  }
  await pending;
}
