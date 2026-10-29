import { describe, expect, it } from "vitest";
import {
  MARMITEX_BASE,
  MARMITEX_PROTEINS,
  MARMITEX_SIDES,
  MARMITEX_SIZE_NAMES,
} from "./menu-options";

describe("catálogo da marmitex", () => {
  it("define a base fixa", () => {
    expect(MARMITEX_BASE).toBe("Arroz e feijão");
  });

  it("não repete proteínas nem acompanhamentos", () => {
    expect(new Set(MARMITEX_PROTEINS).size).toBe(MARMITEX_PROTEINS.length);
    expect(new Set(MARMITEX_SIDES).size).toBe(MARMITEX_SIDES.length);
  });

  it("oferece as três proteínas e acompanhamentos esperados", () => {
    expect(MARMITEX_PROTEINS).toContain("Frango assado");
    expect(MARMITEX_PROTEINS).toContain("Bisteca de porco");
    expect(MARMITEX_PROTEINS).toContain("Bife acebolado");
    expect(MARMITEX_SIDES).toContain("Farofa");
    expect(MARMITEX_SIDES.length).toBeGreaterThanOrEqual(3);
  });

  it("nomeia os três tamanhos", () => {
    expect(MARMITEX_SIZE_NAMES).toEqual({
      P: "Pequena",
      M: "Média",
      G: "Grande",
    });
  });
});
