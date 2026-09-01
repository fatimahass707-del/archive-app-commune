import React, { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function Spaces() {
  const { user: currentUser, isAdmin } = useAuth();
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [membersMap, setMembersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState({});
  const [selectedRole, setSelectedRole] = useState({});
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, userRes] = await Promise.all([
        api.get("/categories"),
        api.get("/users"),
      ]);

      setCategories(catRes.data);
      setAllUsers(userRes.data);

      // جلب الأعضاء لكل صنف ومساحة
      const membersData = {};
      await Promise.all(
        catRes.data.map(async (cat) => {
          try {
            const mRes = await api.get(`/categories/${cat.id}/members`);
            membersData[cat.id] = mRes.data;
          } catch (e) {
            membersData[cat.id] = [];
          }
        })
      );
      setMembersMap(membersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddMember(categoryId) {
    const userId = selectedUser[categoryId];
    const roleInSpace = selectedRole[categoryId] || "member";

    if (!userId) {
      return alert(t("selectEmployeeFirst"));
    }

    setActionError("");
    setActionSuccess("");

    try {
      await api.post(`/categories/${categoryId}/members`, {
        user_id: userId,
        role_in_space: roleInSpace,
      });

      setActionSuccess(t("assignSuccess"));
      setSelectedUser({ ...selectedUser, [categoryId]: "" });
      loadData();
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err) {
      setActionError(err.response?.data?.message || t("assignError"));
    }
  }

  async function handleRemoveMember(categoryId, userId, userName) {
    if (!window.confirm(t("confirmRemoveMember", { name: userName }))) return;

    setActionError("");
    setActionSuccess("");

    try {
      await api.delete(`/categories/${categoryId}/members/${userId}`);
      setActionSuccess(t("removeSuccess"));
      loadData();
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err) {
      setActionError(err.response?.data?.message || t("removeError"));
    }
  }

  if (loading) return <div className="empty-state">{t("loadingSpaces")}</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{t("spacesTitle")}</h1>
          <p>{t("spacesSubtitle")}</p>
        </div>
      </div>

      {actionError && <div className="error-msg" style={{ marginBottom: 16 }}>{actionError}</div>}
      {actionSuccess && <div className="success-msg" style={{ marginBottom: 16 }}>{actionSuccess}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
        {categories.map((cat) => {
          const members = membersMap[cat.id] || [];
          const isUserLeadInCat = members.some((m) => m.user_id === currentUser?.id && m.role_in_space === "lead");
          const canManageSpace = isAdmin || isUserLeadInCat;

          return (
            <div key={cat.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16.5, color: "var(--color-navy)" }}>{cat.name}</h3>
                  <span className="badge active">{cat.documents_count || 0} {t("document")}</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 16 }}>
                  {cat.description || t("noDescription")}
                </p>

                <h4 style={{ fontSize: 13.5, marginBottom: 10, color: "var(--color-navy)", borderBottom: "1px solid var(--color-border)", paddingBottom: 6 }}>
                  {t("assignedEmployeesCount", { count: members.length })}
                </h4>

                {members.length === 0 ? (
                  <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", fontStyle: "italic", marginBottom: 14 }}>
                    {t("noEmployeesAssigned")}
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                    {members.map((m) => (
                      <div
                        key={m.user_id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "var(--color-bg)",
                          padding: "8px 12px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: 13.5, display: "block" }}>{m.full_name}</strong>
                          <span style={{ fontSize: 11.5, color: "var(--color-text-muted)" }}>
                            {m.email} {m.department ? `· ${m.department}` : ""}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className={`badge ${m.role_in_space === "lead" ? "admin" : "agent"}`}>
                            {m.role_in_space === "lead" ? t("spaceManager") : t("member")}
                          </span>
                          {canManageSpace && (
                            <button
                              className="btn btn-danger-ghost"
                              style={{ padding: "3px 8px", fontSize: 12 }}
                              onClick={() => handleRemoveMember(cat.id, m.user_id, m.full_name)}
                              title={t("removeFromSpace")}
                            >
                              {t("remove")}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {canManageSpace && (
                <div style={{ borderTop: "1px dashed var(--color-border)", paddingTop: 14, marginTop: 10 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    {t("addEmployeeToSpace")}:
                  </label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <select
                      style={{ flex: 1, minWidth: 140, padding: "7px 10px", fontSize: 13 }}
                      value={selectedUser[cat.id] || ""}
                      onChange={(e) => setSelectedUser({ ...selectedUser, [cat.id]: e.target.value })}
                    >
                      <option value="">{t("selectEmployeePlaceholder")}</option>
                      {allUsers
                        .filter((u) => u.role !== "admin")
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.full_name} ({u.email})
                          </option>
                        ))}
                    </select>

                    <select
                      style={{ width: 110, padding: "7px 10px", fontSize: 13 }}
                      value={selectedRole[cat.id] || "member"}
                      onChange={(e) => setSelectedRole({ ...selectedRole, [cat.id]: e.target.value })}
                    >
                      <option value="member">{t("member")}</option>
                      <option value="lead">{t("spaceManager")}</option>
                    </select>

                    <button
                      className="btn btn-primary"
                      style={{ padding: "7px 14px", fontSize: 13 }}
                      onClick={() => handleAddMember(cat.id)}
                    >
                      + {t("add")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
