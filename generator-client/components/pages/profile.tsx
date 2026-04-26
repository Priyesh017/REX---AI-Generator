"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UserButton, useUser, useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

interface UserData {
  plan: string | null;
  subscriptionStatus: "active" | "inactive";
  creditsLeft: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  joinedAt: string;
  message?: string;
}

export default function UserProfilePage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth(); 
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return; 

      setLoadingSub(true); 

      try {
        const token = await getToken(); 

        if (!token) {
          console.error("Authentication token is missing.");
          return;
        }

        // Clean API call using the Bearer token for identity
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/user-details`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch user details.");
        }

        const data = await res.json();
        setUserData(data);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setUserData(null);
      } finally {
        setLoadingSub(false);
      }
    };

    if (isLoaded && user?.id) {
      fetchUserData();
    }
  }, [user, isLoaded, getToken]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative backdrop-blur-md bg-white/10 border border-white/30 rounded-2xl shadow-2xl p-8 w-full max-w-md text-white"
      >
        {loadingSub ? (
          <div className="flex items-center justify-center gap-2 text-sm">
            <Loader2 className="animate-spin text-indigo-500" />
            Loading profile...
          </div>
        ) : (
          <>
            <div className="absolute top-5 right-5 group">
              <div className="flex items-center justify-center relative rounded-full border border-white/30 p-1 hover:shadow-[0_0_8px_rgba(0,255,255,0.5)] transition duration-300 leading-none">
                <UserButton afterSignOutUrl="/" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-cyan-500" />
              </div>
            </div>

            <h1 className="text-2xl font-extrabold mb-1 tracking-tight">
              {userData?.fullName || user?.fullName}
            </h1>

            <p className="text-sm text-gray-300 mb-6">
              {userData?.email || user?.primaryEmailAddress?.emailAddress}
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <h2 className="text-lg font-semibold mb-2 border-b border-white/10 pb-2">Account Details</h2>

              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-gray-400">Phone:</span>
                <span className="text-white font-medium">{userData?.phoneNumber || "Not provided"}</span>

                <span className="text-gray-400">Credits:</span>
                <span className="text-indigo-400 font-bold">{userData?.creditsLeft} Left</span>

                <span className="text-gray-400">Plan:</span>
                <span className="text-white font-medium capitalize">{userData?.plan || "Free"}</span>

                <span className="text-gray-400">Joined:</span>
                <span className="text-white font-medium">
                  {userData?.joinedAt ? new Date(userData.joinedAt).toLocaleDateString() : "---"}
                </span>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
