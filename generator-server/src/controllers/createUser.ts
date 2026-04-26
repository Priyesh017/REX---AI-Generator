import { Request, Response } from "express";
import { supabase } from "../config/supabase"; // Ensure Supabase is set up
import crypto from 'crypto';
import { env } from "../config/env";

const verifyWebhookSignature = (req: Request) => {
  const signature = req.headers['clerk-signature'] as string;
  const body = JSON.stringify(req.body);
  const computedSignature = crypto
    .createHmac('sha256', env.clerkSecretKey)
    .update(body)
    .digest('hex');

  return signature === computedSignature;
};

export const handleUserCreatedWebhook = async (req: Request, res: Response) => {
  // Verify the webhook signature for security
  if (!verifyWebhookSignature(req)) {
    console.warn("⚠️ Invalid Clerk webhook signature");
    return res.status(400).json({ error: "Invalid signature" });
  }

  const user = req.body.data; // Clerk webhook payload

  try {
    // Extract necessary data from Clerk user object
    const { id, emailAddresses, fullName, phoneNumbers, profileImageUrl } = user;

    // Ensure email addresses array is not empty
    if (!emailAddresses || emailAddresses.length === 0) {
      return res.status(400).json({ error: "Missing email address in webhook payload" });
    }

    // Prepare data to insert into Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          clerk_id: id,
          email: emailAddresses[0].emailAddress,
          name: fullName,
          phone_number: phoneNumbers?.length > 0 ? phoneNumbers[0].phoneNumber : null,
          user_image_url: profileImageUrl || null,
          credits: 0,
          current_plan: null, 
          subscription_status: 'inactive',
          created_at: new Date(),
        }
      ]);

    if (error) {
      console.error("Error inserting user into Supabase:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: "User stored in Supabase", data });
  } catch (err) {
    console.error("Error inserting user into Supabase:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
