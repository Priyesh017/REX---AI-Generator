// src/repositories/moderation.repository.ts
import { supabase } from "../config/supabase";

export interface ReportRecord {
  id: string;
  reporter_profile_id: string;
  post_id: string | null;
  comment_id: string | null;
  reason: string;
  status: string;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  moderator_profile_id: string | null;
  action: string;
  target_type: string;
  target_id: string;
  details: any;
  created_at: string;
}

export async function createReport(payload: {
  reporterProfileId: string;
  postId?: string;
  commentId?: string;
  reason: string;
}): Promise<ReportRecord> {
  const { data, error } = await supabase
    .from("reports")
    .insert([
      {
        reporter_profile_id: payload.reporterProfileId,
        post_id: payload.postId || null,
        comment_id: payload.commentId || null,
        reason: payload.reason,
        status: "pending",
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`DB error in createReport: ${error.message}`);
  }

  return data as ReportRecord;
}

export async function hasReported(
  reporterProfileId: string,
  target: { postId?: string; commentId?: string }
): Promise<boolean> {
  let query = supabase
    .from("reports")
    .select("id")
    .eq("reporter_profile_id", reporterProfileId);

  if (target.postId) {
    query = query.eq("post_id", target.postId);
  } else if (target.commentId) {
    query = query.eq("comment_id", target.commentId);
  } else {
    return false;
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`DB error in hasReported: ${error.message}`);
  return !!data;
}

export async function createAuditLog(payload: {
  moderatorProfileId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  details?: any;
}): Promise<void> {
  const { error } = await supabase.from("audit_logs").insert([
    {
      moderator_profile_id: payload.moderatorProfileId,
      action: payload.action,
      target_type: payload.targetType,
      target_id: payload.targetId,
      details: payload.details || null,
    },
  ]);

  if (error) {
    throw new Error(`DB error in createAuditLog: ${error.message}`);
  }
}

export async function listPendingReports(limit = 20, cursor?: string) {
  let query = supabase
    .from("reports")
    .select(`
      *,
      reporter:profiles!reporter_profile_id(username, display_name)
    `)
    .eq("status", "pending");

  if (cursor) {
    const { data: cursorReport } = await supabase
      .from("reports")
      .select("created_at")
      .eq("id", cursor)
      .single();

    if (cursorReport) {
      query = query.lt("created_at", cursorReport.created_at);
    }
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`DB error in listPendingReports: ${error.message}`);
  return data || [];
}

export async function updateReportStatus(reportId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", reportId);

  if (error) throw new Error(`DB error in updateReportStatus: ${error.message}`);
}
