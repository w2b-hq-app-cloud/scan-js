// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL
/* global acquireVsCodeApi */
(function () {
  const vscode = acquireVsCodeApi();

  const canvas = document.getElementById("canvas");
  const viewport = document.getElementById("viewport");
  const errorEl = document.getElementById("error");
  const hintEl = document.getElementById("hint");
  const systemLabel = document.getElementById("system-label");
  const detailsEmpty = document.getElementById("details-empty");
  const detailsBody = document.getElementById("details-body");
  const btnZoomIn = document.getElementById("btn-zoom-in");
  const btnZoomOut = document.getElementById("btn-zoom-out");
  const btnZoomReset = document.getElementById("btn-zoom-reset");
  const btnFit = document.getElementById("btn-fit");

  /** @type {{ nodes: any[], edges: any[] }} */
  let graph = { nodes: [], edges: [] };
  let scale = 1;
  let tx = 24;
  let ty = 24;
  let panning = false;
  let lastX = 0;
  let lastY = 0;

  function applyTransform() {
    canvas.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    btnZoomReset.textContent = `${Math.round(scale * 100)}%`;
  }

  function setError(message) {
    errorEl.textContent = message || "";
    errorEl.classList.toggle("hidden", !message);
    canvas.classList.toggle("hidden", !!message);
    hintEl.classList.toggle("hidden", !!message);
  }

  function clearSelection() {
    canvas.querySelectorAll(".selected").forEach((el) => el.classList.remove("selected"));
  }

  function showEmptyDetails() {
    detailsEmpty.classList.remove("hidden");
    detailsBody.classList.add("hidden");
    detailsBody.innerHTML = "";
  }

  function row(label, value) {
    if (value == null || value === "") return "";
    return `<dt>${escapeHtml(label)}</dt><dd>${value}</dd>`;
  }

  function chips(items) {
    if (!items || !items.length) return "<span class=\"muted\">—</span>";
    return items
      .map((t) => `<span class="chip">${escapeHtml(t)}</span>`)
      .join("");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showNode(node) {
    detailsEmpty.classList.add("hidden");
    detailsBody.classList.remove("hidden");
    const consumes = (node.consumes || []).map(
      (p) => `${p.label}${p.protocol ? ` (${p.protocol})` : ""}`,
    );
    const exposes = (node.exposes || []).map(
      (p) => `${p.label}${p.protocol ? ` (${p.protocol})` : ""}`,
    );
    detailsBody.innerHTML = `<dl>
      ${row("Name", escapeHtml(node.title))}
      ${row("Id", `<code>${escapeHtml(node.id)}</code>`)}
      ${row("Kind", escapeHtml(node.kind))}
      ${row("Technology", escapeHtml(node.tech || ""))}
      ${row("Subtitle", escapeHtml(node.subtitle || ""))}
      ${row("Description", escapeHtml(node.description || ""))}
      ${row("Notes", escapeHtml(node.notes || ""))}
      ${row("Status", escapeHtml(node.status || ""))}
      ${row("Warning", escapeHtml(node.warn || ""))}
      ${row("Consumes", chips(consumes))}
      ${row("Exposes", chips(exposes))}
    </dl>`;
  }

  function showEdge(edge) {
    detailsEmpty.classList.add("hidden");
    detailsBody.classList.remove("hidden");
    const fromNode = graph.nodes.find((n) => n.id === edge.from);
    const toNode = graph.nodes.find((n) => n.id === edge.to);
    detailsBody.innerHTML = `<dl>
      ${row("Connection", escapeHtml(edge.label || edge.id))}
      ${row("Id", `<code>${escapeHtml(edge.id)}</code>`)}
      ${row("Type", escapeHtml(edge.kind))}
      ${row("From", escapeHtml(fromNode ? `${fromNode.title} (${edge.from})` : edge.from))}
      ${row("To", escapeHtml(toNode ? `${toNode.title} (${edge.to})` : edge.to))}
      ${row("From port", escapeHtml(edge.fromPort || ""))}
      ${row("To port", escapeHtml(edge.toPort || ""))}
      ${row("Contract", escapeHtml(edge.contract || ""))}
      ${row("Operations", chips(edge.operations || []))}
    </dl>`;
  }

  function selectById(kind, id) {
    clearSelection();
    const sel =
      kind === "node"
        ? canvas.querySelector(`[data-node="${CSS.escape(id)}"]`)
        : canvas.querySelector(`[data-edge="${CSS.escape(id)}"]`);
    if (sel) sel.classList.add("selected");
    if (kind === "node") {
      const node = graph.nodes.find((n) => n.id === id);
      if (node) showNode(node);
      else showEmptyDetails();
    } else {
      const edge = graph.edges.find((e) => e.id === id);
      if (edge) showEdge(edge);
      else showEmptyDetails();
    }
  }

  function fitView() {
    const svg = canvas.querySelector("svg");
    if (!svg) return;
    const vb = svg.viewBox && svg.viewBox.baseVal;
    const w = vb && vb.width ? vb.width : Number(svg.getAttribute("width")) || 800;
    const h = vb && vb.height ? vb.height : Number(svg.getAttribute("height")) || 600;
    const pad = 32;
    const vw = viewport.clientWidth - pad * 2;
    const vh = viewport.clientHeight - pad * 2;
    if (vw <= 0 || vh <= 0) return;
    scale = Math.min(vw / w, vh / h, 1.5);
    tx = pad + (vw - w * scale) / 2;
    ty = pad + (vh - h * scale) / 2;
    applyTransform();
  }

  function onRender(msg) {
    setError("");
    graph = { nodes: msg.nodes || [], edges: msg.edges || [] };
    systemLabel.textContent = msg.system
      ? `${msg.system.name} · ${msg.system.id}`
      : "SCAN";
    canvas.innerHTML = msg.svg || "";
    // Strip XML declaration if present for innerHTML safety
    const svg = canvas.querySelector("svg");
    if (!svg && msg.svg) {
      canvas.innerHTML = msg.svg.replace(/^<\?xml[^>]*>\s*/i, "");
    }
    showEmptyDetails();
    clearSelection();
    requestAnimationFrame(fitView);
  }

  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== "object") return;
    if (msg.type === "render") onRender(msg);
    if (msg.type === "error") {
      setError(msg.message || "Preview failed");
      systemLabel.textContent = "SCAN";
      showEmptyDetails();
    }
  });

  viewport.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    panning = true;
    lastX = e.clientX;
    lastY = e.clientY;
    viewport.classList.add("panning");
    viewport.setPointerCapture(e.pointerId);
  });

  viewport.addEventListener("pointermove", (e) => {
    if (!panning) return;
    tx += e.clientX - lastX;
    ty += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    applyTransform();
  });

  function endPan(e) {
    if (!panning) return;
    panning = false;
    viewport.classList.remove("panning");
    try {
      viewport.releasePointerCapture(e.pointerId);
    } catch (_) {
      /* ignore */
    }
  }

  viewport.addEventListener("pointerup", endPan);
  viewport.addEventListener("pointercancel", endPan);

  viewport.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const prev = scale;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      scale = Math.min(4, Math.max(0.15, scale * factor));
      tx = mx - ((mx - tx) * scale) / prev;
      ty = my - ((my - ty) * scale) / prev;
      applyTransform();
    },
    { passive: false },
  );

  canvas.addEventListener("click", (e) => {
    const node = e.target.closest("[data-node]");
    if (node) {
      e.stopPropagation();
      selectById("node", node.getAttribute("data-node"));
      return;
    }
    const edge = e.target.closest("[data-edge]");
    if (edge) {
      e.stopPropagation();
      selectById("edge", edge.getAttribute("data-edge"));
      return;
    }
    clearSelection();
    showEmptyDetails();
  });

  // Avoid treating a click as a pan selection clear fighting with click
  let moved = false;
  viewport.addEventListener("pointerdown", () => {
    moved = false;
  });
  viewport.addEventListener("pointermove", () => {
    if (panning) moved = true;
  });

  btnZoomIn.addEventListener("click", () => {
    scale = Math.min(4, scale * 1.15);
    applyTransform();
  });
  btnZoomOut.addEventListener("click", () => {
    scale = Math.max(0.15, scale / 1.15);
    applyTransform();
  });
  btnZoomReset.addEventListener("click", () => {
    scale = 1;
    tx = 24;
    ty = 24;
    applyTransform();
  });
  btnFit.addEventListener("click", fitView);

  applyTransform();
  vscode.postMessage({ type: "ready" });
})();
