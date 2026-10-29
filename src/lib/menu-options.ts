// Shared by the storefront builder and the order API so both validate the same choices.
export const MARMITEX_BASE = "Arroz e feijão";

export const MARMITEX_PROTEINS = [
  "Frango assado",
  "Bisteca de porco",
  "Bife acebolado",
  "Carne ao molho madeira",
  "Linguiça toscana",
] as const;

export const MARMITEX_SIDES = [
  "Farofa",
  "Couve refogada",
  "Batata frita",
  "Macarrão ao sugo",
  "Salada",
] as const;

export const MARMITEX_SIZE_NAMES: Record<string, string> = {
  P: "Pequena",
  M: "Média",
  G: "Grande",
};
