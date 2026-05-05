"use client";

// components/pages/profile.tsx
// Account settings / private profile page.
// Separate concern from /u/[username] (public creator profile).
// Uses the new /api/profile/me endpoint with correct response shape.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UserButton, useUser, useAuth } from "@clerk/nextjs";
import {
  Loader2,
  Zap,
  Crown,
  Calendar,
  Phone,
  Mail,
  Wand2,
  ShoppingCart,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { profileApi, type ProfileData } from "@/lib/api/profile.api";
import { ApiRequestError } from "@/lib/api/client";

import type { Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.1 + i * 0.1, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] },
  }),
};

export default function UserProfilePage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user?.id) return;

    let cancelled = false;
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const api = profileApi(getToken);
        const data = await api.getMyProfile();
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiRequestError ? err.message : "Failed to load profile"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProfile();
    return () => { cancelled = true; };
  }, [user?.id, isLoaded, getToken]);

  return (
    <div className="min-h-screen px-4 md:px-8 pt-28 pb-16">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-10"
        >
          <h1 className="text-xl font-bold text-white tracking-tight">My Account</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your profile, plan, and credits.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-zinc-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading profile…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-24 gap-3 text-zinc-600">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs border border-zinc-700 text-zinc-400 hover:text-white px-4 py-2 rounded-full transition"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Identity card */}
            <motion.div
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {/* Avatar via Clerk UserButton */}
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-zinc-700">
                      {user?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.imageUrl}
                          alt={profile?.displayName ?? "Avatar"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xl font-bold">
                          {profile?.displayName?.[0] ?? "?"}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 opacity-0 w-0 h-0 overflow-hidden">
                      <UserButton afterSignOutUrl="/" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white leading-tight">
                      {profile?.displayName ?? user?.fullName ?? "User"}
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {profile?.email ?? user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>
                <UserButton afterSignOutUrl="/" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InfoRow
                  icon={<Mail className="w-3.5 h-3.5" />}
                  label="Email"
                  value={profile?.email ?? "—"}
                />
                <InfoRow
                  icon={<Phone className="w-3.5 h-3.5" />}
                  label="Phone"
                  value={profile?.phoneNumber ?? "Not provided"}
                />
                <InfoRow
                  icon={<Calendar className="w-3.5 h-3.5" />}
                  label="Joined"
                  value={
                    profile?.joinedAt
                      ? new Date(profile.joinedAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "—"
                  }
                />
              </div>
            </motion.div>

            {/* Credits + plan card */}
            <motion.div
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-4"
            >
              {/* Credits */}
              <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                    Credits
                  </span>
                </div>
                <p
                  className={`text-3xl font-bold tabular-nums ${
                    (profile?.creditsLeft ?? 0) <= 2
                      ? "text-orange-400"
                      : "text-white"
                  }`}
                >
                  {profile?.creditsLeft ?? 0}
                </p>
                <p className="text-xs text-zinc-600 mt-1">remaining</p>
                {(profile?.creditsLeft ?? 0) <= 3 && (
                  <Link
                    href="/buy"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    Buy more credits
                  </Link>
                )}
              </div>

              {/* Plan */}
              <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                    Plan
                  </span>
                </div>
                <p className="text-3xl font-bold text-white capitalize">
                  {profile?.plan ?? "Free"}
                </p>
                <p className="text-xs text-zinc-600 mt-1">
                  {profile?.subscriptionStatus === "active"
                    ? "Active subscription"
                    : "No active subscription"}
                </p>
                <Link
                  href="/buy"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition"
                >
                  View plans
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>

            {/* Quick actions */}
            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-3"
            >
              <Link
                href="/studio"
                className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-4 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Wand2 className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-white">
                    Open Studio
                  </p>
                  <p className="text-xs text-zinc-600">Generate & manage drafts</p>
                </div>
              </Link>
              <Link
                href="/buy"
                className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-4 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Buy Credits</p>
                  <p className="text-xs text-zinc-600">Top up your account</p>
                </div>
              </Link>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── InfoRow ───────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-zinc-600 mt-0.5">{icon}</span>
      <div>
        <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">
          {label}
        </p>
        <p className="text-sm text-zinc-300 mt-0.5 break-all">{value}</p>
      </div>
    </div>
  );
}
