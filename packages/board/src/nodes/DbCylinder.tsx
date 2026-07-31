// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

export function DbCylinder({
  width,
  height,
  color,
  selected,
}: {
  width: number;
  height: number;
  color: string;
  selected: boolean;
}) {
  const rx = Math.max(8, width / 2 - 10);
  const ry = Math.min(14, height * 0.12);
  const cx = width / 2;
  const topY = ry + 2;
  const bottomY = height - ry - 2;
  const stroke = selected ? color : `color-mix(in oklab, ${color} 55%, transparent)`;

  return (
    <svg
      className="absolute inset-0"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      style={{ pointerEvents: "none" }}
    >
      <path
        d={`M ${cx - rx} ${topY} L ${cx - rx} ${bottomY} A ${rx} ${ry} 0 0 0 ${cx + rx} ${bottomY} L ${cx + rx} ${topY} A ${rx} ${ry} 0 0 1 ${cx - rx} ${topY}`}
        fill="white"
        stroke={stroke}
        strokeWidth={selected ? 2.5 : 1.5}
      />
      {[0.28, 0.52, 0.76].map((t) => {
        const y = topY + (bottomY - topY) * t;
        return (
          <path
            key={t}
            d={`M ${cx - rx} ${y} A ${rx} ${ry} 0 0 0 ${cx + rx} ${y}`}
            stroke={`color-mix(in oklab, ${color} 30%, transparent)`}
            strokeWidth={1}
            fill="none"
          />
        );
      })}
      <ellipse
        cx={cx}
        cy={bottomY}
        rx={rx}
        ry={ry}
        fill="white"
        stroke={stroke}
        strokeWidth={selected ? 2.5 : 1.5}
      />
      <ellipse
        cx={cx}
        cy={topY}
        rx={rx}
        ry={ry}
        fill="white"
        stroke={stroke}
        strokeWidth={selected ? 2.5 : 1.5}
      />
    </svg>
  );
}

/* ------------------------- INSPECTOR ------------------------- */

