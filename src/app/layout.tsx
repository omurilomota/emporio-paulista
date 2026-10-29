import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import ServiceWorkerRegister from "@/components/service-worker-register";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow/700.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "./globals.css";
import "./site.css";

export const metadata: Metadata = {
  title: {
    default: "Empório Paulista | Comida caseira, self-service e marmitex em Junqueirópolis",
    template: "%s | Empório Paulista",
  },
  description:
    "Restaurante Empório Paulista, Rua das Acácias, 120 — Junqueirópolis/SP. Refeições por quilo, self-service e marmitex. Almoço todos os dias das 11h às 14h, jantar de segunda a sexta das 18h às 21h. Entrega sem taxa.",
  applicationName: "Empório Paulista",
  openGraph: {
    title: "Empório Paulista — Sabor que reúne, tradição que encanta",
    description: "Comida caseira em Junqueirópolis/SP. Monte sua marmitex e peça sem taxa de entrega.",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/images/hero-buffet.jpg", width: 1672, height: 940, alt: "Comida caseira do Empório Paulista" }],
  },
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
