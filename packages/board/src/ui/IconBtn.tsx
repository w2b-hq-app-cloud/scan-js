// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./tooltip";

export function IconBtn({
  children,
  label,
  onClick,
  active,
  danger,
  variant,
  disabled,
  tooltipSide = "top",
  tooltip = true,
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  danger?: boolean;
  variant?: "ghost";
  disabled?: boolean;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  tooltip?: boolean;
}) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={`grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none ${
        active
          ? danger
            ? "bg-red-500/10 text-red-500"
            : "bg-primary/10 text-primary"
          : ""
      } ${variant === "ghost" ? "hover:bg-surface" : ""}`}
    >
      {children}
    </button>
  );
  if (!tooltip) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side={tooltipSide} sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

/* ------------------------- LEGEND + MINIMAP + TOAST ------------------------- */

