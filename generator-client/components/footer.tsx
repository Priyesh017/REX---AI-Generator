"use client";

import React from "react";

import { Instagram, Facebook } from "lucide-react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

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

const Footer = () => {
  return (
    <motion.div
      className="md:max-w-lg w-full border border-neutral-800 rounded-lg px-4 py-2 flex justify-between items-center gap-4 relative bottom-5 left-1/2 -translate-x-1/2 z-10"
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300 text-2xl font-bold">
        REX
      </div>
      <p className="text-muted-foreground max-sm:hidden">
        Copright @Priyesh | All right reserved.
      </p>
      <div className="flex gap-2.5 text-muted">
        <Instagram size={20} />
        <Facebook size={20} />
      </div>
    </motion.div>
  );
};

export default Footer;
