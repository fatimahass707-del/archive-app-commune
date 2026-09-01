import React, { useState } from "react";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

export default function ProfileModal({ user, onClose }) {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      return setError(t("passwordMismatch"));
    }
    if (newPassword.length < 6) {
      return setError(t("passwordTooShort"));
    }

    setLoading(true);
    try {
      await api.put("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess(t("passwordChanged"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || t("passwordChangeError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 12 }}>{t("profileAndAccount")}</h3>

        <div style={{ background: "var(--color-bg)", padding: 14, borderRadius: "var(--radius-sm)", marginBottom: 18, fontSize: 13.5 }}>
          <div style={{ marginBottom: 4 }}><strong>{t("nameLabelColon")}</strong> {user?.full_name}</div>
          <div style={{ marginBottom: 4 }}><strong>{t("emailLabelColon")}</strong> {user?.email}</div>
          <div style={{ marginBottom: 4 }}><strong>{t("roleLabelColon")}</strong> {user?.role === "admin" ? t("systemAdmin") : t("agent")}</div>
          <div><strong>{t("departmentLabelColon")}</strong> {user?.department || "—"}</div>
        </div>

        <h4 style={{ fontSize: 14, marginBottom: 12, borderTop: "1px solid var(--color-border)", paddingTop: 14 }}>
          {t("changePasswordHeading")}
        </h4>

        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>{t("currentPasswordLabel")}</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="form-field">
            <label>{t("newPasswordLabel")}</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("newPasswordPlaceholder")}
            />
          </div>

          <div className="form-field">
            <label>{t("confirmPasswordLabel")}</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="btn btn-primary" disabled={loading}>
              {loading ? t("savingPassword") : t("saveNewPassword")}
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              {t("close")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
