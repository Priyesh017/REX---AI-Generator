import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { generateImageFromPrompt } from "../config/huggingface";
import { uploadImageToBucket } from "../lib/upload";
import { generateTitleFromPrompt } from "../lib/titleGenerator";

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
    }
    interface Request {
      user?: User;
    }
  }
}

export const generateImage = async (req: Request, res: Response) => {
  const { prompt } = req.body;
  const user_id = req.userId;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  if (!user_id) {
    return res.status(401).json({ error: "Unauthorized: User ID missing" });
  }

  try {
    // Step 1: Check credits
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("credits")
      .eq("clerk_id", user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.credits < 1) {
      return res.status(403).json({ error: "Insufficient credits" });
    }

    // Step 2: Generate image
    const imageBuffer = await generateImageFromPrompt(prompt);

    // Step 3: Upload to Supabase Storage
    const imageUrl = await uploadImageToBucket(imageBuffer);

    // Step 4: Generate title
    const title = await generateTitleFromPrompt(prompt);

    // Step 5: Deduct credit
    await supabase
      .from("users")
      .update({ credits: user.credits - 1 })
      .eq("clerk_id", user_id);

    // Step 6: Insert metadata into database
    const { data: image, error } = await supabase
      .from("images")
      .insert([{ title, prompt, user_id, image_url: imageUrl }])
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase DB error:", error);
      return res.status(500).json({ error: "Database insert failed" });
    }

    return res.status(201).json({ image });
  } catch (err: any) {
    console.error("❌ Image generation failed:", err.message || err);
    return res.status(500).json({ error: "Image generation failed" });
  }
};
