"use client";

import { useEffect, useState } from "react";
import { SignIn, SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function AuthModal({ isOpen, onClose }: Props) {
  const [tab, setTab] = useState<"signIn" | "signUp">("signIn");

  // ESC key closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div
              className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Tab Switcher */}
              <div className="mb-4 flex items-center justify-center gap-4">
                <button
                  onClick={() => setTab("signIn")}
                  className={`text-sm px-4 py-2 rounded-lg transition-all ${
                    tab === "signIn"
                      ? "bg-zinc-800 text-white font-semibold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setTab("signUp")}
                  className={`text-sm px-4 py-2 rounded-lg transition-all ${
                    tab === "signUp"
                      ? "bg-zinc-800 text-white font-semibold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Clerk Component */}
              {tab === "signIn" ? (
                <SignIn
                  routing="hash"
                  appearance={{
                    baseTheme: dark,
                    elements: {
                      card: "bg-zinc-900 text-white rounded-2xl",
                      headerTitle: "text-white",
                      headerSubtitle: "text-zinc-400",
                      formFieldInput:
                        "bg-zinc-800 text-white border border-zinc-700",
                      formButtonPrimary:
                        "bg-blue-600 hover:bg-blue-700 text-white",
                    },
                  }}
                />
              ) : (
                <SignUp
                  routing="hash"
                  appearance={{
                    baseTheme: dark,
                    elements: {
                      card: "bg-zinc-900 text-white rounded-2xl",
                      headerTitle: "text-white",
                      headerSubtitle: "text-zinc-400",
                      formFieldInput:
                        "bg-zinc-800 text-white border border-zinc-700",
                      formButtonPrimary:
                        "bg-green-600 hover:bg-green-700 text-white",
                    },
                  }}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
