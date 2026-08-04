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
];
export const boundaryColorMeta = {
    svc: { label: "Blue", cssVar: "var(--svc)", hex: "#3b82f6" },
    ext: { label: "Purple", cssVar: "var(--ext)", hex: "#a855f7" },
    data: { label: "Steel", cssVar: "var(--data)", hex: "#0ea5e9" },
    event: { label: "Magenta", cssVar: "var(--event)", hex: "#c026d3" },
    search: { label: "Amber", cssVar: "var(--search)", hex: "#f59e0b" },
    agent: { label: "Green", cssVar: "var(--agent)", hex: "#22c55e" },
    repo: { label: "Graphite", cssVar: "var(--repo)", hex: "#64748b" },
    warn: { label: "Orange", cssVar: "var(--warn)", hex: "#d97706" },
};
export function isBoundaryColor(value) {
    return typeof value === "string" && BOUNDARY_COLORS.includes(value);
}
/** Resolve stored color, falling back from legacy kind-only tinting. */
export function resolveBoundaryColor(color, _kind) {
    if (color && isBoundaryColor(color))
        return color;
    // Trust and Runtime both default to service tint (Runtime is not agent-only).
    return "svc";
}
export function boundaryStroke(color) {
    return boundaryColorMeta[color].cssVar;
}
export function boundaryFillMix(color) {
    return `color-mix(in oklab, ${boundaryColorMeta[color].cssVar} 6%, transparent)`;
}
export function boundaryExportStroke(color) {
    return boundaryColorMeta[color].hex;
}
export function boundaryExportFill(color) {
    const hex = boundaryColorMeta[color].hex;
    // ~6% alpha fill matching the live board tint.
    return `${hex}0f`;
}
