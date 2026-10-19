"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DICTIONARY, type Locale, type Translations } from "@/lib/i18n";

const STORAGE_KEY = "career-ops:lang";

interface LanguageContextType {
  locale: Locale;
  setLocale: (next: Locale) => void;
  toggleLocale: () => void;
  t: (key: keyof Translations, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ko");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === "ko" || saved === "en") {
        setLocaleState(saved);
        document.documentElement.lang = saved;
      } else {
        // Default to Korean if browser is ko or project config is Korean
        const browserKo = navigator.language?.toLowerCase().startsWith("ko");
        const initial: Locale = browserKo ? "ko" : "ko"; // default Korean
        setLocaleState(initial);
        document.documentElement.lang = initial;
      }
    } catch {
      // localStorage unavailable (SSR/private mode)
    }
    setMounted(true);
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    document.documentElement.lang = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent("languagechange", { detail: next }));
  };

  const toggleLocale = () => {
    const next: Locale = locale === "ko" ? "en" : "ko";
    setLocale(next);
  };

  const t = (key: keyof Translations, params?: Record<string, string | number>): string => {
    const dict = DICTIONARY[locale] || DICTIONARY.ko;
    let str = dict[key] || DICTIONARY.en[key] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replaceAll(`{${k}}`, String(v));
      }
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback safe context if used outside provider
    return {
      locale: "ko" as Locale,
      setLocale: () => {},
      toggleLocale: () => {},
      t: (key: keyof Translations, params?: Record<string, string | number>) => {
        let str = DICTIONARY.ko[key] || key;
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            str = str.replaceAll(`{${k}}`, String(v));
          }
        }
        return str;
      },
    };
  }
  return ctx;
}
