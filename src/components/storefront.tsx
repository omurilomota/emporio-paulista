"use client";

import Image from "next/image";
import {
  ArrowLeft,
  AtSign,
  Banknote,
  Bike,
  Building2,
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  MapPin,
  MessageCircle,
  Minus,
  Moon,
  Phone,
  Plus,
  QrCode,
  ShoppingBag,
  Store,
  Sun,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LogoMark, LogoSeal, LogoWordmark } from "@/components/logo";
import {
  MARMITEX_BASE,
  MARMITEX_PROTEINS,
  MARMITEX_SIDES,
} from "@/lib/menu-options";
import type { CartLine, MenuCard, ProductCard } from "@/lib/types";

type StorefrontProps = { initialProducts: ProductCard[]; initialMenus: MenuCard[] };
type Shift = "almoco" | "jantar";
type CreatedOrder = { orderNumber: string; status: string; total: string; fulfillment: string };
type OpenStatus = { open: boolean; title: string; detail: string };

const WHATSAPP = "5518999990102";
const WHATSAPP_LABEL = "(18) 99999-0102";
const LANDLINE = "+551800000102";
const LANDLINE_LABEL = "(18) 0000-0102";
const INSTAGRAM_URL = "https://www.instagram.com/";
const ADDRESS_QUERY = "Rua das Acácias, 120, Junqueirópolis - SP";
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS_QUERY)}`;
const MAP_EMBED = `https://maps.google.com/maps?q=${encodeURIComponent(ADDRESS_QUERY)}&z=16&output=embed`;
const CART_KEY = "emporio-cart-v2";

const CATEGORY_ORDER = ["Executivos", "Porções", "Salgados", "Bebidas"];
const CATEGORY_INFO: Record<string, { slug: string; label: string; note: string }> = {
  Marmitas: { slug: "marmitex", label: "Marmitex", note: "Arroz e feijão + 1 carne + 2 guarnições, montada na hora." },
  Executivos: { slug: "executivos", label: "Pratos executivos", note: "Prato completo, no almoço e no jantar." },
  "Porções": { slug: "porcoes", label: "Porções", note: "Para dividir na mesa ou em casa." },
  Salgados: { slug: "salgados", label: "Salgados", note: "Fritos na hora." },
  Bebidas: { slug: "bebidas", label: "Bebidas", note: "Sempre geladas." },
};
const FALLBACK_IMAGE: Record<string, string> = {
  Marmitas: "/images/products/marmitex.jpg",
  Executivos: "/images/products/file-frango.jpg",
  "Porções": "/images/products/fritas.jpg",
  Salgados: "/images/products/coxinha.jpg",
  Bebidas: "/images/products/refrigerante.jpg",
};
const IMAGE_FOCUS: Record<string, string> = { "/images/products/coxinha.jpg": "72% 50%" };
const PAYMENT_LABEL: Record<string, string> = { pix: "Pix", card: "Cartão (maquininha)", cash: "Dinheiro" };
const STATUS_STEPS = [
  { key: "received", label: "Recebido" },
  { key: "preparing", label: "Em preparo" },
  { key: "out_for_delivery", label: "A caminho" },
  { key: "delivered", label: "Entregue" },
];
const STATUS_NAME: Record<string, string> = {
  received: "Pedido recebido pela cozinha",
  preparing: "Seu pedido está sendo preparado",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue. Bom almoço!",
  cancelled: "Pedido cancelado — fale com a gente",
};

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function waLink(text?: string) {
  return `https://wa.me/${WHATSAPP}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

function productImage(product?: Pick<ProductCard, "imageUrl" | "category">) {
  return product?.imageUrl || FALLBACK_IMAGE[product?.category ?? ""] || "/images/products/marmitex.jpg";
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function saoPauloClock() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekday = values.weekday ?? "";
  return {
    minutes: Number(values.hour) * 60 + Number(values.minute),
    isWeekday: ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday),
  };
}

function openingStatus(): OpenStatus {
  const { minutes, isWeekday } = saoPauloClock();
  if (minutes >= 660 && minutes < 840) return { open: true, title: "Aberto", detail: "almoço até 14h" };
  if (isWeekday && minutes >= 1080 && minutes < 1260) return { open: true, title: "Aberto", detail: "jantar até 21h" };
  if (minutes < 660) return { open: false, title: "Fechado", detail: "abre às 11h" };
  if (isWeekday && minutes < 1080) return { open: false, title: "Fechado", detail: "abre às 18h" };
  return { open: false, title: "Fechado", detail: "abre amanhã às 11h" };
}

function defaultShift(): Shift {
  const { minutes, isWeekday } = saoPauloClock();
  return isWeekday && minutes >= 900 ? "jantar" : "almoco";
}

function todayLabel() {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export default function Storefront({ initialProducts, initialMenus }: StorefrontProps) {
  const [products, setProducts] = useState(initialProducts);
  const [menus, setMenus] = useState(initialMenus);
  const [shift, setShift] = useState<Shift>(defaultShift);
  const [status, setStatus] = useState<OpenStatus>(openingStatus);
  const [dateLabel] = useState(todayLabel);
  const [isWeekday] = useState(() => saoPauloClock().isWeekday);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedMarmita, setSelectedMarmita] = useState<ProductCard | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [protein, setProtein] = useState("");
  const [pickedSides, setPickedSides] = useState<string[]>([]);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeSlug, setActiveSlug] = useState("marmitex");
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | "cash">("pix");
  const [notes, setNotes] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [trackedStatus, setTrackedStatus] = useState("received");
  const [whatsappText, setWhatsappText] = useState("");
  const catnavRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const toastId = useRef(0);

  const available = useMemo(() => products.filter((product) => product.available), [products]);
  const marmitas = useMemo(
    () => available.filter((product) => product.category === "Marmitas").sort((a, b) => a.price - b.price),
    [available],
  );
  const groups = useMemo(() => {
    const known = CATEGORY_ORDER.filter((category) => available.some((product) => product.category === category));
    const extras = Array.from(new Set(available.map((product) => product.category))).filter(
      (category) => category !== "Marmitas" && !CATEGORY_ORDER.includes(category),
    );
    return [...known, ...extras].map((category) => ({
      category,
      ...(CATEGORY_INFO[category] ?? { slug: slugify(category), label: category, note: "" }),
      items: available.filter((product) => product.category === category),
    }));
  }, [available]);
  const navSections = useMemo(
    () => [
      ...(marmitas.length > 0 ? [{ slug: "marmitex", label: "Marmitex", count: marmitas.length }] : []),
      ...groups.map((group) => ({ slug: group.slug, label: group.label, count: group.items.length })),
    ],
    [marmitas.length, groups],
  );
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const simpleQuantity = useMemo(() => {
    const quantities = new Map<number, number>();
    for (const line of cart) {
      if (!line.customizations) quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
    }
    return quantities;
  }, [cart]);
  const itemCount = cart.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cart.reduce((total, line) => total + line.unitPrice * line.quantity, 0);
  const menu = menus.find((item) => item.shift === shift);
  const marmitaReady = Boolean(selectedMarmita && protein && pickedSides.length === 2);
  const overlayOpen = cartOpen || Boolean(selectedMarmita) || checkoutOpen || Boolean(createdOrder);

  useEffect(() => {
    const timer = window.setInterval(() => setStatus(openingStatus()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const refreshMenu = async () => {
      try {
        const response = await fetch("/api/menu", { cache: "no-store" });
        if (!response.ok) return;
        const result = (await response.json()) as {
          products: Array<Omit<ProductCard, "price"> & { price: string | number }>;
          menus: MenuCard[];
        };
        if (cancelled) return;
        setProducts(
          result.products.map((product) => ({
            id: product.id,
            name: product.name,
            description: product.description,
            category: product.category,
            price: Number(product.price),
            imageUrl: product.imageUrl ?? null,
            available: product.available,
          })),
        );
        setMenus(result.menus);
      } catch {
        // Keep the server-rendered menu when the refresh fails.
      }
    };
    const timer = window.setInterval(refreshMenu, 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CART_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CartLine[];
        if (Array.isArray(parsed)) setCart(parsed);
      }
    } catch {
      window.localStorage.removeItem(CART_KEY);
    }
    setCartLoaded(true);
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // Storage can be blocked in private mode; the cart still works for this visit.
    }
  }, [cart, cartLoaded]);

  // Keep cart prices and names in sync with the live catalog.
  useEffect(() => {
    if (!cartLoaded) return;
    setCart((current) => {
      let changed = false;
      const next = current.flatMap((line) => {
        const product = productById.get(line.productId);
        if (!product || !product.available) {
          changed = true;
          return [];
        }
        if (product.price !== line.unitPrice || product.name !== line.name) {
          changed = true;
          return [{ ...line, unitPrice: product.price, name: product.name }];
        }
        return [line];
      });
      return changed ? next : current;
    });
  }, [productById, cartLoaded]);

  useEffect(() => {
    if (!createdOrder) return;
    let cancelled = false;
    const refreshStatus = async () => {
      try {
        const response = await fetch(`/api/orders/${createdOrder.orderNumber}`, { cache: "no-store" });
        if (!response.ok) return;
        const result = (await response.json()) as { status: string };
        if (!cancelled) setTrackedStatus(result.status);
      } catch {
        // Keep the last known status.
      }
    };
    const timer = window.setInterval(refreshStatus, 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [createdOrder]);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 4);
        const offset = (window.innerWidth >= 760 ? 68 : 60) + 70;
        const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
        let current = sections[0]?.dataset.section ?? "";
        for (const section of sections) {
          if (section.getBoundingClientRect().top - offset <= 1) current = section.dataset.section ?? current;
        }
        if (current) setActiveSlug(current);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const container = catnavRef.current;
    const chip = container?.querySelector<HTMLElement>(`[data-slug="${activeSlug}"]`);
    if (!container || !chip) return;
    const target = chip.offsetLeft - container.clientWidth / 2 + chip.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeSlug]);

  useEffect(() => {
    document.body.style.overflow = overlayOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [overlayOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (createdOrder) setCreatedOrder(null);
      else if (checkoutOpen) setCheckoutOpen(false);
      else if (selectedMarmita) setSelectedMarmita(null);
      else if (cartOpen) setCartOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [createdOrder, checkoutOpen, selectedMarmita, cartOpen]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  function showToast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToast({ id: ++toastId.current, message });
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }

  function addLine(product: ProductCard, customizations?: { protein: string; sides: string[] }) {
    const cartKey = customizations
      ? `${product.id}-${customizations.protein}-${customizations.sides.join("-")}`
      : `${product.id}`;
    setCart((current) => {
      if (current.some((line) => line.cartKey === cartKey)) {
        return current.map((line) => (line.cartKey === cartKey ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [
        ...current,
        {
          cartKey,
          productId: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity: 1,
          ...(customizations ? { customizations } : {}),
        },
      ];
    });
    showToast(`${product.name} na sacola`);
  }

  function changeQuantity(cartKey: string, delta: number) {
    setCart((current) =>
      current
        .map((line) => (line.cartKey === cartKey ? { ...line, quantity: Math.min(20, line.quantity + delta) } : line))
        .filter((line) => line.quantity > 0),
    );
  }

  function openMarmitaModal(product: ProductCard) {
    setSelectedMarmita(product);
    setProtein("");
    setPickedSides([]);
    setCartOpen(false);
  }

  function toggleSide(side: string) {
    setPickedSides((current) => {
      if (current.includes(side)) return current.filter((item) => item !== side);
      if (current.length >= 2) return current;
      return [...current, side];
    });
  }

  function addMarmita() {
    if (!selectedMarmita || !marmitaReady) return;
    addLine(selectedMarmita, { protein, sides: pickedSides });
    setSelectedMarmita(null);
  }

  function openCheckout() {
    setOrderError("");
    setCartOpen(false);
    setCheckoutOpen(true);
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOrderError("");
    if (customerPhone.replace(/\D/g, "").length < 10) {
      setOrderError("Informe o WhatsApp com DDD, por exemplo (18) 99999-9999.");
      return;
    }
    setSubmitting(true);
    const orderLines = cart.map(
      (line) =>
        `• ${line.quantity}x ${line.name}${
          line.customizations ? ` (${line.customizations.protein}; ${line.customizations.sides.join(" e ")})` : ""
        }`,
    );
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          fulfillment,
          address: fulfillment === "delivery" ? address : "",
          paymentMethod,
          notes,
          privacyConsent: acceptedPrivacy,
          items: cart.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            ...(line.customizations ? { customizations: line.customizations } : {}),
          })),
        }),
      });
      const result = (await response.json()) as CreatedOrder & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível enviar o pedido.");
      setWhatsappText(
        [
          `Olá! Fiz o pedido ${result.orderNumber} pelo site.`,
          ...orderLines,
          `Total: ${money(Number(result.total))}`,
          fulfillment === "delivery" ? `Entrega: ${address}` : "Vou retirar no balcão.",
          `Pagamento: ${PAYMENT_LABEL[paymentMethod]}`,
          notes ? `Obs.: ${notes}` : "",
          `Nome: ${customerName}`,
        ]
          .filter(Boolean)
          .join("\n"),
      );
      setCreatedOrder(result);
      setTrackedStatus(result.status);
      setCart([]);
      setAcceptedPrivacy(false);
      setNotes("");
      setCheckoutOpen(false);
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : "Tente novamente em instantes.");
    } finally {
      setSubmitting(false);
    }
  }

  const sidesLeft = 2 - pickedSides.length;
  const marmitaBtnLabel = !protein
    ? "Escolha a carne"
    : sidesLeft > 0
      ? `Escolha mais ${sidesLeft} guarniç${sidesLeft > 1 ? "ões" : "ão"}`
      : selectedMarmita
        ? `Adicionar à sacola • ${money(selectedMarmita.price)}`
        : "Adicionar à sacola";
  const trackedIndex = STATUS_STEPS.findIndex((step) => step.key === trackedStatus);

  return (
    <div className={`site ${itemCount > 0 ? "has-cartbar" : ""}`}>
      <a className="skip-link" href="#cardapio">
        Pular para o cardápio
      </a>

      <header className={`topbar ${scrolled ? "is-scrolled" : ""}`}>
        <div className="wrap topbar-inner">
          <a className="logo-link" href="#inicio" aria-label="Empório Paulista — voltar ao início">
            <LogoMark size={40} />
            <LogoWordmark />
          </a>
          <nav className="topbar-nav" aria-label="Seções">
            <a href="#hoje">Cardápio do dia</a>
            <a href="#marmitex">Marmitex</a>
            <a href="#cardapio">Cardápio</a>
            <a href="#informacoes">Endereço e horários</a>
          </nav>
          <div className="topbar-actions">
            <span className={`status-chip ${status.open ? "is-open" : "is-closed"}`}>
              <i aria-hidden="true" />
              {status.title}
              <small> · {status.detail}</small>
            </span>
            <a className="topbar-whats" href={waLink()} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${WHATSAPP_LABEL}`}>
              <MessageCircle size={18} />
              <span>{WHATSAPP_LABEL}</span>
            </a>
            <button
              type="button"
              className="topbar-cart"
              onClick={() => setCartOpen(true)}
              aria-label={`Abrir sacola com ${itemCount} ${itemCount === 1 ? "item" : "itens"}`}
            >
              <ShoppingBag size={19} />
              <span className="topbar-cart-total">{itemCount > 0 ? money(subtotal) : "Sacola"}</span>
              <span className="topbar-cart-count">{itemCount}</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="cover" id="inicio" aria-label="Empório Paulista">
          <div className="cover-media">
            <Image
              src="/images/hero-buffet.jpg"
              alt="Mesa com frango assado, saladas, couve, feijão, farofa e bisteca"
              fill
              priority
              sizes="100vw"
            />
          </div>
          <div className="wrap">
            <div className="store-card">
              <div className="store-card-logo">
                <LogoMark size={96} title="Empório Paulista" />
              </div>
              <div className="store-card-body">
                <p className="store-kicker">Comida caseira · Junqueirópolis/SP</p>
                <h1>Empório Paulista</h1>
                <p className="store-desc">
                  Refeições por quilo, self-service e marmitex na Av. Sete de Setembro desde 2014. Peça por aqui e
                  receba <strong>sem taxa de entrega</strong>, ou retire no balcão.
                </p>
                <ul className="store-facts">
                  <li>
                    <Sun size={19} />
                    <span>
                      <strong>Almoço todos os dias</strong>11h às 14h
                    </span>
                  </li>
                  <li>
                    <Moon size={19} />
                    <span>
                      <strong>Jantar de segunda a sexta</strong>18h às 21h
                    </span>
                  </li>
                  <li>
                    <Bike size={19} />
                    <span>
                      <strong>Entrega sem taxa</strong>ou retirada no balcão
                    </span>
                  </li>
                  <li>
                    <QrCode size={19} />
                    <span>
                      <strong>Pix, cartão ou dinheiro</strong>pague na entrega
                    </span>
                  </li>
                </ul>
              </div>
              <div className="store-card-cta">
                <a className="btn btn-red btn-lg" href="#cardapio">
                  <UtensilsCrossed size={19} /> Ver cardápio
                </a>
                <a className="btn btn-outline btn-lg" href="#hoje">
                  Cardápio de hoje
                </a>
                <a className="store-call" href={`tel:${LANDLINE}`}>
                  <Phone size={16} /> Prefere ligar? {LANDLINE_LABEL}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="today" id="hoje" aria-labelledby="today-title">
          <div className="wrap today-grid">
            <div className="board">
              <div className="board-head">
                <div>
                  <span className="board-date">{dateLabel}</span>
                  <h2 id="today-title">Cardápio de hoje</h2>
                </div>
                <div className="segmented" role="tablist" aria-label="Turno">
                  <button type="button" role="tab" aria-selected={shift === "almoco"} onClick={() => setShift("almoco")}>
                    <Sun size={16} /> Almoço
                  </button>
                  <button type="button" role="tab" aria-selected={shift === "jantar"} onClick={() => setShift("jantar")}>
                    <Moon size={16} /> Jantar
                  </button>
                </div>
              </div>
              {menu ? (
                <>
                  <p className="board-title">{menu.title}</p>
                  {menu.description ? <p className="board-desc">{menu.description}</p> : null}
                  <ul className="board-list">
                    {menu.dishes.map((dish, index) => (
                      <li key={`${dish}-${index}`}>{dish}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="board-empty">
                  O cardápio do {shift === "almoco" ? "almoço" : "jantar"} de hoje ainda não foi publicado. Chame no
                  WhatsApp que a gente conta o que tem.
                </p>
              )}
              <div className="board-foot">
                <span>
                  <Clock3 size={15} />
                  {shift === "almoco" ? "Todos os dias, das 11h às 14h" : "Segunda a sexta, das 18h às 21h"}
                </span>
                <a className="btn btn-cream" href="#cardapio">
                  Fazer pedido <ChevronRight size={17} />
                </a>
              </div>
            </div>

            <aside className="selfservice" aria-labelledby="selfservice-title">
              <div className="selfservice-photo">
                <Image
                  src="/images/self-service.jpg"
                  alt="Cuba do buffet com carne e legumes"
                  fill
                  sizes="(max-width: 960px) 100vw, 420px"
                />
              </div>
              <div className="selfservice-body">
                <h3 id="selfservice-title">Self-service por quilo</h3>
                <p>No salão, todos os dias das 11h às 14h. Você monta o prato e paga pelo peso.</p>
                <a
                  className="text-link"
                  href={waLink("Olá! Quero reservar mesa para um grupo no almoço.")}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Users size={17} /> Reservar mesa para grupo <ChevronRight size={16} />
                </a>
              </div>
            </aside>
          </div>
        </section>

        <section className="menu" aria-label="Cardápio completo">
          <div className="catnav">
            <div className="wrap catnav-scroll" ref={catnavRef}>
              {navSections.map((section) => (
                <a
                  key={section.slug}
                  href={`#${section.slug}`}
                  data-slug={section.slug}
                  className={activeSlug === section.slug ? "is-active" : ""}
                  aria-current={activeSlug === section.slug ? "true" : undefined}
                >
                  {section.label}
                  <span>{section.count}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="wrap" id="cardapio">
            {marmitas.length > 0 ? (
              <section className="menu-group" id="marmitex" data-section="marmitex" aria-labelledby="group-marmitex">
                <div className="group-head">
                  <h2 id="group-marmitex">Marmitex</h2>
                  <p>{CATEGORY_INFO.Marmitas.note}</p>
                </div>
                <div className="item-grid">
                  {marmitas.map((product) => {
                    const image = productImage(product);
                    return (
                      <article className="item" key={product.id}>
                        <div className="item-info">
                          <h3>{product.name}</h3>
                          <p>{product.description}</p>
                          <div className="item-foot">
                            <strong className="item-price">{money(product.price)}</strong>
                            <button
                              type="button"
                              className="btn btn-add"
                              onClick={() => openMarmitaModal(product)}
                            >
                              <Plus size={17} /> Escolher
                            </button>
                          </div>
                        </div>
                        <div className="item-photo">
                          <Image
                            src={image}
                            alt={product.name}
                            fill
                            sizes="(max-width: 760px) 112px, 136px"
                            style={{ objectPosition: IMAGE_FOCUS[image] ?? "50% 50%" }}
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {groups.map((group) => (
              <section
                className="menu-group"
                id={group.slug}
                data-section={group.slug}
                key={group.slug}
                aria-labelledby={`group-${group.slug}`}
              >
                <div className="group-head">
                  <h2 id={`group-${group.slug}`}>{group.label}</h2>
                  {group.note ? <p>{group.note}</p> : null}
                </div>
                <div className="item-grid">
                  {group.items.map((product) => {
                    const quantity = simpleQuantity.get(product.id) ?? 0;
                    const image = productImage(product);
                    return (
                      <article className="item" key={product.id}>
                        <div className="item-info">
                          <h3>{product.name}</h3>
                          <p>{product.description}</p>
                          <div className="item-foot">
                            <strong className="item-price">{money(product.price)}</strong>
                            {quantity > 0 ? (
                              <div className="stepper" role="group" aria-label={`Quantidade de ${product.name}`}>
                                <button
                                  type="button"
                                  onClick={() => changeQuantity(`${product.id}`, -1)}
                                  aria-label={`Remover um ${product.name}`}
                                >
                                  <Minus size={16} />
                                </button>
                                <span aria-live="polite">{quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => addLine(product)}
                                  aria-label={`Adicionar mais um ${product.name}`}
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            ) : (
                              <button type="button" className="btn btn-add" onClick={() => addLine(product)}>
                                <Plus size={17} /> Adicionar
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="item-photo">
                          <Image
                            src={image}
                            alt={product.name}
                            fill
                            sizes="(max-width: 760px) 112px, 136px"
                            style={{ objectPosition: IMAGE_FOCUS[image] ?? "50% 50%" }}
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}

            <p className="menu-disclaimer">
              Fotos ilustrativas. Preços e disponibilidade podem mudar ao longo do dia — confirmamos tudo no WhatsApp.
            </p>
          </div>
        </section>

        <section className="wrap b2b" aria-labelledby="b2b-title">
          <div className="b2b-inner">
            <span className="b2b-icon">
              <Building2 size={26} />
            </span>
            <div>
              <h2 id="b2b-title">Almoço para empresas e equipes</h2>
              <p>Marmitex para o pessoal do escritório, da obra ou da loja, entregue no horário combinado.</p>
            </div>
            <a
              className="btn btn-lg btn-white"
              href={waLink("Olá! Quero combinar marmitex para a minha empresa.")}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={18} /> Combinar pelo WhatsApp
            </a>
          </div>
        </section>

        <section className="info" id="informacoes" aria-labelledby="info-title">
          <div className="wrap info-grid">
            <div className="info-map">
              <iframe
                title="Mapa: Empório Paulista, Rua das Acácias, 120, Junqueirópolis"
                src={MAP_EMBED}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="info-card">
              <h2 id="info-title">Endereço e horários</h2>
              <address className="info-address">
                <strong>Rua das Acácias, 120</strong>
                <br />
                Centro — Junqueirópolis/SP
                <br />
                CEP 00000-000
              </address>
              <a className="text-link" href={MAPS_URL} target="_blank" rel="noreferrer">
                <MapPin size={17} /> Abrir no Google Maps <ChevronRight size={16} />
              </a>
              <table className="hours">
                <caption className="sr-only">Horário de funcionamento</caption>
                <tbody>
                  <tr className={isWeekday ? "is-today" : ""}>
                    <th scope="row">Segunda a sexta</th>
                    <td>
                      Almoço 11h–14h
                      <br />
                      Jantar 18h–21h
                    </td>
                  </tr>
                  <tr className={isWeekday ? "" : "is-today"}>
                    <th scope="row">Sábado e domingo</th>
                    <td>Almoço 11h–14h</td>
                  </tr>
                </tbody>
              </table>
              <div className="contact-list">
                <a href={waLink()} target="_blank" rel="noreferrer">
                  <MessageCircle size={20} />
                  <span>
                    WhatsApp {WHATSAPP_LABEL}
                    <small>Pedidos e reservas</small>
                  </span>
                </a>
                <a href={`tel:${LANDLINE}`}>
                  <Phone size={20} />
                  <span>
                    Telefone {LANDLINE_LABEL}
                    <small>Fixo do restaurante</small>
                  </span>
                </a>
              </div>
              <p className="pay-note">Aceitamos Pix, cartão e dinheiro. Entrega sem taxa.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-grid">
          <div className="footer-brand">
            <LogoSeal size={112} />
            <div>
              <LogoWordmark tone="light" />
              <p>Sabor que reúne, tradição que encanta.</p>
            </div>
          </div>
          <div>
            <h3>Peça agora</h3>
            <div className="footer-links">
              <a href={waLink()} target="_blank" rel="noreferrer">
                WhatsApp {WHATSAPP_LABEL}
              </a>
              <a href={`tel:${LANDLINE}`}>Telefone {LANDLINE_LABEL}</a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                <AtSign size={14} /> demonstracao
              </a>
            </div>
          </div>
          <div>
            <h3>Visite</h3>
            <div className="footer-links">
              <span>Rua das Acácias, 120</span>
              <span>Centro</span>
              <span>Junqueirópolis/SP</span>
            </div>
          </div>
          <div>
            <h3>Empório</h3>
            <div className="footer-links">
              <a href="/privacidade">Política de privacidade</a>
              <a href="/admin">Área da equipe</a>
            </div>
          </div>
        </div>
        <div className="wrap footer-legal">
          <span>
            Restaurante Exemplo LTDA · <span className="nowrap">CNPJ 00.000.000/0001-00</span>
          </span>
          <span>© {new Date().getFullYear()} Empório Paulista</span>
          <span className="footer-credit">
            <a
              href="https://wa.me/5518998133524"
              target="_blank"
              rel="noreferrer"
              aria-label="Falar com Murilo Mota no WhatsApp"
            >
              Desenvolvido por Murilo Mota · 55 (18) 99813-3524
            </a>
          </span>
        </div>
      </footer>

      {itemCount > 0 && !overlayOpen ? (
        <button type="button" className="cartbar" onClick={() => setCartOpen(true)}>
          <span className="cartbar-count">{itemCount}</span>
          <span>Ver sacola</span>
          <span className="cartbar-total">{money(subtotal)}</span>
        </button>
      ) : null}

      {toast && !overlayOpen ? (
        <div className="toast" role="status" key={toast.id}>
          <Check size={18} />
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => {
              setToast(null);
              setCartOpen(true);
            }}
          >
            Ver sacola
          </button>
        </div>
      ) : null}

      {selectedMarmita ? (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedMarmita(null);
          }}
        >
          <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="marmita-title">
            <div className="sheet-head">
              <div>
                <h2 id="marmita-title">{selectedMarmita.name}</h2>
                <p className="sheet-sub">Arroz e feijão inclusos · {money(selectedMarmita.price)}</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setSelectedMarmita(null)}
                aria-label="Fechar"
              >
                <X size={19} />
              </button>
            </div>
            <div className="sheet-body">
              <fieldset className="pick">
                <legend>
                  <span>1</span>Escolha a carne
                  <small className={protein ? "is-done" : ""}>{protein ? "Escolhida" : "Obrigatório"}</small>
                </legend>
                <div className="pick-list">
                  {MARMITEX_PROTEINS.map((item) => (
                    <label key={item} className={`pick-option ${protein === item ? "is-on" : ""}`}>
                      <input
                        type="radio"
                        name="marmitex-protein"
                        checked={protein === item}
                        onChange={() => setProtein(item)}
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="pick">
                <legend>
                  <span>2</span>Escolha 2 guarnições
                  <small className={pickedSides.length === 2 ? "is-done" : ""}>
                    {pickedSides.length} de 2
                  </small>
                </legend>
                <div className="pick-list">
                  {MARMITEX_SIDES.map((item) => {
                    const on = pickedSides.includes(item);
                    const blocked = !on && pickedSides.length >= 2;
                    return (
                      <label key={item} className={`pick-option ${on ? "is-on" : ""} ${blocked ? "is-disabled" : ""}`}>
                        <input
                          type="checkbox"
                          checked={on}
                          disabled={blocked}
                          onChange={() => toggleSide(item)}
                        />
                        {item}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>
            <div className="sheet-foot">
              <div>
                <small>{selectedMarmita.name}</small>
                <strong>{money(selectedMarmita.price)}</strong>
              </div>
              <button
                type="button"
                className="btn btn-red btn-lg"
                disabled={!marmitaReady}
                onClick={addMarmita}
              >
                {marmitaBtnLabel}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {cartOpen ? (
        <div
          className="overlay overlay-right"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCartOpen(false);
          }}
        >
          <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <div className="sheet-head">
              <h2 id="cart-title">Sua sacola</h2>
              <button type="button" className="icon-btn" onClick={() => setCartOpen(false)} aria-label="Fechar sacola">
                <X size={19} />
              </button>
            </div>
            {!status.open ? (
              <p className="drawer-alert">
                <Clock3 size={18} />
                <span>
                  Estamos fechados agora ({status.detail}). Você pode enviar o pedido e a gente confirma assim que abrir.
                </span>
              </p>
            ) : null}
            {cart.length === 0 ? (
              <div className="drawer-empty">
                <ShoppingBag size={44} />
                <h3>Sacola vazia</h3>
                <p>Escolha um prato ou marmitex do cardápio para começar.</p>
                <a
                  className="btn btn-red"
                  href="#cardapio"
                  onClick={() => setCartOpen(false)}
                >
                  Ver o cardápio
                </a>
              </div>
            ) : (
              <>
                <ul className="drawer-lines">
                  {cart.map((line) => {
                    const product = productById.get(line.productId);
                    return (
                      <li className="cart-line" key={line.cartKey}>
                        <div className="cart-line-photo">
                          <Image src={productImage(product)} alt="" fill sizes="56px" />
                        </div>
                        <div className="cart-line-info">
                          <strong>{line.name}</strong>
                          {line.customizations ? (
                            <small>
                              {line.customizations.protein} · {line.customizations.sides.join(" + ")}
                            </small>
                          ) : null}
                          <span>{money(line.unitPrice * line.quantity)}</span>
                        </div>
                        <div className="stepper stepper-sm" role="group" aria-label={`Quantidade de ${line.name}`}>
                          <button type="button" onClick={() => changeQuantity(line.cartKey, -1)} aria-label="Diminuir">
                            <Minus size={15} />
                          </button>
                          <span>{line.quantity}</span>
                          <button type="button" onClick={() => changeQuantity(line.cartKey, 1)} aria-label="Aumentar">
                            <Plus size={15} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="drawer-foot">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>{money(subtotal)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Entrega</span>
                    <span className="free">Grátis</span>
                  </div>
                  <div className="summary-total">
                    <span>Total</span>
                    <strong>{money(subtotal)}</strong>
                  </div>
                  <button type="button" className="btn btn-red btn-lg btn-block" onClick={openCheckout}>
                    Continuar
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      ) : null}

      {checkoutOpen ? (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCheckoutOpen(false);
          }}
        >
          <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
            <div className="sheet-head">
              <button
                type="button"
                className="icon-btn"
                onClick={() => {
                  setCheckoutOpen(false);
                  setCartOpen(true);
                }}
                aria-label="Voltar para a sacola"
              >
                <ArrowLeft size={19} />
              </button>
              <h2 id="checkout-title">Finalizar pedido</h2>
              <button type="button" className="icon-btn" onClick={() => setCheckoutOpen(false)} aria-label="Fechar">
                <X size={19} />
              </button>
            </div>
            <form className="sheet-form" onSubmit={submitOrder}>
              <div className="sheet-body">
                <p className="choice-label">Como você quer receber?</p>
                <div className="choice-grid">
                  <button
                    type="button"
                    className={`choice ${fulfillment === "delivery" ? "is-on" : ""}`}
                    onClick={() => setFulfillment("delivery")}
                    aria-pressed={fulfillment === "delivery"}
                  >
                    <Bike size={22} />
                    <span>
                      Entrega
                      <small>Sem taxa</small>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`choice ${fulfillment === "pickup" ? "is-on" : ""}`}
                    onClick={() => setFulfillment("pickup")}
                    aria-pressed={fulfillment === "pickup"}
                  >
                    <Store size={22} />
                    <span>
                      Retirar no balcão
                      <small>Rua das Acácias, 120</small>
                    </span>
                  </button>
                </div>

                <div className="field-row">
                  <label className="field">
                    <span>Nome</span>
                    <input
                      autoComplete="name"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="Seu nome"
                      required
                      minLength={2}
                      maxLength={80}
                    />
                  </label>
                  <label className="field">
                    <span>WhatsApp</span>
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(formatPhone(event.target.value))}
                      placeholder="(18) 99999-9999"
                      required
                    />
                  </label>
                </div>
                {fulfillment === "delivery" ? (
                  <label className="field">
                    <span>Endereço de entrega</span>
                    <input
                      autoComplete="street-address"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Rua, número, bairro e referência"
                      required
                      minLength={6}
                      maxLength={200}
                    />
                  </label>
                ) : null}

                <p className="choice-label">Pagamento na entrega ou retirada</p>
                <div className="choice-grid three">
                  <button
                    type="button"
                    className={`choice ${paymentMethod === "pix" ? "is-on" : ""}`}
                    onClick={() => setPaymentMethod("pix")}
                    aria-pressed={paymentMethod === "pix"}
                  >
                    <QrCode size={22} />
                    Pix
                  </button>
                  <button
                    type="button"
                    className={`choice ${paymentMethod === "card" ? "is-on" : ""}`}
                    onClick={() => setPaymentMethod("card")}
                    aria-pressed={paymentMethod === "card"}
                  >
                    <CreditCard size={22} />
                    Cartão
                  </button>
                  <button
                    type="button"
                    className={`choice ${paymentMethod === "cash" ? "is-on" : ""}`}
                    onClick={() => setPaymentMethod("cash")}
                    aria-pressed={paymentMethod === "cash"}
                  >
                    <Banknote size={22} />
                    Dinheiro
                  </button>
                </div>

                <label className="field">
                  <span>
                    Observações <small>(opcional)</small>
                  </span>
                  <textarea
                    rows={2}
                    maxLength={400}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder={paymentMethod === "cash" ? "Precisa de troco? Para quanto?" : "Ex.: sem cebola, sabor do refrigerante"}
                  />
                </label>

                <label className="sf-consent">
                  <input
                    type="checkbox"
                    required
                    checked={acceptedPrivacy}
                    onChange={(event) => setAcceptedPrivacy(event.target.checked)}
                  />
                  <span>
                    Concordo com a{" "}
                    <a href="/privacidade" target="_blank" rel="noreferrer">
                      política de privacidade
                    </a>{" "}
                    e autorizo o uso dos meus dados para atender este pedido.
                  </span>
                </label>
                {orderError ? (
                  <p className="form-error" role="alert">
                    {orderError}
                  </p>
                ) : null}
              </div>
              <div className="sheet-foot">
                <div>
                  <small>
                    {itemCount} {itemCount === 1 ? "item" : "itens"} · entrega grátis
                  </small>
                  <strong>{money(subtotal)}</strong>
                </div>
                <button type="submit" className="btn btn-red btn-lg" disabled={submitting || cart.length === 0}>
                  {submitting ? (
                    <>
                      <span className="spinner" /> Enviando…
                    </>
                  ) : (
                    "Enviar pedido"
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {createdOrder ? (
        <div className="overlay">
          <section className="sheet success" role="dialog" aria-modal="true" aria-labelledby="success-title">
            <div className="success-icon">
              <Check size={34} />
            </div>
            <h2 id="success-title">Pedido enviado!</h2>
            <p>
              Obrigado, {customerName.split(" ")[0] || "cliente"}. Mande o pedido no nosso WhatsApp para a cozinha
              confirmar mais rápido.
            </p>
            <div className="track">
              <div className="track-top">
                <span>Pedido</span>
                <strong>{createdOrder.orderNumber}</strong>
              </div>
              <p className="track-now">{STATUS_NAME[trackedStatus] ?? "Atualizando status…"}</p>
              <ol className="track-steps">
                {STATUS_STEPS.map((step, index) => (
                  <li key={step.key} className={trackedIndex >= index ? "is-done" : ""}>
                    <span className="track-dot">{trackedIndex >= index ? <Check size={13} /> : null}</span>
                    {step.label}
                  </li>
                ))}
              </ol>
              <p className="track-total">
                Total <strong>{money(Number(createdOrder.total))}</strong> · {PAYMENT_LABEL[paymentMethod]}
              </p>
            </div>
            <div className="success-actions">
              <a className="btn btn-whats btn-lg" href={waLink(whatsappText)} target="_blank" rel="noreferrer">
                <MessageCircle size={19} /> Enviar no WhatsApp
              </a>
              <button type="button" className="link-btn" onClick={() => setCreatedOrder(null)}>
                Voltar ao cardápio
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
