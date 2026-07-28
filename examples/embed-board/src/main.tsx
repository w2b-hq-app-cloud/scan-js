import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { HostApp } from "./HostApp";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HostApp />
    <Toaster richColors position="bottom-right" />
  </StrictMode>,
);
