// src/controllers/planController.ts
import { Request, Response } from "express";
import { supabase } from "../config/supabase";

import { sendSuccess } from "../lib/response";
import { AppError } from "../lib/errors";

export const getSubscriptionPlans = async (req: Request, res: Response) => {
  const { data: plans, error } = await supabase.from("plans").select("*");

  if (error) {
    throw new AppError("Failed to fetch subscription plans.", 500, "INTERNAL_ERROR");
  }

  sendSuccess(res, plans);
};
