// src/content/App.tsx
import ConversationHistory from "./ConversationHistory";

export default function App() {
  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h1>Airpath Overlay</h1>
      <ConversationHistory />
    </div>
  );
}
