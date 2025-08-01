"use client";

import { motion } from "framer-motion";
import { SignInButton, SignedOut, useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import type { Variants } from "framer-motion";
import { Home, Coins, User, Sparkles, Settings } from "lucide-react";

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  gradient: string;
  iconColor: string;
}

const Navbar = () => {
  const { isSignedIn } = useAuth();

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
      icon: <Coins className="h-5 w-5" />,
      label: "Pricing",
      href: "/buy",
      gradient:
        "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
      iconColor: "text-orange-500",
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      label: "Generator",
      href: "/generate",
      gradient:
        "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
      iconColor: "text-green-500",
    },
    {
      icon: isSignedIn ? (
        <Settings className="h-5 w-5" />
      ) : (
        <User className="h-5 w-5" />
      ),
      label: isSignedIn ? "Profile" : "Login",
      href: isSignedIn ? "/profile" : "#",
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
                  style={{ background: item.gradient, opacity: 0 }}
                />

                {item.label === "Login" ? (
                  <>
                    <SignedOut>
                      <SignInButton mode="modal">
                        <button>
                          <NavLink item={item} front />
                          <NavLink item={item} back />
                        </button>
                      </SignInButton>
                    </SignedOut>
                  </>
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
        {/* <div className="text-muted-foreground px-4 py-2 min-w-max cursor-default">
          Credits: 1000
        </div> */}
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
      },
      {
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
    <span className="hidden md:block group-hover:text-muted">{item.label}</span>
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

function getHoverTextClass(color: string) {
  return (
    {
      "text-blue-500": "group-hover:text-blue-500",
      "text-orange-500": "group-hover:text-orange-500",
      "text-green-500": "group-hover:text-green-500",
      "text-red-500": "group-hover:text-red-500",
    }[color] || ""
  );
}

function getGradientClass() {
  return "via-blue-400/30 via-30% via-purple-400/30 via-60% via-red-400/30 via-90%";
}
