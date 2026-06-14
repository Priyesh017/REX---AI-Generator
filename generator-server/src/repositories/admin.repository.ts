// src/repositories/admin.repository.ts
import { supabase } from "../config/supabase";

export async function countProfiles(): Promise<number> {
  const { count, error } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`DB error counting profiles: ${error.message}`);
  return count ?? 0;
}

export async function countImages(): Promise<number> {
  const { count, error } = await supabase
    .from("generated_assets")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`DB error counting images: ${error.message}`);
  return count ?? 0;
}

export async function getPaidOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("plan:plan_id(price), created_at")
    .eq("status", "paid");
  if (error) throw new Error(`DB error getting paid orders: ${error.message}`);
  return data;
}

export async function listUsers(search?: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (search) {
    // Sanitize search to avoid PostgREST injection (SEC-004)
    const sanitizedSearch = search.replace(/[^a-zA-Z0-9@.\s_-]/g, "");
    if (sanitizedSearch) {
      query = query.or(`display_name.ilike.%${sanitizedSearch}%,username.ilike.%${sanitizedSearch}%,clerk_id.eq.${sanitizedSearch}`);
    }
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) throw new Error(`DB error listing users: ${error.message}`);
  return { users: data || [], total: count ?? 0 };
}

export async function listTransactions(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const { data, error, count } = await supabase
    .from("orders")
    .select(`
      *,
      plans (name),
      profile:profile_id (display_name, clerk_id)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`DB error listing transactions: ${error.message}`);
  return { transactions: data || [], total: count ?? 0 };
}

export async function listImages(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const { data, error, count } = await supabase
    .from("generated_assets")
    .select(`
      *,
      profiles!inner(display_name)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`DB error listing images: ${error.message}`);
  return { images: data || [], total: count ?? 0 };
}

export async function updateUser(userId: string, credits: number, plan: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ credits, current_plan: plan })
    .eq("clerk_id", userId);

  if (error) throw new Error(`DB error updating user details: ${error.message}`);
}
