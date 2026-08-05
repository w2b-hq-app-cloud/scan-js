/** Palette tokens for view boundary stroke / tint (match board CSS vars). */
export declare const BOUNDARY_COLORS: readonly ["svc", "ext", "data", "event", "search", "agent", "repo", "warn"];
export type BoundaryColor = (typeof BOUNDARY_COLORS)[number];
export type BoundaryColorMeta = {
    label: string;
    /** CSS custom property used on the live board. */
    cssVar: string;
    /** Portable hex for SVG/PNG export. */
    hex: string;
};
export declare const boundaryColorMeta: Record<BoundaryColor, BoundaryColorMeta>;
export declare function isBoundaryColor(value: unknown): value is BoundaryColor;
/** Resolve stored color, falling back from legacy kind-only tinting. */
export declare function resolveBoundaryColor(color: BoundaryColor | undefined, _kind?: "trust" | "runtime"): BoundaryColor;
export declare function boundaryStroke(color: BoundaryColor): string;
export declare function boundaryFillMix(color: BoundaryColor): string;
export declare function boundaryExportStroke(color: BoundaryColor): string;
export declare function boundaryExportFill(color: BoundaryColor): string;
