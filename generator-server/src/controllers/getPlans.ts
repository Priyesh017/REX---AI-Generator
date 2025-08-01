// src/controllers/planController.ts
import { Request, Response } from "express";
import { supabase } from "../config/supabase";

export const getSubscriptionPlans = async (req: Request, res: Response) => {
  try {
    const { data: plans, error } = await supabase.from("plans").select("*");

    if (error) {
      console.error("Error fetching plans:", error.message);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch subscription plans.",
      });
    }

    res.status(200).json({
      success: true,
      plans,
    });
  } catch (err: any) {
    console.error("Unexpected error:", err.message);
    res.status(500).json({
      success: false,
      error: "Something went wrong while fetching plans.",
    });
  }
};
