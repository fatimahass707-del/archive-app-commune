import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const PIE_COLORS = ["#1b2a4a", "#2d6e7e", "#d98e4a", "#3f7d58", "#8a5423", "#6b7580"];

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const { t } = useTranslation();

  const userSpaces = user?.spaces || [];

  const fetchStats = useCallback((catId) => {
    setLoading(true);
    api
      .get("/stats/dashboard", {
        params: catId ? { category_id: catId } : {},
      })
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStats(selectedSpaceId);
  }, [fetchStats, selectedSpaceId]);

  if (loading) return <div className="empty-state">{t("loading")}</div>;
  if (!stats) return <div className="empty-state">{t("noData")}</div>;

  // إعداد عنوان وتسمية المساحة المعروضة
  let subtitle = t("dashboardSubtitle");
  if (!isAdmin) {
    if (userSpaces.length === 1) {
      subtitle = `${t("category")}: ${userSpaces[0].category_name}`;
    } else if (userSpaces.length > 1) {
      const currentSpace = userSpaces.find((s) => s.category_id === parseInt(selectedSpaceId));
      subtitle = currentSpace
        ? `${t("category")}: ${currentSpace.category_name}`
        : t("my_spaces");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1>{t("dashboard")}</h1>
            {!isAdmin && userSpaces.length > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "var(--color-teal-light)", padding: "4px 12px", borderRadius: "var(--radius-sm)" }}>
                <strong>{t("category")}:</strong>
                <select
                  value={selectedSpaceId}
                  onChange={(e) => setSelectedSpaceId(e.target.value)}
                  style={{ border: "none", background: "transparent", fontWeight: 600, color: "var(--color-navy)", cursor: "pointer" }}
                >
                  <option value="">{t("my_spaces")} ({userSpaces.length})</option>
                  {userSpaces.map((s) => (
                    <option key={s.category_id} value={s.category_id}>
                      {s.category_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <p style={{ color: "var(--color-teal)", fontWeight: 600, marginTop: 4 }}>{subtitle}</p>
        </div>

        <Link to="/documents/new" className="btn btn-accent">
          + {t("add")}
        </Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card navy">
          <div className="stat-label">{t("totalDocuments")}</div>
          <div className="stat-value">{stats.totals.documents}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">{t("activeDocuments")}</div>
          <div className="stat-value">{stats.totals.active}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t("archivedDocuments")}</div>
          <div className="stat-value">{stats.totals.archived}</div>
        </div>
        <div className="stat-card teal">
          <div className="stat-label">{isAdmin ? t("categories") : t("spaces")}</div>
          <div className="stat-value">{stats.totals.categories}</div>
        </div>
        {stats.showUsersCard !== false && (
          <div className="stat-card accent">
            <div className="stat-label">{t("activeUsers")}</div>
            <div className="stat-value">{stats.totals.users}</div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18, marginBottom: 22 }}>
        <div className="card">
          <h3 style={{ marginBottom: 14, fontSize: 15 }}>{t("documentsByYear")}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[...stats.byYear].reverse()}>
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-teal)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 14, fontSize: 15 }}>{t("distributionByCategory")}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={stats.byCategory}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={85}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {stats.byCategory.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 14, fontSize: 15 }}>{t("recentDocuments")}</h3>
        {stats.recentDocs.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", fontSize: 13.5 }}>{t("noRecentDocuments")}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stats.recentDocs.map((d) => (
              <div
                key={d.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{d.title}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                    {d.category_name} · {t("uploadedBy")} {d.uploaded_by_name}
                  </div>
                </div>
                <span className="ref-code">{d.reference_code}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}