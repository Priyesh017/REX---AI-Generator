"use client";

import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

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

const BuyCreditPage = ({ handleSubscription }: Props) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch plans");
        }

        setPlans(data.plans || []);
      } catch (err) {
        toast.error("Failed to load plans");
        console.error("Fetch plans error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  return (
    <div className="relative z-10 min-h-screen px-4 md:px-6 py-24 md:py-32 text-center text-muted">
      <button className="border border-gray-400 px-10 py-2 rounded-full mb-6">
        Our Plans
      </button>
      <h1 className="text-center text-3xl font-medium mb-6 sm:mb-10">
        Choose the plan
      </h1>

      {loading ? (
        <p className="text-center text-sm text-gray-400">Loading plans...</p>
      ) : plans.length === 0 ? (
        <p className="text-center text-red-500">No plans available</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-6 text-left">
          {plans.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-64 bg-black/5 backdrop-blur-lg drop-shadow-sm border border-border/20 rounded-lg py-12 px-8 text-muted-foreground"
            >
              <div className="text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300 text-2xl font-bold px-2 mx-4">
                REX
              </div>
              <p className="mt-3 mb-1 font-semibold">{item.name}</p>
              <p className="text-sm">{item.desc}</p>
              <p className="mt-6">
                <span className="text-3xl font-medium">₹{item.price}</span> /{" "}
                {item.credits} credits
              </p>
              <button
                className="w-full bg-zinc-800 text-muted mt-8 text-sm rounded-md py-2.5 border border-zinc-800 hover:border-zinc-500"
                onClick={() => handleSubscription(item.id)}
              >
                Get Started
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuyCreditPage;
