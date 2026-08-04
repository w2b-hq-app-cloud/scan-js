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
  const btnZoomIn = document.getElementById("btn-zoom-in");
  const btnZoomOut = document.getElementById("btn-zoom-out");
  const btnZoomReset = document.getElementById("btn-zoom-reset");
  const btnFit = document.getElementById("btn-fit");
  const btnShowSource = document.getElementById("btn-show-source");

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
    systemLabel.textContent = msg.system
      ? `${msg.system.name} · ${msg.system.id}`
      : "SCAN";
    canvas.innerHTML = msg.svg || "";
    if (!canvas.querySelector("svg") && msg.svg) {
      canvas.innerHTML = msg.svg.replace(/^<\?xml[^>]*>\s*/i, "");
    }
    requestAnimationFrame(fitView);
  }

  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== "object") return;
    if (msg.type === "render") onRender(msg);
    if (msg.type === "error") {
      setError(msg.message || "Preview failed");
      systemLabel.textContent = "SCAN";
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

  if (btnShowSource) {
    btnShowSource.addEventListener("click", () => {
      vscode.postMessage({ type: "showSource" });
    });
  }

  applyTransform();
  vscode.postMessage({ type: "ready" });
})();
