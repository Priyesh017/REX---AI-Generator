"use client";

// components/pages/buy-credits.tsx
// Pricing / credit plans page UI.
// The handleSubscription prop is passed from app/buy/page.tsx (Razorpay logic lives there).

import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Zap, Loader2, Check } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  desc: string;
}

interface Props {
  handleSubscription: (planId: string) => void;
}

import type { Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.15 + i * 0.1, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] },
  }),
};

const BuyCreditPage = ({ handleSubscription }: Props) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Failed to fetch plans");
        }

        setPlans(json.data || []);
      } catch (err) {
        toast.error("Failed to load plans");
        console.error("Fetch plans error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleBuy = (planId: string) => {
    setPurchasing(planId);
    try {
      handleSubscription(planId);
    } finally {
      // Razorpay may dismiss — reset after a delay
      setTimeout(() => setPurchasing(null), 3000);
    }
  };

  return (
    <div className="relative min-h-screen px-4 md:px-8 pt-28 pb-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/60 border border-zinc-700/60 text-xs text-zinc-400 font-medium mb-5">
            <Zap className="w-3 h-3 text-indigo-400" />
            Credits & Pricing
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
            Choose your plan
          </h1>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
            Each credit generates one AI image. Credits never expire.
          </p>
        </motion.div>

        {/* Plans */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-zinc-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading plans…</span>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16 text-zinc-600 text-sm">
            No plans available right now. Please check back later.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map((plan, i) => {
              const isPopular = i === 1; // Mark middle plan as popular
              return (
                <motion.div
                  key={plan.id}
                  custom={i + 1}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className={`relative flex flex-col bg-zinc-900/50 border rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/40 ${
                    isPopular
                      ? "border-indigo-500/40 shadow-indigo-500/10 shadow-lg"
                      : "border-zinc-800/80 hover:border-zinc-700"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-500/30">
                        <Zap className="w-2.5 h-2.5" />
                        Popular
                      </span>
                    </div>
                  )}

                  {/* Plan identity */}
                  <div className="mb-5">
                    <div className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/80 to-rose-300 text-sm font-bold tracking-widest uppercase mb-2">
                      REX
                    </div>
                    <h2 className="text-lg font-bold text-white">{plan.name}</h2>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{plan.desc}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-white">₹{plan.price}</span>
                    <span className="text-zinc-500 text-sm ml-2">
                      for {plan.credits} credits
                    </span>
                    <p className="text-xs text-zinc-700 mt-1">
                      ₹{(plan.price / plan.credits).toFixed(0)} per image
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-8 flex-1">
                    {[
                      `${plan.credits} AI image generations`,
                      "Save to drafts",
                      "Download in full quality",
                      "Credits never expire",
                    ].map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-xs text-zinc-400">
                        <Check className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handleBuy(plan.id)}
                    disabled={purchasing === plan.id}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                      isPopular
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                        : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700/60"
                    }`}
                  >
                    {purchasing === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    {purchasing === plan.id ? "Processing…" : "Get Started"}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <motion.p
          custom={plans.length + 2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-center text-xs text-zinc-700 mt-10"
        >
          Secure payments powered by Razorpay · Credits are added instantly after payment
        </motion.p>
      </div>
    </div>
  );
};

export default BuyCreditPage;
