"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { SignInButton, SignedOut, useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Loader2, Zap } from "lucide-react";
import { getMenuItems } from "@/data";
import type { MenuItem } from "@/type";
import { creditsApi } from "@/lib/api/credits";

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

const navGlowVariants: Variants = {
  hover: {
    opacity: 1,
    scale: 1.05,
    transition: { duration: 0.4 },
  },
};

const glowVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

const itemVariants: Variants = {
  initial: { rotateX: 0, y: 0 },
  hover: { rotateX: -90, y: -5 },
};

const backVariants: Variants = {
  initial: { rotateX: 90, y: 5 },
  hover: { rotateX: 0, y: 0 },
};

const sharedTransition = {
  type: "spring",
  stiffness: 260,
  damping: 20,
} as const;

const getHoverTextClass = (colorClass: string) => {
  return colorClass.replace("text-", "group-hover:text-");
};

const Navbar = () => {
  const { isSignedIn, getToken } = useAuth();
  const pathname = usePathname();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isSignedIn) {
      setCredits(null);
      return;
    }

    let cancelled = false;
    const fetchCredits = async () => {
      setLoading(true);
      try {
        const api = creditsApi(getToken);
        const creditsLeft = await api.getCredits();
        if (!cancelled) setCredits(creditsLeft);
      } catch {
        if (!cancelled) setCredits(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCredits();
    return () => { cancelled = true; };
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
        className={cn("absolute -inset-2 rounded-3xl z-0 pointer-events-none")}
        variants={navGlowVariants}
      />

      <div className="flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300 text-2xl font-bold px-2 ml-4 cursor-pointer select-none">
            REX
          </div>
        </Link>

        <ul className="flex items-center gap-1">
          {menuItems.map((item) => {
            const isActive =
              item.href !== "#" &&
              (item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href));
            return (
              <motion.li key={`${item.label}-${item.href}`} className="relative">
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
                      opacity: isActive ? 0.5 : 0,
                    }}
                  />

                  {item.label === "Login" ? (
                    <SignedOut>
                      <SignInButton mode="modal">
                        <div className="cursor-pointer">
                          <NavLink item={item} front isActive={isActive} />
                          <NavLink item={item} back isActive={isActive} />
                        </div>
                      </SignInButton>
                    </SignedOut>
                  ) : (
                    <>
                      <NavLink item={item} front isActive={isActive} />
                      <NavLink item={item} back isActive={isActive} />
                    </>
                  )}
                </motion.div>
              </motion.li>
            );
          })}
        </ul>

        {mounted && isSignedIn && (
          <Link
            href="/buy"
            className="flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-white/5 mr-4 shadow-inner group hover:border-indigo-500/30 transition-all"
            title="Credits remaining — click to buy more"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
            ) : (
              <Zap
                className={cn(
                  "w-3 h-3 transition-colors",
                  credits !== null && credits <= 2
                    ? "text-orange-400"
                    : "text-indigo-400"
                )}
              />
            )}
            <span
              className={cn(
                "text-[11px] font-semibold tracking-wider uppercase transition-colors",
                credits !== null && credits <= 2
                  ? "text-orange-300"
                  : "text-zinc-300"
              )}
            >
              {credits !== null ? credits : "—"}
            </span>
          </Link>
        )}
      </div>
    </motion.nav>
  );
};

interface NavLinkProps {
  item: MenuItem;
  front?: boolean;
  back?: boolean;
  isActive?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({
  item,
  front = false,
  back = false,
  isActive = false,
}) => {
  const content = (
    <motion.div
      className={cn(
        "flex items-center gap-2 px-4 py-2 z-50 bg-transparent transition-colors rounded-xl",
        isActive ? "text-white" : "text-muted-foreground",
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
          "transition-colors duration-300",
          isActive ? item.iconColor : "text-muted-foreground",
          getHoverTextClass(item.iconColor)
        )}
      >
        {item.icon}
      </span>
      <span className={cn("hidden md:block transition-colors", isActive ? "text-white" : "group-hover:text-white")}>
        {item.label}
      </span>
    </motion.div>
  );

  if (item.href === "#") return content;
  return <Link href={item.href}>{content}</Link>;
};

export default Navbar;