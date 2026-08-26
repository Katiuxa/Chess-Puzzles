import type { PieceKind } from "../engine/types";

export function pieceSrc(kind: PieceKind, color: "w" | "b"): string {
  const base = import.meta.env.BASE_URL;
  return `${base}pieces/${color}${kind.toLowerCase()}.svg?v=3`;
}
