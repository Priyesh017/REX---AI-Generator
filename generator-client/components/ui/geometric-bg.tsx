"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const HeroBackground = () => {
  return (
    <div className="fixed inset-0 -z-0 overflow-hidden bg-[#030303] max-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />

      {shapes.map((shape, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: -150, rotate: shape.rotate - 15 }}
          animate={{ opacity: 1, y: 0, rotate: shape.rotate }}
          transition={{
            duration: 2.4,
            delay: shape.delay,
            ease: [0.23, 0.86, 0.39, 0.96],
            opacity: { duration: 1.2 },
          }}
          className={cn("absolute", shape.className)}
        >
          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ width: shape.width, height: shape.height }}
            className="relative"
          >
            <div
              className={cn(
                "absolute inset-0 rounded-full bg-gradient-to-r to-transparent",
                shape.gradient,
                "backdrop-blur-[2px] border-2 border-white/[0.15]",
                "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
                "after:absolute after:inset-0 after:rounded-full after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"
              )}
            />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
};

export default HeroBackground;

const shapes = [
  {
    delay: 0.3,
    width: 600,
    height: 140,
    rotate: 12,
    gradient: "from-indigo-500/[0.15]",
    className: "left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]",
  },
  {
    delay: 0.5,
    width: 500,
    height: 120,
    rotate: -15,
    gradient: "from-rose-500/[0.15]",
    className: "right-[-5%] md:right-[0%] top-[70%] md:top-[65%]",
  },
  {
    delay: 0.4,
    width: 300,
    height: 80,
    rotate: -8,
    gradient: "from-violet-500/[0.15]",
    className: "left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]",
  },
  {
    delay: 0.6,
    width: 200,
    height: 60,
    rotate: 20,
    gradient: "from-amber-500/[0.15]",
    className: "right-[15%] md:right-[20%] top-[10%] md:top-[15%]",
  },
  {
    delay: 0.7,
    width: 150,
    height: 40,
    rotate: -25,
    gradient: "from-cyan-500/[0.15]",
    className: "left-[20%] md:left-[25%] top-[5%] md:top-[10%]",
  },
];
