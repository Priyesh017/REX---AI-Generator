import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { clerkClient } from "../config/clerk";

export const getUserDetails = async (req: Request, res: Response) => {
  const userId = req.userId;
  console.log(`🔍 [GET] /user-details request received for clerk_id: ${userId}`);

  if (!userId) {
    console.warn("⚠️ No userId found in request (Auth middleware failed?)");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    let { data, error } = await supabase
      .from("users")
      .select("current_plan, subscription_status, credits, name, email, phone_number, created_at")
      .eq("clerk_id", userId)
      .single();

    if (error && error.code === 'PGRST116') {
      console.log(`🆕 Creating new user record for clerk_id: ${userId}`);
      
      // Fetch details from Clerk for the first-time setup
      const clerkUser = await clerkClient.users.getUser(userId);
      console.log(`👤 Fetched Clerk user: ${clerkUser.firstName} ${clerkUser.lastName}`);

      const fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
      const email = clerkUser.emailAddresses[0]?.emailAddress || "";
      const phoneNumber = clerkUser.phoneNumbers[0]?.phoneNumber || "Not provided";
      const imageUrl = clerkUser.imageUrl || "";

      // Lazy upsert user on first authenticated request
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([{ 
          clerk_id: userId, 
          credits: 5,
          current_plan: "free",
          name: fullName,
          email: email,
          phone_number: phoneNumber,
          user_image_url: imageUrl
        }])
        .select("current_plan, subscription_status, credits, name, email, phone_number, created_at")
        .single();
        
      if (insertError) {
        console.error("❌ Supabase Insert Error:", insertError);
        throw insertError;
      }
      console.log("✅ User record created successfully in Supabase");
      data = newUser;
    } else if (error) {
      console.error("❌ Supabase Select Error:", error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      fullName: data.name, // Mapping 'name' to 'fullName' for the frontend
      email: data.email,
      phoneNumber: data.phone_number,
      joinedAt: data.created_at,
      plan: data.current_plan,
      subscriptionStatus: data.subscription_status,
      creditsLeft: data.credits || 0,
    });
  } catch (err) {
    console.error("getUserDetails Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
