import React from "react";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ fontSize: "16px" }}>🌐</span>
      <select
        value={i18n.language}
        onChange={handleLanguageChange}
        style={{
          border: "1px solid var(--color-border, #eee)",
          borderRadius: "var(--radius-sm, 4px)",
          padding: "4px 8px",
          fontSize: "13px",
          background: "#fff",
          cursor: "pointer",
          minHeight: "36px",
          height: "36px",
          color: "var(--color-navy)"
        }}
      >
        <option value="ar">العربية</option>
        <option value="fr">Français</option>
        <option value="en">English</option>
      </select>
    </div>
  );
}
