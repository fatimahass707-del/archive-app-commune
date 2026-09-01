import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import translationAR from "./locales/ar/translation.json";
import translationFR from "./locales/fr/translation.json";
import translationEN from "./locales/en/translation.json";

const resources = {
  ar: {
    translation: translationAR,
  },
  fr: {
    translation: translationFR,
  },
  en: {
    translation: translationEN,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "ar",
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
});

// Initialize on first load
const initialLng = i18n.language || "ar";
document.documentElement.lang = initialLng;
document.documentElement.dir = initialLng.startsWith("ar") ? "rtl" : "ltr";

export default i18n;
