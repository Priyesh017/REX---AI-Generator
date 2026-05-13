export interface ProfileData {
  id: string;
  clerkId: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  plan: string;
  subscriptionStatus: string | null;
  creditsLeft: number;
  joinedAt: string;
}
