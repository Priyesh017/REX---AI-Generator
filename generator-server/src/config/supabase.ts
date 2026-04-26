// src/config/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

const supabaseUrl = env.supabaseUrl!;
const supabaseKey = env.supabaseKey!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
