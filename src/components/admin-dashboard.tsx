"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  LayoutDashboard,
  LogOut,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Package,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  UtensilsCrossed,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LogoMark, LogoWordmark } from "@/components/logo";
import type { MenuCard, OrderRecord, ProductCard } from "@/lib/types";

const statusText: Record<string, string> = {
  received: "Recebido",
  preparing: "Em preparo",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  cancelled: "Cancelado",
};
const statusOptions = ["received", "preparing", "out_for_delivery", "delivered", "cancelled"];
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const currencyInput = (value: string) => value.replace(/[^0-9,\.]/g, "").replace(",", ".");

function todayInBrazil() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${fields.year}-${fields.month}-${fields.day}`;
}

function timeLabel(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short" }).format(new Date(date));
}

type DashboardData = {
  products: ProductCard[];
  menus: MenuCard[];
  orders: OrderRecord[];
  stats: { orderCount: number; revenue: number; activeOrders: number };
};
type Section = "overview" | "menus" | "orders" | "catalog";

const emptyMenu = (shift: string): MenuCard => ({
  id: 0,
  date: todayInBrazil(),
  shift,
  title: shift === "almoco" ? "Almoço com gostinho de casa" : "Noite boa pede uma porção",
  description: "Comida fresquinha, preparada com carinho para hoje.",
  dishes: [],
  isPublished: false,
});

export default function AdminDashboard() {
  const [section, setSection] = useState<Section>("overview");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeMenu, setActiveMenu] = useState("almoco");
  const [priceDrafts, setPriceDrafts] = useState<Record<number, string>>({});
  const [savingProduct, setSavingProduct] = useState<number | null>(null);
  const [savingMenu, setSavingMenu] = useState(false);
  const [savingOrder, setSavingOrder] = useState<number | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [adminConfigured, setAdminConfigured] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  async function loadDashboard(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin", { cache: "no-store" });
      const result = (await response.json()) as DashboardData & { error?: string };
      if (response.status === 401 || response.status === 503) {
        setAuthenticated(false);
        setData(null);
      }
      if (!response.ok) throw new Error(result.error ?? "Não foi possível carregar o painel.");
      const normalized: DashboardData = {
        ...result,
        products: result.products.map((product) => ({ ...product, price: Number(product.price) })),
      };
      setData(normalized);
      setPriceDrafts(Object.fromEntries(normalized.products.map((product) => [product.id, product.price.toFixed(2)])));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Tente novamente em instantes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoggingIn(true);
    setAuthError("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      const result = (await response.json()) as { authenticated?: boolean; configured?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível entrar no painel.");
      setAuthenticated(true);
      setAdminConfigured(true);
      setAdminPassword("");
      await loadDashboard();
    } catch (requestError) {
      setAuthError(requestError instanceof Error ? requestError.message : "Confira a senha e tente novamente.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function signOut() {
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
    } finally {
      setAuthenticated(false);
      setAdminPassword("");
      setData(null);
      setSection("overview");
      setError("");
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      try {
        const response = await fetch("/api/admin/session", { cache: "no-store" });
        const result = (await response.json()) as { authenticated?: boolean; configured?: boolean; error?: string };
        if (cancelled) return;
        setAdminConfigured(result.configured === true);
        setAuthenticated(response.ok && result.authenticated === true);
        if (response.ok && result.authenticated) {
          await loadDashboard();
        } else if (result.error) {
          setAuthError(result.error);
        }
      } catch {
        if (!cancelled) setAuthError("Não foi possível conferir o acesso. Atualize a página para tentar novamente.");
      } finally {
        if (!cancelled) setAuthChecking(false);
      }
    }
    void restoreSession();
    return () => { cancelled = true; };
  }, []);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  const menu = data?.menus.find((item) => item.shift === activeMenu) ?? emptyMenu(activeMenu);

  function updateMenu(patch: Partial<MenuCard>) {
    setData((current) => {
      if (!current) return current;
      const found = current.menus.some((item) => item.shift === activeMenu);
      return {
        ...current,
        menus: found
          ? current.menus.map((item) => item.shift === activeMenu ? { ...item, ...patch } : item)
          : [...current.menus, { ...emptyMenu(activeMenu), ...patch }],
      };
    });
  }

  async function saveMenu() {
    if (!menu.title.trim()) return;
    setSavingMenu(true);
    setError("");
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "menu",
          date: todayInBrazil(),
          shift: activeMenu,
          title: menu.title,
          description: menu.description,
          dishes: menu.dishes,
          isPublished: menu.isPublished,
        }),
      });
      const result = (await response.json()) as { menu?: MenuCard; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível salvar o cardápio.");
      if (result.menu) {
        setData((current) => current ? {
          ...current,
          menus: [...current.menus.filter((item) => item.shift !== activeMenu), result.menu!],
        } : current);
      }
      notify(menu.isPublished ? "Cardápio publicado na vitrine." : "Cardápio salvo como rascunho.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Tente novamente.");
    } finally {
      setSavingMenu(false);
    }
  }

  async function saveProduct(product: ProductCard) {
    const price = Number(currencyInput(priceDrafts[product.id] ?? ""));
    if (!Number.isFinite(price) || price < 1) {
      setError("Informe um preço válido, maior que R$ 1,00.");
      return;
    }
    setSavingProduct(product.id);
    setError("");
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "product", productId: product.id, price }),
      });
      const result = (await response.json()) as { product?: { price: string }; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível salvar o preço.");
      setData((current) => current ? {
        ...current,
        products: current.products.map((item) => item.id === product.id ? { ...item, price: Number(result.product?.price ?? price) } : item),
      } : current);
      setPriceDrafts((current) => ({ ...current, [product.id]: Number(result.product?.price ?? price).toFixed(2) }));
      notify(`${product.name}: preço atualizado.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Tente novamente.");
    } finally {
      setSavingProduct(null);
    }
  }

  async function toggleProduct(product: ProductCard) {
    setSavingProduct(product.id);
    setError("");
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "product", productId: product.id, available: !product.available }),
      });
      const result = (await response.json()) as { product?: { available: boolean }; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível alterar a disponibilidade.");
      setData((current) => current ? {
        ...current,
        products: current.products.map((item) => item.id === product.id ? { ...item, available: result.product?.available ?? !product.available } : item),
      } : current);
      notify(`${product.name}: ${product.available ? "pausado" : "disponível"} na vitrine.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Tente novamente.");
    } finally {
      setSavingProduct(null);
    }
  }

  async function updateOrderStatus(orderId: number, status: string) {
    setSavingOrder(orderId);
    setError("");
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", orderId, status }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível atualizar o pedido.");
      setData((current) => current ? {
        ...current,
        orders: current.orders.map((order) => order.id === orderId ? { ...order, status } : order),
        stats: {
          ...current.stats,
          activeOrders: current.orders.filter((order) => order.id === orderId
            ? !["delivered", "cancelled"].includes(status)
            : !["delivered", "cancelled"].includes(order.status)).length,
        },
      } : current);
      notify(`Pedido atualizado: ${statusText[status]}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Tente novamente.");
    } finally {
      setSavingOrder(null);
    }
  }

  const chart = useMemo(() => {
    const entries = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric", month: "2-digit", day: "2-digit",
      }).formatToParts(date);
      const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      const key = `${fields.year}-${fields.month}-${fields.day}`;
      const count = data?.orders.filter((order) => {
        const orderParts = new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
        }).formatToParts(new Date(order.createdAt));
        const orderFields = Object.fromEntries(orderParts.map((part) => [part.type, part.value]));
        return `${orderFields.year}-${orderFields.month}-${orderFields.day}` === key && order.status !== "cancelled";
      }).length ?? 0;
      return { key, label: new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short" }).format(date).replace(".", ""), count };
    });
    return entries;
  }, [data?.orders]);
  const peakOrders = Math.max(1, ...chart.map((day) => day.count));

  const filteredOrders = (data?.orders ?? []).filter((order) => {
    const term = orderSearch.trim().toLocaleLowerCase("pt-BR");
    return !term || order.orderNumber.toLowerCase().includes(term) || order.customerName.toLocaleLowerCase("pt-BR").includes(term) || order.customerPhone.includes(term);
  });
  const weekday = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  function selectSection(next: Section) {
    setSection(next);
    setError("");
  }

  if (authChecking) {
    return <main className="admin-app admin-auth-stage"><div className="admin-topbar"><Link className="logo-link admin-brand" href="/"><LogoMark size={36} /><LogoWordmark caption="Painel do restaurante" /></Link></div><div className="admin-loading"><span className="admin-loader" /><span>Verificando acesso seguro...</span></div></main>;
  }

  if (!authenticated) {
    return (
      <main className="admin-app admin-auth-stage">
        <header className="admin-topbar"><Link className="logo-link admin-brand" href="/"><LogoMark size={36} /><LogoWordmark caption="Painel do restaurante" /></Link><Link className="admin-view-store" href="/"><Eye size={15} /> Voltar à vitrine <ArrowUpRight size={13} /></Link></header>
        <section className="admin-login-card"><div className="admin-login-seal"><LogoMark size={56} title="Empório Paulista" /></div><span className="panel-eyebrow">ACESSO RESTRITO · EQUIPE EMPÓRIO</span><h1>Que bom ter você<br /><em>por aqui.</em></h1><p className="admin-login-copy">Acesse os cardápios e pedidos do restaurante com sua senha administrativa.</p>
          {adminConfigured ? <form className="admin-login-form" onSubmit={signIn}><label htmlFor="admin-password">Senha do painel</label><input id="admin-password" type="password" autoComplete="current-password" minLength={12} maxLength={512} placeholder="Digite sua senha" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} required /><button className="admin-primary-button" type="submit" disabled={loggingIn || adminPassword.length < 12}>{loggingIn ? <span className="admin-loader small" /> : <LockKeyhole size={14} />}{loggingIn ? " Verificando..." : " Entrar no painel"}<ArrowRight size={14} /></button></form> : <div className="admin-setup-note"><ShieldCheck size={17} /><span><strong>Configure o acesso do administrador</strong><small>Adicione <code>ADMIN_PASSWORD</code> (mínimo de 12 caracteres) às variáveis de ambiente do projeto. O painel permanece bloqueado até a configuração.</small></span></div>}
          {authError && <div className="admin-login-error" role="alert">{authError}</div>}<div className="admin-login-footnote"><ShieldCheck size={13} /> Sessão protegida · expira em 8 horas</div>
        </section>
        <div className="admin-auth-address">Empório Digital <i>·</i> Junqueirópolis, SP</div>
      </main>
    );
  }

  return (
    <main className="admin-app">
      <header className="admin-topbar"><Link className="logo-link admin-brand" href="/"><LogoMark size={36} /><LogoWordmark caption="Painel do restaurante" /></Link><div className="admin-topbar-right"><span className="admin-live-tag"><i /> PAINEL EM TEMPO REAL</span><Link className="admin-view-store" href="/" target="_blank" rel="noreferrer"><Eye size={15} /> Ver a vitrine <ArrowUpRight size={13} /></Link><button className="admin-logout" onClick={() => void signOut()}><LogOut size={14} /><span>Sair</span></button><button className="admin-refresh" onClick={() => void loadDashboard(true)} disabled={refreshing} aria-label="Atualizar painel"><RefreshCw size={16} className={refreshing ? "refresh-spin" : ""} /></button></div></header>
      <div className="admin-shell">
        <aside className="admin-sidebar"><div className="sidebar-restaurant"><span className="sidebar-store-icon"><Store size={17} /></span><span><strong>Restaurante</strong><small>Junqueirópolis · SP</small></span><ChevronRight size={14} /></div><span className="sidebar-label">MENU PRINCIPAL</span><nav className="admin-nav" aria-label="Menu do painel"><button className={section === "overview" ? "active" : ""} onClick={() => selectSection("overview")}><LayoutDashboard size={17} /><span>Visão geral</span>{section === "overview" && <i />}</button><button className={section === "menus" ? "active" : ""} onClick={() => selectSection("menus")}><BookOpen size={17} /><span>Cardápio do dia</span>{section === "menus" && <i />}</button><button className={section === "orders" ? "active" : ""} onClick={() => selectSection("orders")}><ShoppingBag size={17} /><span>Pedidos</span>{data && data.stats.activeOrders > 0 && <b>{data.stats.activeOrders}</b>}{section === "orders" && <i />}</button><button className={section === "catalog" ? "active" : ""} onClick={() => selectSection("catalog")}><Package size={17} /><span>Produtos e preços</span>{section === "catalog" && <i />}</button></nav><div className="sidebar-status"><span className="sidebar-status-icon"><Clock3 size={17} /></span><div><small>HORÁRIO CONFIGURADO</small><strong>Almoço · 11h–14h</strong><span>Jantar seg–sex · 18h–21h</span></div></div><div className="sidebar-help"><span className="help-sparkle">✳</span><strong>Precisa de ajuda?</strong><p>Chame a equipe pelo WhatsApp.</p><a href="https://wa.me/5518999990102" target="_blank" rel="noreferrer"><MessageCircle size={13} /> Falar com suporte</a></div><Link className="sidebar-store-link" href="/"><ArrowRight size={13} /> Abrir a vitrine</Link></aside>
        <section className="admin-content">
          <div className="admin-page-top"><div><span className="admin-date-line"><CalendarDays size={13} /> {weekday}</span><h1>{greeting}, <em>Empório.</em> <span className="greeting-icon">✳</span></h1><p>Acompanhe sua operação e deixe a casa pronta para receber.</p></div><button className="admin-primary-button" onClick={() => selectSection("menus")}><BookOpen size={15} /> Atualizar cardápio <ArrowRight size={14} /></button></div>
          <div className="admin-confidential-note"><ShieldCheck size={14} /><span>Sessão autenticada · acesso administrativo expira automaticamente em 8 horas.</span></div>
          {error && <div className="admin-error" role="alert">{error}<button onClick={() => setError("")}>Dispensar</button></div>}
          {loading ? <div className="admin-loading"><span className="admin-loader" /><span>Preparando a casa...</span></div> : data ? <>
            {section === "overview" && <div className="admin-view-content"><div className="admin-stats-grid"><article className="admin-stat-card"><span className="stat-icon green"><ShoppingBag size={17} /></span><span className="stat-label">PEDIDOS RECEBIDOS</span><strong>{data.stats.orderCount}</strong><small>Desde o início da operação</small><div className="stat-foot"><span><ArrowUpRight size={12} /> canal próprio</span><span>atualizado agora</span></div></article><article className="admin-stat-card"><span className="stat-icon terra"><WalletCards size={17} /></span><span className="stat-label">VENDAS REGISTRADAS</span><strong>{money(data.stats.revenue)}</strong><small>Pedidos não cancelados</small><div className="stat-foot"><span className="stat-neutral">💚 venda direta</span><span>valor bruto</span></div></article><article className="admin-stat-card"><span className="stat-icon gold"><Clock3 size={17} /></span><span className="stat-label">PEDIDOS EM ANDAMENTO</span><strong>{data.stats.activeOrders}</strong><small>Aguardando sua equipe</small><button className="stat-link" onClick={() => selectSection("orders")}>Abrir a fila <ArrowRight size={12} /></button></article><article className="admin-stat-card"><span className="stat-icon lavender"><Package size={17} /></span><span className="stat-label">ITENS NO CATÁLOGO</span><strong>{data.products.filter((product) => product.available).length}<small className="stat-denominator"> / {data.products.length}</small></strong><small>Disponíveis na vitrine online</small><button className="stat-link" onClick={() => selectSection("catalog")}>Gerenciar produtos <ArrowRight size={12} /></button></article></div>
              <div className="admin-overview-grid"><section className="admin-panel chart-panel"><div className="panel-heading"><div><span className="panel-eyebrow">VITRINE PRÓPRIA</span><h2>Pedidos nos últimos 7 dias</h2></div><span className="chart-period"><CalendarDays size={13} /> Última semana</span></div><div className="chart-summary"><strong>{chart.reduce((sum, day) => sum + day.count, 0)}</strong><span>pedidos registrados<br />na última semana</span><span className="chart-summary-pill"><ArrowUpRight size={13} /> canal direto</span></div><div className="bar-chart" aria-label="Gráfico de pedidos nos últimos sete dias">{chart.map((day) => <div className="chart-day" key={day.key}><div className="chart-bar-wrap"><span className="chart-value">{day.count || ""}</span><div className={`chart-bar ${day.count ? "has-value" : ""}`} style={{ height: `${Math.max(5, (day.count / peakOrders) * 100)}%` }} /></div><span className="chart-day-label">{day.label}</span></div>)}</div><div className="chart-footnote"><span>Pedidos confirmados nesta semana</span><span><i />Pedidos no canal próprio</span></div></section><section className="admin-panel quick-panel"><div className="panel-heading"><div><span className="panel-eyebrow">NA ROTINA</span><h2>Deixe tudo pronto</h2></div><Sparkles size={17} className="quick-sparkle" /></div><button className="quick-action" onClick={() => selectSection("menus")}><span className="quick-action-icon"><BookOpen size={16} /></span><span><strong>Publicar cardápio</strong><small>Almoço e jantar de hoje</small></span><ArrowRight size={14} /></button><button className="quick-action" onClick={() => selectSection("orders")}><span className="quick-action-icon terra"><ShoppingBag size={16} /></span><span><strong>Abrir fila de pedidos</strong><small>{data.stats.activeOrders} aguardando atendimento</small></span><ArrowRight size={14} /></button><button className="quick-action" onClick={() => selectSection("catalog")}><span className="quick-action-icon gold"><Package size={16} /></span><span><strong>Conferir preços</strong><small>Catálogo e disponibilidade</small></span><ArrowRight size={14} /></button><a className="quick-whatsapp" href="https://wa.me/5518999990102" target="_blank" rel="noreferrer"><MessageCircle size={14} /> Abrir WhatsApp oficial <ArrowUpRight size={12} /></a></section></div>
              <section className="admin-panel recent-orders-panel"><div className="panel-heading"><div><span className="panel-eyebrow">MOVIMENTO RECENTE</span><h2>Últimos pedidos</h2></div><button className="panel-text-link" onClick={() => selectSection("orders")}>Ver todos <ArrowRight size={13} /></button></div>{data.orders.length === 0 ? <div className="admin-empty"><span>🍽️</span><strong>A próxima comanda pode ser a sua primeira venda online.</strong><small>Os novos pedidos aparecem aqui, em tempo real.</small><button onClick={() => selectSection("menus")}>Publicar cardápio <ArrowRight size={13} /></button></div> : <div className="mini-orders-list">{data.orders.slice(0, 5).map((order) => <OrderRow key={order.id} order={order} compact onStatusChange={updateOrderStatus} saving={savingOrder === order.id} />)}</div>}</section>
            </div>}

            {section === "menus" && <div className="admin-view-content"><div className="editor-intro"><span className="editor-icon"><BookOpen size={18} /></span><div><span className="panel-eyebrow">MENU DIGITAL · {todayInBrazil()}</span><h2>Cardápio do dia</h2><p>Atualize almoço e jantar em minutos. O que você publicar aparece na vitrine.</p></div></div><div className="menu-editor-layout"><div className="menu-editor-main"><div className="editor-shift-tabs"><button className={activeMenu === "almoco" ? "active" : ""} onClick={() => setActiveMenu("almoco")}><span>☀️</span><span><strong>Almoço</strong><small>11h às 14h</small></span><ChevronRight size={15} /></button><button className={activeMenu === "jantar" ? "active" : ""} onClick={() => setActiveMenu("jantar")}><span>🌙</span><span><strong>Jantar</strong><small>Seg–sex, 18h–21h</small></span><ChevronRight size={15} /></button></div><section className="admin-panel menu-edit-card"><div className="menu-edit-top"><div><span className="panel-eyebrow">{activeMenu === "almoco" ? "ALMOÇO DE HOJE" : "JANTAR DE HOJE"}</span><h3>O que vai pra mesa?</h3></div><span className={`publish-state ${menu.isPublished ? "published" : "draft"}`}><i />{menu.isPublished ? "Publicado" : "Rascunho"}</span></div><label className="admin-field"><span>Título do cardápio</span><input maxLength={100} value={menu.title} onChange={(event) => updateMenu({ title: event.target.value })} placeholder="Ex.: Almoço com gostinho de casa" /></label><label className="admin-field"><span>Uma mensagem para os clientes <small>opcional</small></span><textarea maxLength={500} rows={2} value={menu.description} onChange={(event) => updateMenu({ description: event.target.value })} placeholder="Ex.: Comida feita hoje, com ingredientes fresquinhos." /></label><label className="admin-field"><span>Pratos e acompanhamentos <small>um por linha</small></span><textarea rows={7} value={menu.dishes.join("\n")} onChange={(event) => updateMenu({ dishes: event.target.value.split("\n").slice(0, 20) })} placeholder={activeMenu === "almoco" ? "Arroz soltinho\nFeijão carioca\nFrango assado\nFarofa crocante" : "Fritas douradas\nLinguiça toscana\nSalgados da casa"} /></label><div className="publish-row"><div><strong>Exibir na vitrine</strong><small>Visível imediatamente no site do restaurante</small></div><button type="button" className={`toggle-switch ${menu.isPublished ? "on" : ""}`} aria-label={menu.isPublished ? "Despublicar cardápio" : "Publicar cardápio"} aria-pressed={menu.isPublished} onClick={() => updateMenu({ isPublished: !menu.isPublished })}><span /></button></div><button className="admin-primary-button save-menu-button" disabled={savingMenu || menu.title.trim().length < 3} onClick={() => void saveMenu()}>{savingMenu ? <span className="admin-loader small" /> : <Save size={15} />}{savingMenu ? " Salvando..." : menu.isPublished ? " Salvar e publicar" : " Salvar rascunho"}<ArrowRight size={14} /></button></section></div><aside className="menu-preview-column"><div className="preview-device"><div className="preview-device-top"><span className="preview-notch" /><span className="preview-brand"><span>EP</span> empório paulista</span><span className="preview-device-label">PRÉVIA</span></div><div className="preview-content"><span className="preview-today">CARDÁPIO DE HOJE</span><h3>{menu.title || "Seu cardápio do dia"}</h3><p>{menu.description || "Uma mensagem especial para quem vai sentar à mesa."}</p><div className="preview-line" />{menu.dishes.filter((dish) => typeof dish === "string" && dish.trim()).slice(0, 6).map((dish, index) => <div className="preview-dish" key={`${dish}-${index}`}><Check size={11} /><span>{dish || "Seu próximo prato"}</span></div>)}{menu.dishes.filter(Boolean).length === 0 && <div className="preview-placeholder">Seus pratos aparecem aqui, um por linha.</div>}<span className={`preview-visibility ${menu.isPublished ? "" : "preview-hidden"}`}><i /> {menu.isPublished ? "Visível na vitrine" : "Oculto · rascunho"}</span></div></div><div className="editor-tip"><Sparkles size={15} /><p><strong>Dica da casa</strong><br />Uma descrição curta e os pratos principais ajudam os clientes a escolherem mais rápido.</p></div></aside></div></div>}

            {section === "orders" && <div className="admin-view-content"><div className="editor-intro"><span className="editor-icon terra"><ShoppingBag size={18} /></span><div><span className="panel-eyebrow">FILA DA COZINHA</span><h2>Pedidos recebidos</h2><p>Atualize o status e mantenha cada cliente por dentro.</p></div></div><section className="admin-panel orders-admin-panel"><div className="orders-toolbar"><div><span className="orders-total-count">{filteredOrders.length}</span><span className="orders-total-label">pedidos recentes</span></div><label className="orders-search"><Search size={14} /><input aria-label="Buscar pedidos" placeholder="Buscar nome, pedido ou telefone" value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} /><kbd>⌘ K</kbd></label><button className="admin-subtle-button" onClick={() => void loadDashboard(true)}><RefreshCw size={14} /> Atualizar</button></div>{filteredOrders.length === 0 ? <div className="admin-empty"><span>🍽️</span><strong>{orderSearch ? "Não encontramos pedidos com essa busca." : "Sua fila está tranquila por enquanto."}</strong><small>{orderSearch ? "Confira o nome, telefone ou código do pedido." : "Assim que o primeiro pedido chegar, ele aparece aqui."}</small></div> : <div className="orders-admin-list">{filteredOrders.map((order) => <OrderRow key={order.id} order={order} onStatusChange={updateOrderStatus} saving={savingOrder === order.id} />)}</div>}</section></div>}

            {section === "catalog" && <div className="admin-view-content"><div className="editor-intro"><span className="editor-icon gold"><Package size={18} /></span><div><span className="panel-eyebrow">CATÁLOGO DA VITRINE</span><h2>Produtos e preços</h2><p>Atualize valores e disponibilidade sem precisar mexer no cardápio publicado.</p></div></div><div className="catalog-alert"><ShieldCheck size={15} /><span><strong>Revise antes de abrir a loja.</strong> Os valores iniciais são referências baseadas nas informações recebidas; confirme a tabela vigente com o restaurante.</span></div><section className="admin-panel catalog-panel"><div className="catalog-header"><span>ITEM / CATEGORIA</span><span>PREÇO VIGENTE</span><span>NA VITRINE</span><span /></div>{data.products.map((product) => <article className="catalog-row" key={product.id}><div className="catalog-product-name"><img className="catalog-thumb" src={product.imageUrl ?? "/images/products/marmitex.jpg"} alt="" width={40} height={40} loading="lazy" /><span><strong>{product.name}</strong><small>{product.category} · {product.description}</small></span></div><div className="catalog-price"><span>R$</span><input aria-label={`Preço de ${product.name}`} inputMode="decimal" value={priceDrafts[product.id] ?? product.price.toFixed(2)} onChange={(event) => setPriceDrafts((current) => ({ ...current, [product.id]: currencyInput(event.target.value) }))} /></div><button type="button" className={`catalog-availability ${product.available ? "available" : "unavailable"}`} onClick={() => void toggleProduct(product)} disabled={savingProduct === product.id}><i />{product.available ? "Disponível" : "Pausado"}</button><button className="catalog-save" onClick={() => void saveProduct(product)} disabled={savingProduct === product.id}>{savingProduct === product.id ? <span className="admin-loader tiny" /> : <Save size={14} />}<span>Salvar</span></button></article>)}<div className="catalog-footer"><span><CheckCircle2 size={13} /> Mudanças ficam salvas no catálogo do restaurante.</span><button onClick={() => void loadDashboard(true)}><RefreshCw size={13} /> Atualizar catálogo</button></div></section></div>}
          </> : <div className="admin-load-error"><span>🍲</span><h2>A cozinha está abrindo.</h2><p>{error || "Ainda não conseguimos conectar com o painel."}</p><button className="admin-primary-button" onClick={() => void loadDashboard()}>Tentar novamente <RefreshCw size={14} /></button></div>}
          <div className="admin-content-footer"><span>Empório Digital <i>·</i> Feito com carinho para o Empório Paulista</span><span><MapPin size={12} /> Junqueirópolis, SP</span></div>
        </section>
      </div>
      {toast && <div className="admin-toast"><CheckCircle2 size={17} />{toast}</div>}
    </main>
  );
}

function OrderRow({ order, compact = false, onStatusChange, saving }: { order: OrderRecord; compact?: boolean; onStatusChange: (orderId: number, status: string) => void; saving: boolean }) {
  const fulfillmentLabel = order.fulfillment === "delivery" ? "Entrega" : "Retirada";
  const paymentLabel: Record<string, string> = { pix: "Pix", cash: "Dinheiro", card: "Cartão" };
  const firstItems = order.items.slice(0, compact ? 2 : 4);
  return (
    <article className={`order-row ${compact ? "compact" : ""}`}>
      <div className="order-row-top"><span className="order-code">{order.orderNumber}</span><span className="order-time"><Clock3 size={12} /> {timeLabel(order.createdAt)} <i>·</i> {dateLabel(order.createdAt)}</span><span className={`order-status-badge status-${order.status}`}><i />{statusText[order.status] ?? order.status}</span></div>
      <div className="order-row-main"><div className="order-customer"><strong>{order.customerName}</strong><a href={`https://wa.me/55${order.customerPhone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle size={12} /> {order.customerPhone}</a></div><div className="order-items-summary">{firstItems.map((item, index) => <span key={`${order.id}-${index}`}>{item.quantity}× {item.name}{item.customizations ? ` · ${item.customizations.protein}` : ""}</span>)}{order.items.length > firstItems.length && <small>+ {order.items.length - firstItems.length} itens</small>}</div><div className="order-fulfillment"><span>{order.fulfillment === "delivery" ? <Truck size={14} /> : <Store size={14} />}{fulfillmentLabel}</span>{!compact && order.address && <small>{order.address}</small>}</div><div className="order-payment"><span>{money(Number(order.total))}</span><small><WalletCards size={11} /> {paymentLabel[order.paymentMethod] ?? order.paymentMethod}</small></div><select aria-label={`Status do pedido ${order.orderNumber}`} className={`order-status-select status-${order.status}`} value={order.status} onChange={(event) => onStatusChange(order.id, event.target.value)} disabled={saving}>{statusOptions.map((status) => <option value={status} key={status}>{statusText[status]}</option>)}</select></div>
      {!compact && order.notes && <div className="order-notes"><span>Observação</span>{order.notes}</div>}
    </article>
  );
}
