import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/vilatok-tokens.css";
import { initSentry, captureException } from "./lib/sentry";

// Init Sentry o mais cedo possivel — captura erros desde o primeiro paint.
// Vira no-op silencioso em dev sem VITE_SENTRY_DSN configurado.
void initSentry();

if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (e) => {
    captureException(e.reason, { source: "unhandledrejection" });
  });
}

try {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("Root element not found");
  }

  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error: any) {
  captureException(error, { source: "main_bootstrap" });
  console.error("Failed to render app:", error);
}
