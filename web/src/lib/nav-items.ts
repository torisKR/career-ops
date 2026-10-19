import { LayoutDashboard, Compass, ListChecks, Send, Radar, BarChart3, FileText, Settings } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { Translations } from "@/lib/i18n";

// Single source of truth for the app's primary destinations — shared by the
// desktop sidebar and the mobile nav so they can never drift.
export type NavItem = {
  href: string;
  label: string;
  labelKey: keyof Translations;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  chip?: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Today", labelKey: "nav_today", icon: LayoutDashboard },
  { href: "/explore", label: "Explore", labelKey: "nav_explore", icon: Compass, chip: "New" },
  { href: "/pipeline", label: "Pipeline", labelKey: "nav_pipeline", icon: ListChecks },
  { href: "/followups", label: "Follow-ups", labelKey: "nav_followups", icon: Send },
  { href: "/portals", label: "Portals", labelKey: "nav_portals", icon: Radar },
  { href: "/analytics", label: "Analytics", labelKey: "nav_analytics", icon: BarChart3 },
  { href: "/cv", label: "CV", labelKey: "nav_cv", icon: FileText },
  { href: "/config", label: "Config", labelKey: "nav_config", icon: Settings },
];

export function isActivePath(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
