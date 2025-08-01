import { Request, Response } from "express";
import { supabase } from "../config/supabase";

export const getUserDetails = async (req: Request, res: Response) => {
  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("current_plan, subscription_status, credits")
      .eq("clerk_id", userId)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "User not found" });
    }

    const { subscription_status, current_plan, credits } = data;

    if (subscription_status !== "active") {
      return res.json({
        plan: null,
        subscriptionStatus: "inactive",
        creditsLeft: 0,
        message: "No subscription plan available",
      });
    }

    return res.json({
      plan: current_plan,
      subscriptionStatus: "active",
      creditsLeft: credits,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
