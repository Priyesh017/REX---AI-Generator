// src/services/admin.service.ts
import * as adminRepo from "../repositories/admin.repository";

export async function getStats() {
  const [userCount, imageCount, paidOrders] = await Promise.all([
    adminRepo.countProfiles(),
    adminRepo.countImages(),
    adminRepo.getPaidOrders(),
  ]);

  const totalRevenue = paidOrders?.reduce((acc, curr: any) => acc + (curr.plan?.price || 0), 0) || 0;

  // Revenue over last 7 days (Chart Data)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  const chartData = last7Days.map((date) => {
    const dailyRev = paidOrders?.filter((o: any) => o.created_at.startsWith(date))
      .reduce((acc: number, curr: any) => acc + (curr.plan?.price || 0), 0) || 0;
    return { date, revenue: dailyRev };
  });

  return {
    stats: { totalUsers: userCount, totalImages: imageCount, totalRevenue },
    chartData,
  };
}

export async function getUsers(search?: string, page = 1, limit = 20) {
  const { users, total } = await adminRepo.listUsers(search, page, limit);

  const formattedUsers = users.map((p) => ({
    clerk_id: p.clerk_id,
    name: p.display_name || p.username || "Unknown",
    email: "N/A",
    credits: p.credits,
    current_plan: p.current_plan,
    created_at: p.created_at,
  }));

  return { users: formattedUsers, total };
}

export async function getTransactions(page = 1, limit = 20) {
  const { transactions, total } = await adminRepo.listTransactions(page, limit);

  const flattened = transactions.map((t: any) => ({
    ...t,
    user_name: t.profile?.display_name || "Unknown",
    user_email: "N/A",
    plan_name: t.plans?.name || "N/A",
  }));

  return { transactions: flattened, total };
}

export async function getImages(page = 1, limit = 20) {
  const { images, total } = await adminRepo.listImages(page, limit);

  const flattened = images.map((i: any) => ({
    ...i,
    user_name: i.profiles?.display_name || "Unknown",
  }));

  return { images: flattened, total };
}

export async function updateUser(userId: string, credits: number, plan: string) {
  await adminRepo.updateUser(userId, credits, plan);
  return { message: "User updated successfully" };
}
