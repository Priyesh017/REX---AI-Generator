// src/config/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

const supabaseUrl = env.supabaseUrl!;
const supabaseKey = env.supabaseKey!;

console.log("ENV DEBUG:", {
  url: process.env.SUPABASE_URL ? "present" : "missing",
  key: process.env.SUPABASE_KEY ? "present" : "missing",
});

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
