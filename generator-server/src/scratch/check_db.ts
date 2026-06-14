// src/scratch/check_db.ts
import { supabase } from "../config/supabase";

async function main() {
  console.log("--- Querying profiles ---");
  const { data: profile, error } = await supabase.from("profiles").select("*").limit(1);
  if (error) {
    console.error("Profiles error:", error);
  } else {
    console.log("Profiles columns:", Object.keys(profile[0] || {}));
    console.log("Profiles sample:", profile[0]);
  }

  console.log("--- Querying orders ---");
  const { data: order, error: orderError } = await supabase.from("orders").select("*").limit(1);
  if (orderError) {
    console.error("Orders error:", orderError);
  } else {
    console.log("Orders columns:", Object.keys(order[0] || {}));
    console.log("Orders sample:", order[0]);
  }

  console.log("--- Querying generated_assets ---");
  const { data: asset, error: assetError } = await supabase.from("generated_assets").select("*").limit(1);
  if (assetError) {
    console.error("Assets error:", assetError);
  } else {
    console.log("Assets columns:", Object.keys(asset[0] || {}));
    console.log("Assets sample:", asset[0]);
  }
}

main();
