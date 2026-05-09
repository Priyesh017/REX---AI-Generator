import { Request, Response } from "express";
import { supabase } from "../config/supabase";

// Get Overall Stats & Revenue Chart Data
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    // 1. Total Counts
    const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    const { count: imageCount } = await supabase.from("generated_assets").select("*", { count: "exact", head: true });

    // 2. Revenue Calculation
    const { data: paidOrders } = await supabase
      .from("orders")
      .select("plan:plan_id(price), created_at")
      .eq("status", "paid");

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

    res.json({
      success: true,
      stats: { totalUsers: userCount || 0, totalImages: imageCount || 0, totalRevenue },
      chartData
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Search & List Users
export const getAdminUsers = async (req: Request, res: Response) => {
  const { search } = req.query;
  try {
    let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
    
    if (search) {
      query = query.or(`display_name.ilike.%${search}%,username.ilike.%${search}%,clerk_id.eq.${search}`);
    }

    const { data: profilesData, error } = await query.limit(20);
    if (error) throw error;

    const users = profilesData?.map(p => ({
      clerk_id: p.clerk_id,
      name: p.display_name || p.username || "Unknown",
      email: "N/A", // Email removed in new schema
      credits: p.credits,
      current_plan: p.current_plan,
      created_at: p.created_at
    })) || [];
    if (error) throw error;

    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// List All Transactions
export const getAdminTransactions = async (req: Request, res: Response) => {
  try {
    const { data: transactions, error } = await supabase
      .from("orders")
      .select(`
        *,
        plans (name)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Fetch profiles manually if no direct relation or to simplify for now
    // Actually, orders probably links to clerk_id. Let's just fetch all profiles and map them.
    const { data: profilesData } = await supabase.from("profiles").select("clerk_id, display_name");
    const profileMap = new Map((profilesData || []).map(p => [p.clerk_id, p.display_name]));

    // Flatten the data for the frontend
    const flattened = transactions?.map((t: any) => ({
      ...t,
      user_name: profileMap.get(t.user_id) || "Unknown",
      user_email: "N/A",
      plan_name: t.plans?.name || "N/A"
    }));

    res.json({ success: true, transactions: flattened });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// List All Images
export const getAdminImages = async (req: Request, res: Response) => {
  try {
    const { data: images, error } = await supabase
      .from("generated_assets")
      .select(`
        *,
        profiles!inner(display_name)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const flattened = images?.map((i: any) => ({
      ...i,
      user_name: i.profiles?.display_name || "Unknown"
    }));

    res.json({ success: true, images: flattened });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};



// Manually Update User Credits
export const updateUserDetails = async (req: Request, res: Response) => {
  const { userId, credits, plan } = req.body;
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ credits, current_plan: plan })
      .eq("clerk_id", userId);

    if (error) throw error;
    res.json({ success: true, message: "User updated successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
