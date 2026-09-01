import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProfileModal from "./ProfileModal";
import useInstallPrompt from "../hooks/useInstallPrompt";
import { useTranslation } from "react-i18next";

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const { showButton, triggerInstall, handleDismiss } = useInstallPrompt();
  const { t } = useTranslation();

  const links = [
    { to: "/", label: t("dashboard"), icon: "▦", visible: true },
    { to: "/documents", label: t("documents"), icon: "▤", visible: true },
    { to: "/categories", label: t("categories"), icon: "◈", visible: true },
    { to: "/spaces", label: t("spaces"), icon: "🏢", visible: isAdmin },
    { to: "/users", label: t("users"), icon: "◔", visible: isAdmin },
    { to: "/logs", label: t("logs"), icon: "📋", visible: isAdmin },
  ];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          style={{
            position: "fixed",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9999,
          }}
        />
      )}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-brand" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="sidebar-brand-mark">
  <img src="/logo.png" alt="شعار" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
</div>
            <div className="sidebar-brand-text">
              {t("appName")}
              <span>{t("municipality")}</span>
            </div>
          </div>
          {isOpen && (
            <button 
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#cfd8e8",
                fontSize: "20px",
                cursor: "pointer",
                padding: "4px"
              }}
            >
              ✕
            </button>
          )}
        </div>

        <nav>
          {links
            .filter((l) => l.visible)
            .map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={onClose}
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
              >
                <span>{l.icon}</span>
                {l.label}
              </NavLink>
            ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" style={{ cursor: "pointer" }} onClick={() => setShowProfile(true)} title={t("changePassword")}>
            <strong>{user?.full_name} ⚙️</strong>
            {user?.role === "admin" ? t("systemAdmin") : t("agent")} · {user?.department || "—"}
          </div>
          <button
            className="btn btn-outline"
            style={{ width: "100%", marginTop: 6, fontSize: 12, padding: "6px", color: "#c3cee2", borderColor: "rgba(255,255,255,0.2)" }}
            onClick={() => setShowProfile(true)}
          >
            🔑 {t("accountSettings")}
          </button>
          {showButton && (
            <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
              <button 
                className="btn btn-accent" 
                onClick={triggerInstall}
                style={{ flex: 1, fontSize: 12, padding: "6px" }}
              >
                {t("installApp")} 📲
              </button>
              <button 
                className="btn btn-outline" 
                onClick={handleDismiss}
                style={{ fontSize: 12, padding: "6px", color: "#c3cee2", borderColor: "rgba(255,255,255,0.2)", width: "30px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout} style={{ marginTop: 8 }}>
            {t("logout")}
          </button>
        </div>
      </aside>

      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} />}
    </>
  );
}