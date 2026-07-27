/**
 * Visual tokens aligned with whiteboard `kinds.ts` + `styles.css`.
 * Hex approximations of oklch kind colors so SVG/PNG export stays portable.
 * Icon geometry from lucide-react@0.575 (same icons as the live NodeCard).
 */
export const kindVisuals = {
    service: {
        color: "#3b82f6",
        soft: "#eff6ff",
        icon: [
            { tag: "path", d: "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" },
            { tag: "path", d: "M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" },
        ],
    },
    external: {
        color: "#a855f7",
        soft: "#faf5ff",
        icon: [
            { tag: "path", d: "M10 12h4" },
            { tag: "path", d: "M10 8h4" },
            { tag: "path", d: "M14 21v-3a2 2 0 0 0-4 0v3" },
            { tag: "path", d: "M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" },
            { tag: "path", d: "M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" },
        ],
    },
    database: {
        color: "#0ea5e9",
        soft: "#f0f9ff",
        icon: [
            { tag: "ellipse", cx: 12, cy: 5, rx: 9, ry: 3 },
            { tag: "path", d: "M3 5V19A9 3 0 0 0 21 19V5" },
            { tag: "path", d: "M3 12A9 3 0 0 0 21 12" },
        ],
    },
    event: {
        color: "#c026d3",
        soft: "#fdf4ff",
        icon: [
            { tag: "path", d: "M16.247 7.761a6 6 0 0 1 0 8.478" },
            { tag: "path", d: "M19.075 4.933a10 10 0 0 1 0 14.134" },
            { tag: "path", d: "M4.925 19.067a10 10 0 0 1 0-14.134" },
            { tag: "path", d: "M7.753 16.239a6 6 0 0 1 0-8.478" },
            { tag: "circle", cx: 12, cy: 12, r: 2 },
        ],
    },
    search: {
        color: "#f59e0b",
        soft: "#fffbeb",
        icon: [
            { tag: "path", d: "m21 21-4.34-4.34" },
            { tag: "circle", cx: 11, cy: 11, r: 8 },
        ],
    },
    agent: {
        color: "#22c55e",
        soft: "#f0fdf4",
        icon: [
            { tag: "path", d: "M12 8V4H8" },
            { tag: "rect", x: 4, y: 8, width: 16, height: 12, rx: 2 },
            { tag: "path", d: "M2 14h2" },
            { tag: "path", d: "M20 14h2" },
            { tag: "path", d: "M15 13v2" },
            { tag: "path", d: "M9 13v2" },
        ],
    },
    repo: {
        color: "#64748b",
        soft: "#f8fafc",
        icon: [
            {
                tag: "path",
                d: "M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4",
            },
            { tag: "path", d: "M9 18c-4.51 2-5-2-7-2" },
        ],
    },
};
export const warnVisual = {
    color: "#d97706",
    soft: "#fef3c7",
    icon: [
        { tag: "path", d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" },
        { tag: "path", d: "M12 9v4" },
        { tag: "path", d: "M12 17h.01" },
    ],
};
const edgeIcons = {
    rest: {
        color: "#334155",
        icon: [
            {
                tag: "path",
                d: "M4 12.15V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2h-3.35",
            },
            { tag: "path", d: "M14 2v5a1 1 0 0 0 1 1h5" },
            { tag: "path", d: "m5 16-3 3 3 3" },
            { tag: "path", d: "m9 22 3-3-3-3" },
        ],
    },
    grpc: {
        color: "#334155",
        icon: [
            {
                tag: "path",
                d: "M4 12.15V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2h-3.35",
            },
            { tag: "path", d: "M14 2v5a1 1 0 0 0 1 1h5" },
            { tag: "path", d: "m5 16-3 3 3 3" },
            { tag: "path", d: "m9 22 3-3-3-3" },
        ],
    },
    async: { color: "#c026d3", icon: kindVisuals.event.icon },
    stream: { color: "#c026d3", icon: kindVisuals.event.icon },
    db: { color: "#22c55e", icon: kindVisuals.database.icon },
    git: { color: "#334155", icon: kindVisuals.repo.icon },
    flow: {
        color: "#22c55e",
        icon: [
            { tag: "path", d: "M5 12h14" },
            { tag: "path", d: "m12 5 7 7-7 7" },
        ],
    },
};
export function edgeVisual(kind) {
    return edgeIcons[kind];
}
export function renderLucideIcon(children, x, y, size, stroke, opts) {
    const fill = opts?.fill ?? "none";
    const sw = opts?.strokeWidth ?? 2;
    const body = children
        .map((c) => {
        if (c.tag === "path")
            return `<path d="${c.d}"/>`;
        if (c.tag === "circle")
            return `<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}"/>`;
        if (c.tag === "ellipse")
            return `<ellipse cx="${c.cx}" cy="${c.cy}" rx="${c.rx}" ry="${c.ry}"/>`;
        return `<rect x="${c.x}" y="${c.y}" width="${c.width}" height="${c.height}"${c.rx != null ? ` rx="${c.rx}"` : ""}/>`;
    })
        .join("");
    return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
