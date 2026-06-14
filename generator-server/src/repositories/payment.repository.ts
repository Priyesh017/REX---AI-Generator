// src/repositories/payment.repository.ts
import { supabase } from "../config/supabase";

export interface OrderRecord {
  id: number;
  order_id: string;
  clerk_id: string;
  profile_id: string | null;
  plan_id: string;
  status: string;
  payment_id: string | null;
  created_at: string;
  updated_at?: string;
  plan?: {
    id: string;
    name: string;
    price: number;
    credits: number;
  };
}

export async function createOrder(payload: {
  orderId: string;
  clerkId: string;
  profileId: string;
  planId: string;
  status: string;
}): Promise<void> {
  const { error } = await supabase.from("orders").insert([
    {
      order_id: payload.orderId,
      clerk_id: payload.clerkId,
      profile_id: payload.profileId,
      plan_id: payload.planId,
      status: payload.status,
    },
  ]);

  if (error) {
    throw new Error(`DB error in createOrder: ${error.message}`);
  }
}

export async function findOrderByOrderId(orderId: string): Promise<OrderRecord | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, plan:plan_id(*)")
    .eq("order_id", orderId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`DB error in findOrderByOrderId: ${error.message}`);
  }

  return data as OrderRecord;
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  paymentId: string
): Promise<OrderRecord | null> {
  const { data, error } = await supabase
    .from("orders")
    .update({
      status,
      payment_id: paymentId,
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId)
    .eq("status", "created")
    .select()
    .single();

  if (error) {
    // If update fails, it could be because it's already updated.
    if (error.code === "PGRST116") return null;
    throw new Error(`DB error in updateOrderStatus: ${error.message}`);
  }

  return data as OrderRecord;
}

export async function incrementCredits(clerkId: string, credits: number): Promise<void> {
  const { error } = await supabase.rpc("increment_credits", {
    user_clerk_id: clerkId,
    credits_to_add: credits,
  });

  if (error) {
    throw new Error(`DB error in incrementCredits: ${error.message}`);
  }
}

export async function getPlanById(planId: string) {
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`DB error in getPlanById: ${error.message}`);
  }

  return data;
}
