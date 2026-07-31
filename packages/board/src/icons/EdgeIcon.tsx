// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { ArrowRight, FileCode2, Github, Radio, Database as DbIcon } from "lucide-react";
import type { SphereEdge } from "@spherescan/viewer";

export function EdgeIcon({ kind }: { kind: SphereEdge["kind"] }) {
  const map = {
    rest: { icon: FileCode2, color: "text-foreground" },
    grpc: { icon: FileCode2, color: "text-foreground" },
    async: { icon: Radio, color: "text-event" },
    stream: { icon: Radio, color: "text-event" },
    db: { icon: DbIcon, color: "text-agent" },
    git: { icon: Github, color: "text-foreground" },
    flow: { icon: ArrowRight, color: "text-agent" },
  } as const;
  const { icon: Icon, color } = map[kind];
  return <Icon className={`h-3 w-3 ${color}`} />;
}
