import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import AdvancedSearchFilter from "../components/AdvancedSearchFilter";
import { useTranslation } from "react-i18next";

export default function Documents() {
  const { user, isAdmin } = useAuth();
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewTrash, setViewTrash] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");

  const userSpaces = user?.spaces || [];

  const fetchDocuments = useCallback(() => {
    setLoading(true);
    const endpoint = viewTrash ? "/documents/trash" : "/documents";
    const params = viewTrash
      ? { page, limit: 12 }
      : { search, category_id: categoryId, year, status, department, page, limit: 12 };

    api
      .get(endpoint, { params })
      .then((res) => {
        setDocuments(res.data.documents || []);
        setTotalPages(res.data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [viewTrash, search, categoryId, year, status, department, page]);

  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryId, year, status, department, viewTrash]);

  async function handleDelete(id) {
    if (!window.confirm(t("deleteConfirmTrash"))) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || t("deleteError"));
    }
  }

  async function handleRestore(id) {
    try {
      await api.post(`/documents/${id}/restore`);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || t("restoreError"));
    }
  }

  async function handlePermanentDelete(id) {
    if (!window.confirm(t("permanentDeleteConfirm"))) return;
    try {
      await api.delete(`/documents/${id}/permanent`);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || t("permanentDeleteError"));
    }
  }

  function handleExportExcel() {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (categoryId) params.append("category_id", categoryId);
    if (year) params.append("year", year);
    if (status) params.append("status", status);
    if (department) params.append("department", department);

    api.get(`/documents/export?${params.toString()}`, { responseType: "blob" })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `jamaa-documents-${new Date().toISOString().slice(0, 10)}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((err) => {
        alert(t("exportError"));
      });
  }

  function handlePrint() {
    window.print();
  }

  const handleSearch = (newFilters) => {
    setSearch(newFilters.search || "");
    setCategoryId(newFilters.categoryId || "");
    setYear(newFilters.year || "");
    setStatus(newFilters.status || "");
    setDepartment(newFilters.department || "");
  };

  const handleClear = () => {
    setSearch("");
    setCategoryId("");
    setYear("");
    setStatus("");
    setDepartment("");
  };

  const availableCategories = isAdmin
    ? categories
    : categories.filter((c) => userSpaces.some((s) => s.category_id === c.id));

  if (!isAdmin && userSpaces.length === 0) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>{t("documents")}</h1>
            <p>{t("dashboardSubtitle")}</p>
          </div>
        </div>
        <div className="card empty-state" style={{ padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
          <h3 style={{ marginBottom: 8, color: "var(--color-navy)" }}>{t("my_spaces")}</h3>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1>{viewTrash ? t("trash") : t("documents")}</h1>
            {!isAdmin && userSpaces.length === 1 && (
              <span className="badge active" style={{ fontSize: 13, padding: "4px 12px" }}>
                {t("category")}: {userSpaces[0].category_name}
              </span>
            )}
            {!isAdmin && userSpaces.length > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "var(--color-teal-light)", padding: "4px 10px", borderRadius: "var(--radius-sm)" }}>
                <strong>{t("category")}:</strong>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
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
          <p>{viewTrash ? t("trash") : t("dashboardSubtitle")}</p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {isAdmin && (
            <button
              className={`btn ${viewTrash ? "btn-primary" : "btn-outline"}`}
              onClick={() => setViewTrash(!viewTrash)}
              style={viewTrash ? { background: "var(--color-danger)" } : {}}
            >
              {viewTrash ? `📄 ${t("back")}` : `🗑️ ${t("trash")}`}
            </button>
          )}
          <button className="btn btn-outline" onClick={handleExportExcel}>
            📊 {t("export")}
          </button>
          <button className="btn btn-outline" onClick={handlePrint}>
            🖨️ {t("print")}
          </button>
          <Link to="/documents/new" className="btn btn-accent">
            + {t("add")}
          </Link>
        </div>
      </div>

      {!viewTrash && (
        <AdvancedSearchFilter
          onSearch={handleSearch}
          onClear={handleClear}
          initialFilters={{ search, categoryId, year, status, department }}
          isAdmin={isAdmin}
          categories={availableCategories}
        />
      )}

      {loading ? (
        <div className="empty-state">{t("loading")}</div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <p>{t("noResults")}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("referenceCode")}</th>
                <th>{t("title")}</th>
                <th>{t("category")}</th>
                <th>{t("year")}</th>
                <th>{t("status")}</th>
                <th>{viewTrash ? t("deletedAt") : t("uploadedBy")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id}>
                  <td>
                    <span className="ref-code">{d.reference_code}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{d.title}</td>
                  <td>{d.category_name}</td>
                  <td>{d.doc_year}</td>
                  <td>
                    <span className={`badge ${viewTrash ? "archived" : d.status}`}>
                      {viewTrash ? t("trash") : d.status === "active" ? t("active") : t("archived")}
                    </span>
                  </td>
                  <td>
                    {viewTrash
                      ? new Date(d.deleted_at).toLocaleString("fr-FR")
                      : d.uploaded_by_name}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      {viewTrash ? (
                        <>
                          <button
                            className="btn btn-accent"
                            style={{ padding: "5px 12px" }}
                            onClick={() => handleRestore(d.id)}
                          >
                            🔄 {t("restore")}
                          </button>
                          <button
                            className="btn btn-danger-ghost"
                            style={{ padding: "5px 12px" }}
                            onClick={() => handlePermanentDelete(d.id)}
                          >
                            🗑️ {t("permanentDelete")}
                          </button>
                        </>
                      ) : (
                        <>
                          <Link to={`/documents/${d.id}`} className="btn btn-outline" style={{ padding: "5px 10px" }}>
                            {t("view")}
                          </Link>
                          {(isAdmin || (user?.role === "agent" && userSpaces.some(s => s.category_id === d.category_id))) && (
                            <button
                              className="btn btn-danger-ghost"
                              style={{ padding: "5px 10px" }}
                              onClick={() => handleDelete(d.id)}
                            >
                              {t("delete")}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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