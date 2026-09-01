import React, { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

export default function ActivityLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [actionFilter, setActionFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  // Build action map using translated labels
  const getActionMap = () => ({
    create: { label: t("actionCreate"), badgeClass: "active" },
    update: { label: t("actionUpdate"), badgeClass: "admin" },
    delete: { label: t("actionDelete"), badgeClass: "archived", customStyle: { background: "var(--color-danger-light)", color: "var(--color-danger)" } },
    login: { label: t("actionLogin"), badgeClass: "agent" },
  });

  const fetchLogs = useCallback(() => {
    setLoading(true);
    api
      .get("/activity-logs", {
        params: {
          page,
          limit: 15,
          action: actionFilter,
          user_id: userIdFilter,
          startDate,
          endDate,
          search,
        },
      })
      .then((res) => {
        setLogs(res.data.logs || []);
        setTotalPages(res.data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [page, actionFilter, userIdFilter, startDate, endDate, search]);

  useEffect(() => {
    api.get("/users").then((res) => setUsers(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [actionFilter, userIdFilter, startDate, endDate, search]);

  const renderDescription = (description) => {
    if (!description) return "—";
    try {
      const parsed = JSON.parse(description);
      if (parsed && typeof parsed === "object" && parsed.key) {
        const params = { ...parsed.params };
        // Translate specific parameter values if they correspond to role/member roles
        if (params.role) {
          params.role = t(params.role);
        }
        if (params.roleInSpace) {
          params.roleInSpace = t(params.roleInSpace);
        }
        return t(parsed.key, params);
      }
    } catch (e) {
      // Fallback
    }
    return description;
  };

  const actionMap = getActionMap();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{t("activityLogs")}</h1>
          <p>{t("logsSubtitle")}</p>
        </div>
      </div>

      <div className="filters-bar" style={{ marginBottom: 18, gap: 10 }}>
        <input
          type="text"
          placeholder={t("searchLogs")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1.5, minWidth: 200 }}
        />

        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          <option value="">{t("allActions")}</option>
          <option value="create">{t("actionCreate")}</option>
          <option value="update">{t("actionUpdate")}</option>
          <option value="delete">{t("actionDelete")}</option>
          <option value="login">{t("actionLogin")}</option>
        </select>

        <select value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)}>
          <option value="">{t("allUsers")}</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name} ({u.role === "admin" ? t("admin") : t("agent")})
            </option>
          ))}
        </select>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>{t("dateFrom")}</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: "7px 10px" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>{t("dateTo")}</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: "7px 10px" }}
          />
        </div>
      </div>

      {loading ? (
        <div className="empty-state">{t("loadingLogs")}</div>
      ) : logs.length === 0 ? (
        <div className="empty-state">{t("noMatchingLogs")}</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("dateTime")}</th>
                <th>{t("user")}</th>
                <th>{t("actionType")}</th>
                <th>{t("logDescription")}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const actInfo = actionMap[log.action] || { label: log.action, badgeClass: "archived" };
                return (
                  <tr key={log.id}>
                    <td style={{ fontSize: 12.5, whiteSpace: "nowrap", direction: "ltr", textAlign: "right", fontFamily: "var(--font-mono)" }}>
                      {new Date(log.created_at).toLocaleString("fr-FR")}
                    </td>
                    <td>
                      <strong style={{ fontSize: 13.5 }}>{log.user_name || t("systemUnknown")}</strong>
                      {log.user_email && (
                        <span style={{ display: "block", fontSize: 11.5, color: "var(--color-text-muted)" }}>
                          {log.user_email}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${actInfo.badgeClass}`} style={actInfo.customStyle}>
                        {actInfo.label}
                      </span>
                    </td>
                    <td style={{ fontSize: 13.5 }}>{renderDescription(log.description || log.details)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            {t("previous")}
          </button>
          <span style={{ alignSelf: "center", fontSize: 13.5 }}>
            {t("page")} {page} {t("of")} {totalPages}
          </span>
          <button className="btn btn-outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            {t("next")}
          </button>
        </div>
      )}
    </div>
  );
}
