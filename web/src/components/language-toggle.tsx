"use client";

import { Globe } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, toggleLocale, t } = useI18n();

  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      onClick={toggleLocale}
      aria-label={t("lang_switch")}
      title={locale === "ko" ? "Switch to English" : "한국어로 변경"}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted hover:text-foreground",
        className,
      )}
    >
      <Globe className="size-3.5" />
      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
        {locale === "ko" ? "KO" : "EN"}
      </span>
    </Button>
  );
}
