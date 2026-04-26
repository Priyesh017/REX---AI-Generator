"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { SignInButton, SignedOut, useAuth, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import type { Variants } from "framer-motion";
import { Loader2 } from "lucide-react";
import { menuItems } from "@/data";
import type { MenuItem } from "@/type";

const Navbar = () => {
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [webhookTriggered, setWebhookTriggered] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Trigger webhook after new user signs in
  const triggerWebhook = useCallback(async () => {
    if (!user?.id) {
      console.error("User ID is missing");
      return;
    }

    // Check if API URL is configured
    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.error("API URL not configured");
      return;
    }

    // Prevent multiple webhook calls
    if (webhookTriggered) {
      return;
    }

    try {
      setLoading(true);
      setWebhookTriggered(true);

      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Sending request to the API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clerk-webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
        signal: abortController.signal,
      });

      // Check if the response is successful
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle response data
      const data = await response.json();
      console.log("User webhook triggered successfully!", data);
    } catch (error) {
      // Don't log error if request was aborted
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error("Error triggering webhook:", error);
        // Reset webhook triggered state on error to allow retry
        setWebhookTriggered(false);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, webhookTriggered]);

  // Trigger webhook once the user is signed in
  useEffect(() => {
    if (isSignedIn && user?.id && !webhookTriggered) {
      triggerWebhook();
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isSignedIn, user?.id, webhookTriggered, triggerWebhook]);

  return (
    <motion.nav
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] p-2 w-fit rounded-2xl bg-gradient-to-b from-zinc-900/20 to-zinc-900/10 backdrop-blur-xl border border-border/20 shadow-lg overflow-hidden"
      whileHover="hover"
      custom={4}
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className={cn(
          "absolute -inset-2 rounded-3xl z-0 pointer-events-none",
          getGradientClass()
        )}
        variants={navGlowVariants}
      />

      <div className="flex items-center justify-between relative z-10">
        <div className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300 text-2xl font-bold px-2 mx-4 cursor-default">
          REX
        </div>

        <ul className="flex items-center gap-2">
          {menuItems.map((item, idx) => (
            <motion.li key={item.href || idx} className="relative">
              <motion.div
                className="block rounded-xl group relative"
                style={{ perspective: "600px" }}
                whileHover="hover"
                initial="initial"
              >
                <motion.div
                  className="absolute inset-0 z-0 pointer-events-none rounded-xl"
                  variants={glowVariants}
                  style={{ 
                    background: item.gradient || "transparent", 
                    opacity: 0 
                  }}
                />

                {item.label === "Login" ? (
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button type="button" aria-label="Sign in">
                        <NavLink item={item} front />
                        <NavLink item={item} back />
                      </button>
                    </SignInButton>
                  </SignedOut>
                ) : (
                  <>
                    <NavLink item={item} front />
                    <NavLink item={item} back />
                  </>
                )}
              </motion.div>
            </motion.li>
          ))}
        </ul>

        {/* Optional credits display */}
        {/* <div className="text-muted-foreground px-4 py-2 min-w-max cursor-default">
          Credits: 1000
        </div> */}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-300 ml-4">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            <span>Fetching data...</span>
          </div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;

interface NavLinkProps {
  item: MenuItem;
  front?: boolean;
  back?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({
  item,
  front = false,
  back = false,
}) => (
  <motion.a
    href={item.href}
    className={cn(
      "flex items-center gap-2 px-4 py-2 z-50 bg-transparent text-muted-foreground transition-colors rounded-xl",
      {
        "relative inset-auto": front,
        "absolute inset-0": back,
      }
    )}
    variants={front ? itemVariants : backVariants}
    transition={sharedTransition}
    style={{
      transformStyle: "preserve-3d",
      transformOrigin: front ? "center bottom" : "center top",
      rotateX: back ? 90 : undefined,
    }}
  >
    <span
      className={cn(
        "transition-colors duration-300 text-muted",
        getHoverTextClass(item.iconColor)
      )}
    >
      {item.icon}
    </span>
    <span className="hidden md:block group-hover:text-muted">
      {item.label}
    </span>
  </motion.a>
);

// Motion variants
const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      delay: 0.5 + i * 0.2,
      ease: [0.25, 0.4, 0.25, 1],
    },
  }),
};

const itemVariants: Variants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
};

const backVariants: Variants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
};

const glowVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
    },
  },
};

const navGlowVariants: Variants = {
  initial: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
};

const sharedTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20,
  duration: 0.5,
};

// Helper functions
function getHoverTextClass(color?: string): string {
  if (!color) return "";
  
  const colorMap: Record<string, string> = {
    "text-blue-500": "group-hover:text-blue-500",
    "text-orange-500": "group-hover:text-orange-500",
    "text-green-500": "group-hover:text-green-500",
    "text-red-500": "group-hover:text-red-500",
  };
  
  return colorMap[color] || "";
}

function getGradientClass(): string {
  return "bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-red-400/30";
}