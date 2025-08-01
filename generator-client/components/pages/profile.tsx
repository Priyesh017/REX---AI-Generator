"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UserButton, useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

interface Subscription {
  plan: string | null;
  subscriptionStatus: "active" | "inactive";
  creditsLeft: number;
  message?: string;
}

export default function UserProfilePage() {
  const { user, isLoaded } = useUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/user-details?userId=${user.id}`
        );
        const data = await res.json();
        setSubscription(data);
      } catch (err) {
        console.error("Error fetching subscription:", err);
      } finally {
        setLoadingSub(false);
      }
    };

    if (isLoaded) fetchSubscription();
  }, [user, isLoaded]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative backdrop-blur-md bg-white/10 border border-white/30 rounded-2xl shadow-2xl p-8 w-full max-w-md text-white"
      >
        {!isLoaded ? (
          <div className="flex items-center justify-center gap-2 text-sm">
            <Loader2 className="animate-spin text-indigo-500" />
            Loading profile...
          </div>
        ) : (
          <>
            <div className="absolute top-5 right-5 group">
              <div className="flex items-center justify-center relative rounded-full border border-white/30 p-1 hover:shadow-[0_0_8px_rgba(0,255,255,0.5)] transition duration-300 leading-none">
                <UserButton afterSignOutUrl="/" />

                {/* Ping Dot */}
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-cyan-500" />
              </div>

              {/* Absolute Tooltip */}
              <span className="absolute min-w-max right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-white/10 text-white/90 text-xs rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                View Profile
              </span>
            </div>

            <h1 className="text-2xl font-extrabold mb-1 tracking-tight">
              {user?.fullName}
            </h1>

            <p className="text-sm text-gray-300 mb-6">
              {user?.emailAddresses[0]?.emailAddress}
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
              <h2 className="text-lg font-semibold mb-2">Account Details</h2>

              {loadingSub ? (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Loader2 className="animate-spin text-indigo-500" />
                  Fetching data...
                </div>
              ) : subscription ? (
                subscription.subscriptionStatus === "inactive" ? (
                  <p className="text-gray-400 text-sm">
                    {subscription.message || "No subscription plan available."}
                  </p>
                ) : (
                  <>
                    <p>
                      Plan:{" "}
                      <span className="text-white font-semibold">
                        {subscription.plan}
                      </span>
                    </p>
                    <p>
                      Credits Left:{" "}
                      <span className="text-white font-semibold">
                        {subscription.creditsLeft}
                      </span>
                    </p>
                  </>
                )
              ) : (
                <p className="text-gray-400 text-sm">
                  Unable to load user data.
                </p>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
