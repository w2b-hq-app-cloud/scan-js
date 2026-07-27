export type NodeKind =
  | "service"
  | "external"
  | "database"
  | "event"
  | "search"
  | "agent"
  | "repo";

export type Port = {
  id: string;
  side: "in" | "out";
  label: string;
  protocol?: string;
};

export type SphereNode = {
  id: string;
  kind: NodeKind;
  title: string;
  subtitle?: string;
  tech?: string;
  /** Optional icon override: Lucide name, https URL, or data:image URL. */
  icon?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  group?: string;
  consumes?: Port[];
  exposes?: Port[];
  repo?: string;
  /** Resolved browse URL for `repo` when known (e.g. GitHub). */
  repoUrl?: string;
  status?: "ok" | "warn";
  warn?: string;
};

export type SphereEdge = {
  id: string;
  from: string;
  to: string;
  fromSide?: "l" | "r" | "t" | "b";
  toSide?: "l" | "r" | "t" | "b";
  kind: "rest" | "grpc" | "async" | "db" | "stream" | "git" | "flow";
  label?: string;
  contract?: string;
  fromPort?: string;
  toPort?: string;
  /** Endpoints / RPCs / topics shown on hover and in the inspector */
  operations?: string[];
};

export type SphereGroup = {
  id: string;
  title: string;
  tag?: string;
  kind?: "trust" | "runtime";
  /** Optional icon override: Lucide name, https URL, or data:image URL. */
  icon?: string;
  members?: string[];
  x: number;
  y: number;
  w: number;
  h: number;
  color: "svc" | "agent";
};

export type BoardGraph = {
  nodes: SphereNode[];
  edges: SphereEdge[];
  groups: SphereGroup[];
};
