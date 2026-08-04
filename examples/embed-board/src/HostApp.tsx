/**
 * Host-page rehearsal for embedding `@spherescan/board` (private until 0.2).
 *
 * Load patterns shown here:
 * 1. Bundled YAML via Vite `?raw` (preferred for known diagrams at build time)
 * 2. User picks a `.scan.yaml` from disk (FileReader / input[type=file])
 */
import { useCallback, useMemo, useState } from "react";
import BoardApp from "@spherescan/board";

// 1) Preload a sample from examples/architectures (not a product diagram).
import bundledYaml from "../../architectures/hello-scan.scan.yaml?raw";

type Source = "bundled" | "disk";

export function HostApp() {
  const [source, setSource] = useState<Source>("bundled");
  const [diskYaml, setDiskYaml] = useState<string | null>(null);
  const [diskName, setDiskName] = useState<string | null>(null);

  const activeYaml = useMemo(() => {
    if (source === "disk" && diskYaml) return diskYaml;
    return bundledYaml;
  }, [source, diskYaml]);

  const boardKey = useMemo(
    () => `${source}:${diskName ?? "hello-scan.scan.yaml"}:${activeYaml.length}`,
    [source, diskName, activeYaml],
  );

  const onPickFile = useCallback(async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    setDiskYaml(text);
    setDiskName(file.name);
    setSource("disk");
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--background)] text-[var(--foreground)]">
      <header className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Host product page (rehearsal)
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Hello SCAN architecture</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--muted-foreground)]">
          This is ordinary host UI. Below, the interactive SCAN board is embedded via{" "}
          <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[12px]">
            @spherescan/board
          </code>
          . The diagram was preloaded from{" "}
          <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[12px]">
            examples/architectures/hello-scan.scan.yaml
          </code>{" "}
          (Vite <code className="text-[12px]">?raw</code> import). You can also load any file from
          disk with the picker.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 ${
              source === "bundled"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "border border-[var(--border)] hover:bg-[var(--muted)]"
            }`}
            onClick={() => setSource("bundled")}
          >
            Use bundled YAML
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[var(--border)] px-3 py-1.5 hover:bg-[var(--muted)]">
            <span>Load from disk…</span>
            <input
              type="file"
              accept=".yaml,.yml,.scan.yaml,.scan"
              className="hidden"
              onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <span className="text-[var(--muted-foreground)]">
            Active:{" "}
            <strong className="text-[var(--foreground)]">
              {source === "disk" && diskName ? diskName : "hello-scan.scan.yaml (bundled)"}
            </strong>
          </span>
        </div>
      </header>

      {/*
        Board fills remaining viewport. Hosts usually give an explicit height
        (e.g. calc(100vh - header) or a fixed panel).
      */}
      <main className="min-h-0 flex-1">
        <BoardApp key={boardKey} fill="parent" initialYaml={activeYaml} />
      </main>
    </div>
  );
}
