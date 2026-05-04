"use client";

import { useEffect, useState, useCallback } from "react";
import {
  useAuth,
  useUser,
  UserButton,
  UserProfile,
  useClerk,
} from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import NextImage from "next/image";
import {
  Users,
  ImageIcon,
  IndianRupee,
  Search,
  RefreshCcw,
  Edit,
  X,
  LayoutDashboard,
  UserCircle,
  Settings,
  Loader2,
  CreditCard,
  Image as GalleryIcon,
  Download,
  LogOut,
  Monitor,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "react-hot-toast";

interface AdminStats {
  totalUsers: number;
  totalImages: number;
  totalRevenue: number;
}

interface User {
  clerk_id: string;
  name: string;
  email: string;
  credits: number;
  current_plan: string;
  created_at: string;
}

interface Transaction {
  id: string;
  order_id: string;
  status: string;
  created_at: string;
  user_name: string;
  user_email: string;
  plan_name: string;
  price?: number;
}

interface GeneratedImage {
  id: string;
  prompt: string;
  image_url: string;
  created_at: string;
  user_name: string;
}

interface ChartData {
  date: string;
  revenue: number;
}

type DashboardTab = "overview" | "users" | "orders" | "gallery" | "account";

export default function AdminDashboard() {
  const { signOut } = useClerk();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user: admin } = useUser();
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null,
  );

  const fetchOverview = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStats(data.stats);
      setChartData(data.chartData);
    } catch (err) {
      console.error(err);
    }
  }, [getToken]);

  const fetchUsers = useCallback(
    async (query: string = "") => {
      try {
        const token = await getToken();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/users?search=${query}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setUsers(data.users);
      } catch (err) {
        console.error(err);
      }
    },
    [getToken],
  );

  const fetchTransactions = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/transactions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) setTransactions(data.transactions);
    } catch (err) {
      console.error(err);
    }
  }, [getToken]);

  const fetchImages = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/images`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) setImages(data.images);
    } catch (err) {
      console.error(err);
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLoading(true);
      Promise.all([
        fetchOverview(),
        fetchUsers(),
        fetchTransactions(),
        fetchImages(),
      ]).finally(() => setLoading(false));
    }
  }, [
    isLoaded,
    isSignedIn,
    fetchOverview,
    fetchUsers,
    fetchTransactions,
    fetchImages,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 flex font-sans overflow-hidden">
      {/* 📱 Mobile Lockout Overlay */}
      <div className="lg:hidden fixed inset-0 z-[999] bg-[#050505] flex items-center justify-center p-12 text-center">
        <div className="space-y-8 max-w-md">
          <div className="w-24 h-24 bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-indigo-500/20 shadow-2xl shadow-indigo-500/5">
            <Monitor className="w-10 h-10 text-indigo-400" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-white tracking-tighter">Desktop Access Only</h1>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">
              The <span className="text-indigo-400">REX OS</span> Command Center is designed for high-resolution tactical management. Please log in from a desktop or laptop to access these administrative tools.
            </p>
          </div>
          <div className="pt-8">
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Resolution Required: 1024px+
             </div>
          </div>
        </div>
      </div>
      
      {/* 🚀 Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#080808] flex flex-col hidden lg:flex shrink-0">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-lg">R</span>
            </div>
            <span className="text-white font-bold tracking-tight text-xl">
              REX <span className="text-zinc-600 font-medium">OS</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Overview"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <NavItem
            icon={<UserCircle className="w-4 h-4" />}
            label="Users"
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
          />
          <NavItem
            icon={<CreditCard className="w-4 h-4" />}
            label="Order History"
            active={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
          />
          <NavItem
            icon={<GalleryIcon className="w-4 h-4" />}
            label="Gallery"
            active={activeTab === "gallery"}
            onClick={() => setActiveTab("gallery")}
          />
          <NavItem
            icon={<Settings className="w-4 h-4" />}
            label="Account"
            active={activeTab === "account"}
            onClick={() => setActiveTab("account")}
          />
        </nav>

        <div className="p-6 space-y-4">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all group"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Logout
          </button>

          <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest">
                Live Engine
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* 🖥️ Main */}
      <main className="flex-1 h-screen overflow-y-auto bg-gradient-to-b from-[#0A0A0A] to-[#050505]">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-xl z-50">
          <h2 className="text-white font-bold text-lg capitalize">
            {activeTab}
          </h2>
          <div className="flex items-center gap-6">
            <button
              disabled={refreshing}
              onClick={async () => {
                setRefreshing(true);
                const syncToast = toast.loading("Syncing platform data...");
                try {
                  await Promise.all([
                    fetchOverview(),
                    fetchUsers(),
                    fetchTransactions(),
                    fetchImages(),
                  ]);
                  toast.success("Platform Synced", { id: syncToast });
                } catch (err) {
                  console.error("Sync Error:", err);
                  toast.error("Sync Failed. Check connection.", {
                    id: syncToast,
                  });
                } finally {
                  setRefreshing(false);
                }
              }}
              className={`p-2 hover:bg-white/5 rounded-full transition-all ${refreshing ? "opacity-50 cursor-not-allowed" : "hover:scale-110 active:scale-95"}`}
            >
              <RefreshCcw
                className={`w-4 h-4 text-indigo-400 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
            <div className="relative group cursor-pointer flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-white leading-none">
                  {admin?.firstName}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-tighter">
                  Root Access
                </p>
              </div>
              <NextImage
                src={admin?.imageUrl || ""}
                width={40}
                height={40}
                className="w-10 h-10 rounded-xl border border-white/10"
                alt="Admin"
              />
              <div className="absolute inset-0 opacity-0">
                <UserButton />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Revenue"
                  value={`₹ ${stats?.totalRevenue}`}
                  icon={<IndianRupee />}
                  color="emerald"
                  span={2}
                />
                <MetricCard
                  title="Users"
                  value={stats?.totalUsers || 0}
                  icon={<Users />}
                  color="indigo"
                />
                <MetricCard
                  title="Generations"
                  value={stats?.totalImages || 0}
                  icon={<ImageIcon />}
                  color="purple"
                />
              </div>

              <div className="bg-[#0C0C0C] border border-white/5 rounded-[2.5rem] p-8">
                <h3 className="text-white font-bold mb-8">Revenue Stream</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor="#6366f1"
                            stopOpacity={0.15}
                          />
                          <stop
                            offset="100%"
                            stopColor="#6366f1"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#ffffff05"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#52525b"
                        fontSize={10}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) =>
                          new Date(val).toLocaleDateString(undefined, {
                            weekday: "short",
                          })
                        }
                      />
                      <YAxis
                        stroke="#52525b"
                        fontSize={10}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0C0C0C",
                          border: "1px solid #ffffff10",
                          borderRadius: "16px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#6366f1"
                        fill="url(#g)"
                        strokeWidth={3}
                        dot={{ fill: "#6366f1", r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "users" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="text"
                  placeholder="Search user..."
                  className="w-full bg-[#0C0C0C] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    fetchUsers(e.target.value);
                  }}
                />
              </div>
              <div className="bg-[#0C0C0C] border border-white/5 rounded-[2.5rem] overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-black uppercase text-zinc-500">
                      <th className="px-8 py-5">Identity</th>
                      <th className="px-8 py-5">Credits</th>
                      <th className="px-8 py-5">Tier</th>
                      <th className="px-8 py-5 text-right">Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u) => (
                      <tr key={u.clerk_id} className="hover:bg-white/[0.01]">
                        <td className="px-8 py-6">
                          <p className="text-sm font-bold text-white">
                            {u.name}
                          </p>
                          <p className="text-[10px] text-zinc-500">{u.email}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold">
                            {u.credits}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-xs capitalize">
                          {u.current_plan}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button
                            onClick={() => setEditingUser(u)}
                            className="p-2 hover:bg-white/5 rounded-xl"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "orders" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#0C0C0C] border border-white/5 rounded-[2.5rem] overflow-hidden"
            >
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-black uppercase text-zinc-500">
                    <th className="px-8 py-5">Order ID</th>
                    <th className="px-8 py-5">Customer</th>
                    <th className="px-8 py-5">Plan</th>
                    <th className="px-8 py-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.length > 0 ? (
                    transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-white/[0.01]">
                        <td className="px-8 py-6 font-mono text-[15px] text-zinc-400">
                          {t.order_id}
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-bold text-white">
                            {t.user_name}
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            {t.user_email}
                          </p>
                        </td>
                        <td className="px-8 py-6 text-xs text-zinc-300 font-bold">
                          {t.plan_name}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${t.status === "paid" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}
                          >
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-8 py-20 text-center text-zinc-500 italic"
                      >
                        No orders found in history.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          )}

          {activeTab === "account" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <UserProfile
                routing="hash"
                appearance={{
                  baseTheme: dark,
                  elements: {
                    rootBox: "w-full h-full",
                    card: "bg-transparent shadow-none w-full border-none",
                    navbar: "bg-transparent border-r border-white/5",
                    pageScrollBox: "bg-transparent p-8",
                    headerTitle: "text-white font-black",
                    headerSubtitle: "text-zinc-500",
                    navbarButton: "text-zinc-400 hover:text-white transition",
                    navbarButtonIcon: "text-zinc-500",
                    userPreviewMainIdentifier: "text-white font-bold",
                    userPreviewSecondaryIdentifier: "text-zinc-500",
                    formButtonPrimary:
                      "bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl",
                    formFieldInput:
                      "bg-zinc-900 border-white/5 text-white rounded-xl",
                    formFieldLabel:
                      "text-zinc-400 font-bold text-[10px] uppercase",
                    profileSectionTitleText: "text-white font-bold",
                    accordionTriggerButton: "text-white font-bold",
                    badge: "bg-indigo-500/10 text-indigo-400 border-none",
                  },
                }}
              />
            </motion.div>
          )}
          {activeTab === "gallery" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((img) => (
                    <motion.div
                      key={img.id}
                      whileHover={{ scale: 1.02 }}
                      className="group relative bg-[#0C0C0C] rounded-2xl border border-white/5 overflow-hidden cursor-pointer"
                      onClick={() => setSelectedImage(img)}
                    >
                      <NextImage
                        src={img.image_url}
                        width={400}
                        height={400}
                        className="w-full aspect-square object-cover"
                        alt={img.prompt}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                        <p className="text-[10px] text-white font-bold line-clamp-1">
                          {img.prompt}
                        </p>
                        <p className="text-[8px] text-zinc-400">
                          by {img.user_name}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#0C0C0C] border border-white/5 rounded-[2.5rem] p-20 text-center text-zinc-500 italic">
                  The gallery is currently empty. Start generating to see images
                  here!
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {/* Image Detail Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full max-h-[90vh] overflow-y-auto bg-[#0C0C0C] border border-white/10 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-3xl scrollbar-hide"
            >
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 bg-black rounded-2xl overflow-hidden border border-white/5 shadow-2xl min-h-[300px] flex items-center justify-center">
                  <NextImage
                    src={selectedImage.image_url}
                    width={1024}
                    height={1024}
                    className="max-w-full max-h-[70vh] object-contain"
                    alt={selectedImage.prompt}
                  />
                </div>
                <div className="w-full lg:w-80 space-y-6 shrink-0">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-bold text-xl tracking-tight">
                        Image Intel
                      </h3>
                      <button
                        onClick={() => setSelectedImage(null)}
                        className="p-2 hover:bg-white/5 rounded-full lg:hidden text-zinc-500"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">
                          Creator
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                            {selectedImage.user_name.charAt(0)}
                          </div>
                          <p className="text-zinc-200 text-sm font-medium">
                            {selectedImage.user_name}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">
                          Prompt
                        </label>
                        <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                          <p className="text-zinc-300 text-xs italic leading-relaxed">
                            &quot;{selectedImage.prompt}&quot;
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">
                          Generated On
                        </label>
                        <p className="text-zinc-500 text-[10px] font-medium">
                          {new Date(selectedImage.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-white/5">
                    <a
                      href={selectedImage.image_url}
                      target="_blank"
                      download
                      className="flex-1 bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition shadow-xl"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-white hover:bg-zinc-800 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="absolute inset-0 bg-black/90"
            />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="relative w-full max-w-lg bg-[#0C0C0C] border border-white/10 rounded-[3rem] p-10"
            >
              <h3 className="text-2xl font-bold text-white mb-8">
                Modify Account
              </h3>
              <form
                className="space-y-6"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const token = await getToken();
                  const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/admin/update-user`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        userId: editingUser.clerk_id,
                        credits: editingUser.credits,
                        plan: editingUser.current_plan,
                      }),
                    },
                  );
                  if (res.ok) {
                    toast.success("Saved");
                    setEditingUser(null);
                    fetchUsers();
                  }
                }}
              >
                <div className="space-y-4">
                  <div className="bg-zinc-900 p-4 rounded-2xl border border-white/5">
                    <p className="text-white font-bold">{editingUser.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      className="bg-zinc-900 border border-white/5 rounded-xl p-4 text-white"
                      value={editingUser.credits}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          credits: parseInt(e.target.value),
                        })
                      }
                    />
                    <select
                      className="bg-zinc-900 border border-white/5 rounded-xl p-4 text-white"
                      value={editingUser.current_plan}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          current_plan: e.target.value,
                        })
                      }
                    >
                      <option value="free">Free</option>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="ultimate">Ultimate</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl"
                >
                  Update User
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? "bg-indigo-500/10 text-white border border-indigo-500/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
    >
      <div className={`${active ? "text-indigo-400" : "text-zinc-600"}`}>
        {icon}
      </div>
      {label}
    </button>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
  span = 1,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  span?: number;
}) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    purple: "text-purple-400 bg-purple-400/10 border-purple-500/20",
  };
  return (
    <div
      className={`${span === 2 ? "md:col-span-2" : ""} bg-[#0C0C0C] border border-white/5 p-8 rounded-[2rem] relative overflow-hidden group`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
          {title}
        </span>
        <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      </div>
      <div className="text-4xl font-black text-white tracking-tighter">
        {value}
      </div>
    </div>
  );
}

