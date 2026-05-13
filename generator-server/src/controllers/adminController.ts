import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { sendSuccess } from "../lib/response";
import { AppError } from "../lib/errors";

// Get Overall Stats & Revenue Chart Data
export const getAdminStats = async (req: Request, res: Response) => {
  // 1. Total Counts
  const { count: userCount, error: userError } = await supabase.from("profiles").select("*", { count: "exact", head: true });
  const { count: imageCount, error: imageError } = await supabase.from("generated_assets").select("*", { count: "exact", head: true });

  if (userError || imageError) throw new AppError("Failed to fetch counts", 500, "INTERNAL_ERROR");

  // 2. Revenue Calculation
  const { data: paidOrders, error: orderError } = await supabase
    .from("orders")
    .select("plan:plan_id(price), created_at")
    .eq("status", "paid");

  if (orderError) throw new AppError("Failed to fetch orders", 500, "INTERNAL_ERROR");

  const totalRevenue = paidOrders?.reduce((acc, curr: any) => acc + (curr.plan?.price || 0), 0) || 0;

  // 3. Revenue over last 7 days (Chart Data)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const chartData = last7Days.map(date => {
    const dailyRev = paidOrders?.filter(o => o.created_at.startsWith(date))
      .reduce((acc, curr: any) => acc + (curr.plan?.price || 0), 0) || 0;
    return { date, revenue: dailyRev };
  });

  sendSuccess(res, {
    stats: { totalUsers: userCount || 0, totalImages: imageCount || 0, totalRevenue },
    chartData
  });
};

// Search & List Users
export const getAdminUsers = async (req: Request, res: Response) => {
  const { search } = req.query;
  
  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
  
  if (search) {
    query = query.or(`display_name.ilike.%${search}%,username.ilike.%${search}%,clerk_id.eq.${search}`);
  }

  const { data: profilesData, error } = await query.limit(20);
  if (error) throw new AppError(error.message, 500, "INTERNAL_ERROR");

  const users = profilesData?.map(p => ({
    clerk_id: p.clerk_id,
    name: p.display_name || p.username || "Unknown",
    email: "N/A", // Email removed in new schema
    credits: p.credits,
    current_plan: p.current_plan,
    created_at: p.created_at
  })) || [];

  sendSuccess(res, users);
};

// List All Transactions
export const getAdminTransactions = async (req: Request, res: Response) => {
  const { data: transactions, error } = await supabase
    .from("orders")
    .select(`
      *,
      plans (name)
    `)
    .order("created_at", { ascending: false });

  if (error) throw new AppError(error.message, 500, "INTERNAL_ERROR");

  // Fetch profiles manually if no direct relation or to simplify for now
  const { data: profilesData } = await supabase.from("profiles").select("clerk_id, display_name");
  const profileMap = new Map((profilesData || []).map(p => [p.clerk_id, p.display_name]));

  // Flatten the data for the frontend
  const flattened = transactions?.map((t: any) => ({
    ...t,
    user_name: profileMap.get(t.clerk_id) || "Unknown",
    user_email: "N/A",
    plan_name: t.plans?.name || "N/A"
  }));

  sendSuccess(res, flattened);
};

// List All Images
export const getAdminImages = async (req: Request, res: Response) => {
  const { data: images, error } = await supabase
    .from("generated_assets")
    .select(`
      *,
      profiles!inner(display_name)
    `)
    .order("created_at", { ascending: false });

  if (error) throw new AppError(error.message, 500, "INTERNAL_ERROR");

  const flattened = images?.map((i: any) => ({
    ...i,
    user_name: i.profiles?.display_name || "Unknown"
  }));

  sendSuccess(res, flattened);
};

// Manually Update User Credits
export const updateUserDetails = async (req: Request, res: Response) => {
  const { userId, credits, plan } = req.body;
  
  const { error } = await supabase
    .from("profiles")
    .update({ credits, current_plan: plan })
    .eq("clerk_id", userId);

  if (error) throw new AppError(error.message, 500, "INTERNAL_ERROR");
  
  sendSuccess(res, { message: "User updated successfully" });
};
