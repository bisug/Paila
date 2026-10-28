"use client";

import { useUserRoles } from "@/hooks/use-user-roles";

export type GuideNavState = {
  loading: boolean;
  signedIn: boolean;
  isGuide: boolean;
  isAdmin: boolean;
  verificationStatus: "pending" | "approved" | "rejected" | null;
  pendingReviewCount: number;
};

export function useGuideNav(): GuideNavState {
  const { loading, signedIn, isGuide, isAdmin, verificationStatus, pendingGuideReviewsCount } =
    useUserRoles();

  return {
    loading,
    signedIn,
    isGuide,
    isAdmin,
    verificationStatus,
    pendingReviewCount: pendingGuideReviewsCount,
  };
}
