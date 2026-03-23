import { createRoot } from "react-dom/client";
import App from "./App";

// StrictMode intentionally removed: Phaser's Game instance doesn't survive
// React's double-invoke of effects (dev-only behavior of StrictMode).
createRoot(document.getElementById("root")!).render(<App />);
