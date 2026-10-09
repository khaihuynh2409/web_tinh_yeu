"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmContextType = (messageOrOptions: string | ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextType>(() => Promise.resolve(false));

export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<(value: boolean) => void>();

  const confirm = (opts: string | ConfirmOptions) => {
    if (typeof opts === "string") {
      setOptions({ message: opts });
    } else {
      setOptions(opts);
    }
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolver?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolver?.(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {isOpen && options && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100000,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem"
        }}>
          <div style={{
            background: "var(--color-surface)", padding: "1.5rem",
            borderRadius: "20px", maxWidth: "320px", width: "100%",
            boxShadow: "var(--shadow-lg)", border: "1px solid var(--color-border)",
            animation: "modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            {options.title && (
              <h3 style={{ margin: "0 0 0.75rem 0", color: "var(--color-text)", fontSize: "1.1rem" }}>{options.title}</h3>
            )}
            <p style={{ margin: "0 0 1.5rem 0", color: "var(--color-text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
              {options.message}
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={handleCancel} style={{
                padding: "0.6rem 1rem", borderRadius: "10px",
                background: "var(--color-bg-alt)", border: "none", color: "var(--color-text)",
                fontWeight: 600, cursor: "pointer", flex: 1
              }}>
                {options.cancelText || "Hủy"}
              </button>
              <button onClick={handleConfirm} style={{
                padding: "0.6rem 1rem", borderRadius: "10px",
                background: "var(--color-primary)", border: "none", color: "var(--color-text)",
                fontWeight: 600, cursor: "pointer", flex: 1
              }}>
                {options.confirmText || "Đồng ý"}
              </button>
            </div>
          </div>
          <style>{`
            @keyframes modalIn {
              from { opacity: 0; transform: scale(0.95) translateY(10px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
