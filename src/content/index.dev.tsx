// Inject compiled Tailwind CSS
const styleLink = document.createElement("link");
styleLink.rel = "stylesheet";
styleLink.href = chrome.runtime.getURL("content.css"); // ✅ must match the root path
document.head.appendChild(styleLink);


import { mountFloatingWidget } from "./FloatingWidget";

console.log("✅ Airpath content script loaded!");

const isGA4Page = window.location.href.includes("analytics.google.com/analytics/web");

console.log("📊 GA4 page detected:", isGA4Page);

if (isGA4Page) {
  mountFloatingWidget();
}

console.log("🧠 Content script loaded");
