"use client";

import BuyCreditPage from "@/components/pages/buy-credits";
import { motion, Variants } from "framer-motion";
import React, { useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react"; // Optional: any loading spinner icon

declare global {
  interface RazorpayOptions {
    key: string;
    amount: number;
    currency?: string;
    name?: string;
    description?: string;
    image?: string;
    order_id?: string;
    handler?: (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => void;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    notes?: Record<string, string | number>;
    theme?: {
      color?: string;
    };
    modal?: {
      ondismiss?: () => void;
    };
  }

  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }

  interface RazorpayInstance {
    open(): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
    close(): void;
  }
}

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
  const { user } = useUser();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false); // Loading state

  const handleSubscription = async (planId: string) => {
    if (!user) return toast.error("Please sign in");

    try {
      setLoading(true); // start loading
      const token = await getToken();
      if (!token) throw new Error("No auth token found");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            planId,
            clerkId: user.id,
          }),
        }
      );

      if (!res.ok) {
        const errRes = await res.json();
        throw new Error(errRes.error || "Failed to create order");
      }

      const data = await res.json();

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "REX",
        description: "Buy Credits",
        order_id: data.order.id,
        handler: async function () {
          try {
            const confirmRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/payment-success`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  orderId: data.order.id,
                  clerkId: user.id,
                }),
              }
            );

            const confirmData = await confirmRes.json();
            if (!confirmRes.ok || !confirmData.success) {
              throw new Error(confirmData.error || "Failed to update credits");
            }

            toast.success("Payment successful and credits added!");
          } catch (err: unknown) {
            if (err instanceof Error) {
              toast.error(
                "Payment succeeded but credit update failed: " + err.message
              );
            } else {
              toast.error(
                "Payment succeeded but credit update failed: Unknown error"
              );
            }
          }
        },
        prefill: {
          name: user.fullName || "",
          email: user.primaryEmailAddress?.emailAddress || "",
        },
        theme: {
          color: "#6366f1",
        },
        modal: {
          ondismiss: () => setLoading(false), // stop loading if user closes Razorpay window
        },
      });

      razorpay.open();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error("Payment failed: " + err.message);
      } else if (typeof err === "string") {
        toast.error("Payment failed: " + err);
      } else {
        toast.error("Payment failed due to an unknown error.");
      }
    } finally {
      setLoading(false); // stop loading in any case
    }
  };

  return (
    <motion.div
      custom={1}
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
    >
      {loading && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/30 backdrop-blur-lg z-[99999] flex items-center justify-center">
          <div className="bg-zinc-900 rounded-xl p-6 flex items-center gap-3 shadow-lg">
            <Loader2 className="animate-spin text-indigo-500" />
            <span className="text-muted font-medium">
              Initializing payment...
            </span>
          </div>
        </div>
      )}

      <BuyCreditPage handleSubscription={handleSubscription} />
    </motion.div>
  );
};

export default Buy;
