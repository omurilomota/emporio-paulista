import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Empório Paulista · Restaurante",
    short_name: "Empório Paulista",
    description: "Comida caseira, self-service e marmitex em Junqueirópolis/SP. Entrega sem taxa.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f0e8",
    theme_color: "#1e1a16",
    lang: "pt-BR",
    categories: ["food", "shopping"],
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
