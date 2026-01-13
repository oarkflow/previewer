import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if (typeof window !== "undefined") {
    try {
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);
        // Expose to security layer (best-effort; absent in dev mode)
        (window as any).__UFV_PREVIEW_WS__ = ws;
        const heartbeat = window.setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send("ping");
            }
        }, 15000);

        window.addEventListener("beforeunload", () => {
            try {
                ws.send("closing");
            } catch {
                // ignore
            }
            ws.close();
        });

        ws.addEventListener("close", () => window.clearInterval(heartbeat));
        ws.addEventListener("error", () => window.clearInterval(heartbeat));
    } catch {
        // If the websocket endpoint is unavailable (e.g., dev mode), fail silently.
    }
}

createRoot(document.getElementById("root")!).render(<App />);
