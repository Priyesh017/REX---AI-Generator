// src/controllers/historyController.ts
import { Request, Response } from "express";
import { supabase } from "../config/supabase";

export const getImageHistory = async (req: Request, res: Response) => {
  const user_id = req.user?.id || req.userId;

  if (!user_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: "Failed to fetch image history" });
    }

    return res.status(200).json({ images: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

// DELETE /api/history/:id
export const deleteImageHistory = async (req: Request, res: Response) => {
  const user_id = req.user?.id;
  const { id } = req.params;

  if (!user_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { error } = await supabase
      .from("images")
      .delete()
      .match({ id, user_id });

    if (error) {
      console.error("Delete error:", error);
      return res.status(500).json({ error: "Failed to delete image" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
