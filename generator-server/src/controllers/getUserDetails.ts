import { Request, Response } from "express";
import { supabase } from "../config/supabase";

export const getUserDetails = async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    let { data, error } = await supabase
      .from("users")
      .select("current_plan, subscription_status, credits")
      .eq("clerk_id", userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Lazy upsert user on first authenticated request
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([{ clerk_id: userId, credits: 3 }])
        .select("current_plan, subscription_status, credits")
        .single();
        
      if (insertError) {
        throw insertError;
      }
      data = newUser;
    } else if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "User not found" });
    }

    const { subscription_status, current_plan, credits } = data;

    return res.json({
      plan: current_plan,
      subscriptionStatus: subscription_status,
      creditsLeft: credits || 0,
    });
  } catch (err) {
    console.error("getUserDetails Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
