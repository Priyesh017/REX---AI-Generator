"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { SignInButton, SignedOut, useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import type { Variants } from "framer-motion";
import {
  Home,
  Coins,
  User,
  Sparkles,
  Settings,
  Loader2,
  Zap,
  Compass,
} from "lucide-react";
import { creditsApi } from "@/lib/api/credits";
import { useQuery } from "@tanstack/react-query";

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  gradient: string;
  iconColor: string;
}

const Navbar = () => {
  const { isSignedIn, getToken } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: credits, isLoading: loading } = useQuery({
    queryKey: ["credits"],
    queryFn: async () => {
      if (!isSignedIn) return null;
      const api = creditsApi(getToken);
      return api.getCredits();
    },
    enabled: mounted && isSignedIn,
    staleTime: 1000 * 60, // 1 minute
  });

  const menuItems = [
    {
      icon: <Home className="h-5 w-5" />,
      label: "Home",
      href: "/",
      gradient:
        "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
      iconColor: "text-blue-500",
    },
    {
      icon: <Compass className="h-5 w-5" />,
      label: "Explore",
      href: "/explore",
      gradient:
        "radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(147,51,234,0.06) 50%, rgba(126,34,206,0) 100%)",
      iconColor: "text-purple-500",
    },
    {
      icon: <Coins className="h-5 w-5" />,
      label: "Pricing",
      href: "/buy",
      gradient:
        "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
      iconColor: "text-orange-500",
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      label: "Studio",
      href: "/studio",
      gradient:
        "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
      iconColor: "text-green-500",
    },
    {
      icon:
        isSignedIn === null ? (
          <User className="h-5 w-5" />
        ) : isSignedIn ? (
          <Settings className="h-5 w-5" />
        ) : (
          <User className="h-5 w-5" />
        ),
      label: isSignedIn === null ? "Login" : isSignedIn ? "Profile" : "Login",
      href: isSignedIn === null ? "#" : isSignedIn ? "/profile" : "#",
      gradient:
        "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
      iconColor: "text-red-500",
    },
  ];

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
          getGradientClass(),
        )}
        variants={navGlowVariants}
      />

      <div className="flex items-center justify-between relative z-10">
        <Link href="/">
          <div className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300 text-2xl font-bold px-2 mx-4 cursor-pointer select-none">
            REX
          </div>
        </Link>

        <ul className="flex items-center gap-1">
          {menuItems.map((item, idx) => {
            const isActive =
              item.href !== "#" &&
              (item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href));

            return (
              <motion.li key={idx} className="relative">
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
                      background: item.gradient,
                      opacity: isActive ? 0.4 : 0,
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
            className="flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-white/5 mr-4 ml-2 shadow-inner group hover:border-indigo-500/30 transition-all"
            title="Credits remaining"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
            ) : (
              <Zap className={cn("w-3 h-3 text-indigo-400")} />
            )}
            <span className="text-[11px] font-semibold tracking-wider text-zinc-300 uppercase">
              {credits !== null ? credits : "—"}
            </span>
          </Link>
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
        isActive ? "text-white" : "text-zinc-500",
        {
          "relative inset-auto": front,
          "absolute inset-0": back,
        },
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
          isActive ? item.iconColor : "text-zinc-500",
          getHoverTextClass(item.iconColor),
        )}
      >
        {item.icon}
      </span>
      <span
        className={cn(
          "hidden md:block transition-colors",
          isActive ? "text-white" : "group-hover:text-zinc-300",
        )}
      >
        {item.label}
      </span>
    </motion.div>
  );

  if (item.href === "#") return content;
  return <Link href={item.href}>{content}</Link>;
};

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

function getHoverTextClass(color: string) {
  return (
    {
      "text-blue-500": "group-hover:text-blue-500",
      "text-purple-500": "group-hover:text-purple-500",
      "text-orange-500": "group-hover:text-orange-500",
      "text-green-500": "group-hover:text-green-500",
      "text-red-500": "group-hover:text-red-500",
    }[color] || ""
  );
}

function getGradientClass() {
  return "via-blue-400/30 via-30% via-purple-400/30 via-60% via-red-400/30 via-90%";
}
