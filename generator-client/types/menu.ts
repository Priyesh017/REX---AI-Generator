import type { ReactNode } from "react";

export interface MenuItem {
  icon: ReactNode;
  label: string;
  href: string;
  gradient: string;
  iconColor: string;
}
