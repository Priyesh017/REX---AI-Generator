"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SignInButton, SignedOut, useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import type { Variants } from "framer-motion";
import { Loader2 } from "lucide-react";
import { getMenuItems } from "@/data";
import type { MenuItem } from "@/type";

const Navbar = () => {
  const { isSignedIn, getToken } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Fix hydration errors by ensuring we only render dynamic auth content on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch credits whenever the user signs in
  useEffect(() => {
    if (!mounted) return;
    
    const fetchCredits = async () => {
      if (!isSignedIn) {
        setCredits(null);
        return;
      }
      setLoading(true);
      try {
        const token = await getToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user-details`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setCredits(data.creditsLeft);
        }
      } catch (err) {
        console.error("Failed to fetch credits:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [isSignedIn, getToken, mounted]);

  const menuItems = getMenuItems(isSignedIn !== undefined ? isSignedIn : null);

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
          "absolute -inset-2 rounded-3xl z-0 pointer-events-none"
        )}
        variants={navGlowVariants}
      />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300 text-2xl font-bold px-2 ml-4 cursor-default">
            REX
          </div>
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
                      <div className="cursor-pointer">
                        <NavLink item={item} front />
                        <NavLink item={item} back />
                      </div>
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
        
        {/* credits display */}
        {mounted && isSignedIn && (
            <div className="flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1 rounded-full border border-white/5 mr-4 shadow-inner group">
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] group-hover:animate-pulse" />
              )}
              <span className="text-[11px] font-medium tracking-wider text-zinc-300 uppercase">
                {credits !== null ? `${credits}` : "---"}
              </span>
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
        "transition-colors duration-300 text-muted-foreground",
        getHoverTextClass(item.iconColor)
      )}
    >
      {item.icon}
    </span>
    <span className="hidden md:block group-hover:text-white transition-colors">
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
  initial: { rotateX: 0, opacity: 1, pointerEvents: "auto" as const },
  hover: { rotateX: -90, opacity: 0, pointerEvents: "none" as const },
};

const backVariants: Variants = {
  initial: { rotateX: 90, opacity: 0, pointerEvents: "none" as const },
  hover: { rotateX: 0, opacity: 1, pointerEvents: "auto" as const },
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

// function getGradientClass(): string {
//   return "bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-red-400/30";
// }