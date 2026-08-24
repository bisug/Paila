"use server";

import { createAuthenticatedSupabaseClient } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type GuideVerificationSubmission = {
  id: string;
  user_id: string;
  full_name: string;
  guide_id_number: string;
  place: string;
  phone: string;
  id_card_path: string;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
  created_at: string;
};

async function requireAdmin() {
  const { supabase, userId } = await createAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");

  return { supabase, userId };
}

async function signGuideIdUrls(submissions: GuideVerificationSubmission[]) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Demo mode: no storage credentials, so return a placeholder per submission.
    return Object.fromEntries(
      submissions.map((s) => [
        s.id,
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=70",
      ]),
    );
  }

  const imageUrls: Record<string, string> = {};
  await Promise.all(
    submissions.map(async (submission) => {
      const { data } = await supabaseAdmin.storage
        .from("guide-ids")
        .createSignedUrl(submission.id_card_path, 60 * 30);
      if (data?.signedUrl) imageUrls[submission.id] = data.signedUrl;
    }),
  );

  return imageUrls;
}

export async function listGuideVerificationReviewData() {
  const { supabase } = await requireAdmin();
  const [submissionsResult, settingsResult] = await Promise.all([
    supabase.from("guide_verifications").select("*").order("created_at", { ascending: false }),
    supabase.from("admin_settings").select("admin_email").eq("id", 1).maybeSingle(),
  ]);

  if (submissionsResult.error) throw new Error(submissionsResult.error.message);
  if (settingsResult.error) throw new Error(settingsResult.error.message);

  const submissions = (submissionsResult.data ?? []) as GuideVerificationSubmission[];

  return {
    submissions,
    imageUrls: await signGuideIdUrls(submissions),
    adminEmail: settingsResult.data?.admin_email ?? "",
  };
}

export async function saveAdminNotificationEmail({ data }: { data: { adminEmail: string } }) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("admin_settings")
    .update({
      admin_email: data.adminEmail.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function reviewGuideVerification({
  data,
}: {
  data: {
    id: string;
    status: "approved" | "rejected";
    reviewNote?: string | null;
  };
}) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("guide_verifications")
    .update({
      status: data.status,
      review_note: data.reviewNote?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (error) throw new Error(error.message);
  return { ok: true };
}
