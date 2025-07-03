"use client";

import { motion } from "framer-motion";
import React from "react";

export const plans = [
  {
    id: "Basic",
    price: 10,
    credits: 100,
    desc: "Best for personal use.",
  },
  {
    id: "Advanced",
    price: 50,
    credits: 500,
    desc: "Best for business use.",
  },
  {
    id: "Business",
    price: 250,
    credits: 5000,
    desc: "Best for enterprise use.",
  },
];

const BuyCredit = () => {
  return (
    <div className="relative z-10 min-h-screen px-4 md:px-6 py-24 md:py-32 text-center text-muted">
      <button className="border border-gray-400 px-10 py-2 rounded-full mb-6">
        Our Plans
      </button>
      <h1 className="text-center text-3xl font-medium mb-6 sm:mb-10">
        Choose the plan
      </h1>
      <div className="flex flex-wrap justify-center gap-6 text-left">
        {plans.map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{
              scale: 1.05,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-64 bg-black/5 backdrop-blur-lg drop-shadow-sm border border-border/20 rounded-lg py-12 px-8 text-muted-foreground"
          >
            <div className="text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300 text-2xl font-bold px-2 mx-4">
              REX
            </div>
            <p className="mt-3 mb-1 font-semibold">{item.id}</p>
            <p className="text-sm">{item.desc}</p>
            <p className="mt-6">
              <span className="text-3xl font-medium">${item.price}</span> /{" "}
              {item.credits} credits
            </p>
            <button className="w-full bg-zinc-800 text-muted mt-8 text-sm rounded-md py-2.5 min-2-52">
              Get Started
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BuyCredit;
