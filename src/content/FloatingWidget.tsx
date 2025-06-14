// src/content/FloatingWidget.tsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";

// Prevent TS error for React import
void React;

/**
 * Mounts the FloatingWidget in the page.
 */
export function mountFloatingWidget() {
  const container = document.createElement("div");
  container.id = "airpath-widget-root";
  document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);
  root.render(<FloatingWidget />);
}

/**
 * Scrapes "Active users in last 30 minutes" from GA4 UI.
 */
export function getRealtimeActiveUsersFromDOM(): string | null {
  const titleDivs = Array.from(document.querySelectorAll("div.counter-title"));
  for (const titleDiv of titleDivs) {
    const label = titleDiv.textContent?.trim();
    if (label === "Active users in last 30 minutes") {
      const container = titleDiv.closest(".counter-container");
      if (!container) continue;
      const counter = container.querySelector(".counter");
      if (counter && counter.textContent?.trim()) {
        return counter.textContent.trim();
      }
    }
  }
  return null;
}

/**
 * Scrapes top traffic sources by country from the GA4 'Country' table.
 * Returns a comma-separated list like 'United States: 65, Canada: 10'.
 */
export function getTrafficByCountryFromDOM(): string {
  const rows = Array.from(
    document.querySelectorAll(".counter-container ~ table tbody tr")
  );
  const pairs: string[] = [];
  for (const row of rows) {
    const countryCell = row.querySelector("td:nth-child(1)");
    const usersCell = row.querySelector("td:nth-child(2)");
    if (countryCell && usersCell) {
      const country = countryCell.textContent?.trim();
      const count = usersCell.textContent?.trim();
      if (country && count) {
        pairs.push(`${country}: ${count}`);
      }
    }
  }
  return pairs.length > 0 ? pairs.join(", ") : "(no country data found)";
}

function FloatingWidget() {
  // State hooks
  const [open, setOpen] = useState(false);
  const [activeUsers, setActiveUsers] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Chat state
  const [question, setQuestion] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [loadingChat, setLoadingChat] = useState(false);

  // Build system prompt from scraped data
  function buildSystemPrompt(): string {
    const users = activeUsers ?? "unknown";
    const traffic = getTrafficByCountryFromDOM();
    return `You are provided with real-time Google Analytics data:\n` +
           `Active users in last 30 minutes: ${users}\n` +
           `Traffic by country: ${traffic}\n` +
           `Use ONLY this data to answer the user's questions.`;
  }

  // Fetch AI insight when metrics update
  const fetchInsight = async () => {
    if (!activeUsers) return;
    setLoadingInsight(true);
    const prompt = buildSystemPrompt();
    try {
      const response = await fetch(
        "https://airpath-extension.vercel.app/api/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: prompt },
              { role: "user", content: "What might these numbers indicate?" }
            ]
          })
        }
      );
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content ?? "No response.";
      setInsight(reply);
    } catch (error) {
      console.error("Insight error:", error);
      setInsight("⚠️ Insight error.");
    }
    setLoadingInsight(false);
  };

  // Poll GA4 for updated metrics
  useEffect(() => {
    const interval = setInterval(() => {
      const users = getRealtimeActiveUsersFromDOM();
      console.log("🔄 Polling real-time count... found:", users);
      if (users !== null && users !== activeUsers) {
        setActiveUsers(users);
        chrome.storage.local.set({ activeUsers: users });
        fetchInsight();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeUsers]);

  // Handle chat submission
  const askChatGPT = async () => {
    const text = question.trim();
    if (!text) return;
    const prompt = buildSystemPrompt();
    setChatHistory((prev) => [...prev, { role: "user", content: text }]);
    setLoadingChat(true);
    try {
      const response = await fetch(
        "https://airpath-extension.vercel.app/api/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: prompt },
              ...chatHistory,
              { role: "user", content: text }
            ]
          })
        }
      );
      const data = await response.json();
      const assistantReply = data.choices?.[0]?.message?.content ?? "";
      setChatHistory((prev) => [...prev, { role: "assistant", content: assistantReply }]);
    } catch (error) {
      console.error("Chat error:", error);
    }
    setLoadingChat(false);
    setQuestion("");
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] font-sans"
      style={{ fontFamily: "system-ui" }}
    >
      {open ? (
        <div className="w-96 bg-white border rounded shadow-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold">Airpath Insights & Chat</h2>
            <button onClick={() => setOpen(false)} className="text-sm">✕</button>
          </div>
          {/* Stats & Insight */}
          <div className="mb-4 text-sm space-y-1">
            <div>Active users: {activeUsers ?? "Loading..."}</div>
            <div>{loadingInsight ? "🔄 Generating insight..." : insight ?? "No insight yet."}</div>
          </div>
          {/* Chat history */}
          <div className="overflow-auto max-h-40 mb-2 text-sm">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`mb-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                <span className={msg.role === "user" ? "font-semibold" : ""}>
                  {msg.content}
                </span>
              </div>
            ))}
          </div>
          {/* Input */}
          <textarea
            className="w-full p-1 border border-gray-300 rounded mb-2 text-sm"
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
          />
          <button
            onClick={askChatGPT}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded w-full"
            disabled={loadingChat}
          >
            {loadingChat ? "Thinking..." : "Send"}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full"
        >
          ✦ Airpath
        </button>
      )}
    </div>
  );
}

export default FloatingWidget;
