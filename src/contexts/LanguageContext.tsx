import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { en, type TranslationKeys } from "@/i18n/en";
import { ar } from "@/i18n/ar";

export type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, TranslationKeys> = { en, ar };

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("wolf-ai-language");
    return (saved === "ar" ? "ar" : "en") as Language;
  });

  const isRTL = language === "ar";

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("wolf-ai-language", lang);
  };

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("dir", isRTL ? "rtl" : "ltr");
    html.setAttribute("lang", language);
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
        isRTL,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
