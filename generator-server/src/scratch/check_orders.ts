// src/scratch/check_orders.ts
import { supabase } from "../config/supabase";

async function main() {
  console.log("--- Checking orders columns ---");
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select("id, payment_id, updated_at")
    .limit(1);
  if (orderError) {
    console.error("Orders check error:", orderError.message);
  } else {
    console.log("Orders columns payment_id/updated_at check succeeded.");
  }

  console.log("--- Checking posts columns ---");
  const { data: postData, error: postError } = await supabase
    .from("posts")
    .select("*")
    .limit(1);
  if (postError) {
    console.error("Posts select error:", postError.message);
  } else {
    console.log("Posts columns:", Object.keys(postData[0] || {}));
    console.log("Posts sample:", postData[0]);
  }
}

main();
