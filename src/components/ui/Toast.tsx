"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────

interface Toast {
  id: string;
  message: string;
  type: "error" | "success" | "info";
}

interface ToastContextValue {
  showToast: (message: string, type?: Toast["type"]) => void;
}

// ── Context ────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

// ── Provider ───────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback(
    (message: string, type: Toast["type"] = "error") => {
      const id = `toast-${++counterRef.current}`;
      setToasts((prev) => [...prev, { id, message, type }]);

      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext value={{ showToast }}>
      {children}

      {/* Toast container */}
      {toasts.length > 0 && (
        <div
          className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm"
          role="status"
          aria-live="polite"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={cn(
                "px-4 py-3 rounded-lg shadow-lg border text-sm flex items-start gap-2 animate-slide-in",
                toast.type === "error" &&
                  "bg-red-50 border-red-200 text-red-800",
                toast.type === "success" &&
                  "bg-green-50 border-green-200 text-green-800",
                toast.type === "info" &&
                  "bg-blue-50 border-blue-200 text-blue-800"
              )}
            >
              <span className="flex-1">{toast.message}</span>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-current opacity-50 hover:opacity-100 flex-shrink-0"
                aria-label="Dismiss notification"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext>
  );
}
