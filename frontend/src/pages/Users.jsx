import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

export default function Users() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "agent",
    department: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  function load() {
    api.get("/users").then((res) => setUsers(res.data));
  }

  useEffect(load, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/register", form);
      setForm({ full_name: "", email: "", password: "", role: "agent", department: "" });
      setShowForm(false);
      load();
      // التوجيه لصفحة تعيين المساحات بعد إنشاء الموظف
      if (window.confirm(t("spaceAssignPrompt"))) {
        navigate("/spaces");
      }
    } catch (err) {
      setError(err.response?.data?.message || t("serverError"));
    }
  }

  async function handleResetPasswordSubmit(e) {
    e.preventDefault();
    setError("");
    setResetSuccess("");
    try {
      await api.put(`/users/${resetUser.id}/reset-password`, { new_password: newPassword });
      setResetSuccess(t("resetPasswordSuccess"));
      setNewPassword("");
      setTimeout(() => {
        setResetUser(null);
        setResetSuccess("");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || t("serverError"));
    }
  }

  async function toggleActive(u) {
    try {
      await api.put(`/users/${u.id}`, {
        full_name: u.full_name,
        role: u.role,
        department: u.department,
        is_active: !u.is_active,
      });
      load();
    } catch (err) {
      alert(err.response?.data?.message || t("serverError"));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(t("deleteUserConfirm"))) return;
    try {
      await api.delete(`/users/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || t("serverError"));
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{t("users")}</h1>
          <p>{t("usersSubtitle")}</p>
        </div>
        <button className="btn btn-accent" onClick={() => { setError(""); setShowForm(true); }}>
          + {t("addUser")}
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("fullName")}</th>
              <th>{t("email")}</th>
              <th>{t("role")}</th>
              <th>{t("departmentName")}</th>
              <th>{t("status")}</th>
              <th>{t("createdAt")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.role}`}>{u.role === "admin" ? t("admin") : t("agent")}</span>
                </td>
                <td>{u.department || "—"}</td>
                <td>
                  <span className={`badge ${u.is_active ? "active" : "archived"}`}>
                    {u.is_active ? t("active") : t("inactive")}
                  </span>
                </td>
                <td style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
                  {new Date(u.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {u.role !== "admin" && (
                      <Link
                        to="/spaces"
                        className="btn btn-outline"
                        style={{ padding: "5px 10px", fontSize: 12 }}
                        title={t("assignSpace")}
                      >
                        🏢 {t("assignSpace")}
                      </Link>
                    )}
                    <button
                      className="btn btn-outline"
                      style={{ padding: "5px 10px", fontSize: 12 }}
                      onClick={() => { setError(""); setResetSuccess(""); setResetUser(u); }}
                    >
                      🔑 {t("resetPassword")}
                    </button>
                    <button className="btn btn-outline" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => toggleActive(u)}>
                      {u.is_active ? t("deactivate") : t("activate")}
                    </button>
                    <button
                      className="btn btn-danger-ghost"
                      style={{ padding: "5px 10px", fontSize: 12 }}
                      onClick={() => handleDelete(u.id)}
                    >
                      {t("delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal إضافة موظف */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>{t("addUser")}</h3>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>{t("fullName")} *</label>
                <input name="full_name" required value={form.full_name} onChange={handleChange} placeholder={t("fullName")} />
              </div>
              <div className="form-field">
                <label>{t("email")} *</label>
                <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="m.alami@jamaa.ma" />
              </div>
              <div className="form-field">
                <label>{t("tempPassword")} *</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    style={{ width: "100%", paddingLeft: "36px" }}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                    title={showPassword ? t("hidePassword") : t("showPassword")}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="form-field">
                <label>{t("role")}</label>
                <select name="role" value={form.role} onChange={handleChange}>
                  <option value="agent">{t("agent")}</option>
                  <option value="admin">{t("admin")}</option>
                </select>
              </div>
              <div className="form-field">
                <label>{t("departmentName")}</label>
                <input name="department" value={form.department} onChange={handleChange} placeholder={t("departmentPlaceholder")} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button className="btn btn-primary">{t("addUser")}</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                  {t("cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal إعادة ضبط كلمة السر */}
      {resetUser && (
        <div className="modal-backdrop" onClick={() => setResetUser(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 6 }}>{t("resetPassword")}</h3>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 16 }}>
              {t("employee")}: <strong>{resetUser.full_name}</strong> ({resetUser.email})
            </p>
            {error && <div className="error-msg">{error}</div>}
            {resetSuccess && <div className="success-msg">{resetSuccess}</div>}

            <form onSubmit={handleResetPasswordSubmit}>
              <div className="form-field">
                <label>{t("newPassword")} *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("newPasswordPlaceholder")}
                />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button className="btn btn-primary">{t("changePassword")}</button>
                <button type="button" className="btn btn-outline" onClick={() => setResetUser(null)}>
                  {t("cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
