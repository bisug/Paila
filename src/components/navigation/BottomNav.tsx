"use client";

import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { MobileBottomNav } from "@/components/layout/AppShellNavigation";

export function BottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  return <MobileBottomNav pathname={pathname} t={t} />;
}
