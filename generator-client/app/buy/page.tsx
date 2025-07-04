"use client";

import BuyCredit from "@/components/pages/buy-credits";
import { motion, Variants } from "framer-motion";
import React from "react";

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

const Buy = () => {
  return (
    <motion.div
      custom={1}
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
    >
      <BuyCredit />
    </motion.div>
  );
};

export default Buy;
