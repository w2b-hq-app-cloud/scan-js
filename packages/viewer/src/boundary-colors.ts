/** Palette tokens for view boundary stroke / tint (match board CSS vars). */
export const BOUNDARY_COLORS = [
  "svc",
  "ext",
  "data",
  "event",
  "search",
  "agent",
  "repo",
  "warn",
] as const;

export type BoundaryColor = (typeof BOUNDARY_COLORS)[number];

export type BoundaryColorMeta = {
  label: string;
  /** CSS custom property used on the live board. */
  cssVar: string;
  /** Portable hex for SVG/PNG export. */
  hex: string;
};

export const boundaryColorMeta: Record<BoundaryColor, BoundaryColorMeta> = {
  svc: { label: "Blue", cssVar: "var(--svc)", hex: "#3b82f6" },
  ext: { label: "Purple", cssVar: "var(--ext)", hex: "#a855f7" },
  data: { label: "Steel", cssVar: "var(--data)", hex: "#0ea5e9" },
  event: { label: "Magenta", cssVar: "var(--event)", hex: "#c026d3" },
  search: { label: "Amber", cssVar: "var(--search)", hex: "#f59e0b" },
  agent: { label: "Green", cssVar: "var(--agent)", hex: "#22c55e" },
  repo: { label: "Graphite", cssVar: "var(--repo)", hex: "#64748b" },
  warn: { label: "Orange", cssVar: "var(--warn)", hex: "#d97706" },
};

export function isBoundaryColor(value: unknown): value is BoundaryColor {
  return typeof value === "string" && (BOUNDARY_COLORS as readonly string[]).includes(value);
}

/** Resolve stored color, falling back from legacy kind-only tinting. */
export function resolveBoundaryColor(
  color: BoundaryColor | undefined,
  _kind?: "trust" | "runtime",
): BoundaryColor {
  if (color && isBoundaryColor(color)) return color;
  // Trust and Runtime both default to service tint (Runtime is not agent-only).
  return "svc";
}

export function boundaryStroke(color: BoundaryColor): string {
  return boundaryColorMeta[color].cssVar;
}

export function boundaryFillMix(color: BoundaryColor): string {
  return `color-mix(in oklab, ${boundaryColorMeta[color].cssVar} 6%, transparent)`;
}

export function boundaryExportStroke(color: BoundaryColor): string {
  return boundaryColorMeta[color].hex;
}

export function boundaryExportFill(color: BoundaryColor): string {
  const hex = boundaryColorMeta[color].hex;
  // ~6% alpha fill matching the live board tint.
  return `${hex}0f`;
}
