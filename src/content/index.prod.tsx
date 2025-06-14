// src/content/index.prod.tsx
// Production entrypoint: mounts into a Shadow DOM and injects compiled CSS
import { createRoot } from "react-dom/client";
import FloatingWidget from "./FloatingWidget";

/**
 * Mounts the FloatingWidget component inside an isolated Shadow DOM.
 * Manually injects content.css, then clones any Vite-generated <link> tags
 * so that Tailwind/DaisyUI styles apply inside the Shadow Tree.
 */
function mount() {
  // 1️⃣ Create a host container in the page
  const host = document.createElement("div");
  host.id = "airpath-root";
  document.body.appendChild(host);

  // 2️⃣ Attach a Shadow DOM to isolate styles
  const shadowRoot = host.attachShadow({ mode: "open" });

  // 2.a️⃣ Inject our compiled Tailwind CSS into the shadow
  const styleLink = document.createElement("link");
  styleLink.rel = "stylesheet";
  styleLink.href = chrome.runtime.getURL("content.css");
  shadowRoot.appendChild(styleLink);

  // 3️⃣ Copy any compiled CSS <link> tags (Vite assets) into the shadow
  document
    .querySelectorAll<HTMLLinkElement>("link[rel='stylesheet']")
    .forEach((link) => {
      if (link.href.includes("assets/")) {
        const clone = document.createElement("link");
        clone.rel = "stylesheet";
        clone.href = link.href;
        shadowRoot.appendChild(clone);
      }
    });

  // 4️⃣ Render React content inside the Shadow DOM
  const root = createRoot(shadowRoot as any);
  root.render(<FloatingWidget />);
}

// Wait for page load, then mount
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
