import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function Categories() {
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  function load() {
    api.get("/categories").then((res) => setCategories(res.data));
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, { name, description });
      } else {
        await api.post("/categories", { name, description });
      }
      setName("");
      setDescription("");
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || t("error"));
    }
  }

  function startEdit(cat) {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || "");
  }

  async function handleDelete(id) {
    if (!window.confirm(t("deleteConfirm"))) return;
    try {
      await api.delete(`/categories/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || t("error"));
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{t("categories")}</h1>
          <p>{t("categoriesSubtitle")}</p>
        </div>
      </div>

      {isAdmin && (
        <div className="card" style={{ maxWidth: 520, marginBottom: 20 }}>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label>{t("categoryName")} *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder={t("categoryNamePlaceholder")} />
            </div>
            <div className="form-field">
              <label>{t("description")}</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary">{editingId ? t("saveEdit") : `+ ${t("addCategory")}`}</button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setEditingId(null);
                    setName("");
                    setDescription("");
                  }}
                >
                  {t("cancel")}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>{t("description")}</th>
              <th>{t("documentCount")}</th>
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>{c.description || "—"}</td>
                <td>{c.documents_count}</td>
                {isAdmin && (
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-outline" style={{ padding: "5px 10px" }} onClick={() => startEdit(c)}>
                        {t("edit")}
                      </button>
                      <button
                        className="btn btn-danger-ghost"
                        style={{ padding: "5px 10px" }}
                        onClick={() => handleDelete(c.id)}
                      >
                        {t("delete")}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
