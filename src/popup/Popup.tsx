// src/popup/Popup.tsx
import { useState, useEffect } from "react";

export default function Popup() {
  // — State hooks —
  const [activeUsers, setActiveUsers] = useState<string | null>(null);

  // On-mount: load latest activeUsers from storage and subscribe to changes
  useEffect(() => {
    // Read stored count once
    chrome.storage.local.get("activeUsers", (result) => {
      setActiveUsers(result.activeUsers ?? null);
    });
    // Listen for updates
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.activeUsers) {
        setActiveUsers(changes.activeUsers.newValue || null);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  return (
    <div className="p-4 w-[300px] font-sans text-gray-800">
      <h1 className="text-lg font-bold mb-3">Airpath Metrics</h1>
      <div className="text-sm">
        Active users right now:{' '}
        <span className="font-semibold">
          {activeUsers !== null ? activeUsers : 'N/A'}
        </span>
      </div>
    </div>
  );
}
