import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

export default function DocumentForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "",
    category_id: "",
    department: "",
    doc_year: new Date().getFullYear(),
    description: "",
    status: "active",
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data));
    if (isEdit) {
      api.get(`/documents/${id}`).then((res) => {
        const d = res.data;
        setForm({
          title: d.title,
          category_id: d.category_id,
          department: d.department || "",
          doc_year: d.doc_year,
          description: d.description || "",
          status: d.status,
        });
      });
    }
  }, [id, isEdit]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    if (file) data.append("file", file);

    try {
      if (isEdit) {
        await api.put(`/documents/${id}`, data);
      } else {
        await api.post("/documents", data);
      }
      navigate("/documents");
    } catch (err) {
      setError(err.response?.data?.message || t("serverError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{isEdit ? t("editDoc") : t("newDoc")}</h1>
          <p>{t("docSubtitle")}</p>
        </div>
      </div>

      <div className="card" style={{ margin: "0 auto" }}>
        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field full">
              <label>{t("title")} *</label>
              <input name="title" required value={form.title} onChange={handleChange} placeholder={t("docTitlePlaceholder")} />
            </div>

            <div className="form-field">
              <label>{t("category")} *</label>
              <select name="category_id" required value={form.category_id} onChange={handleChange}>
                <option value="">{t("all_categories")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>{t("year")} *</label>
              <input
                type="number"
                name="doc_year"
                required
                min="1960"
                max={new Date().getFullYear() + 1}
                value={form.doc_year}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label>{t("department")}</label>
              <input name="department" value={form.department} onChange={handleChange} placeholder={t("departmentPlaceholder")} />
            </div>

            <div className="form-field">
              <label>{t("status")}</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="active">{t("active")}</option>
                <option value="archived">{t("archived")}</option>
              </select>
            </div>

            <div className="form-field full">
              <label>{t("description")}</label>
              <textarea name="description" rows={3} value={form.description} onChange={handleChange} />
            </div>

            <div className="form-field full">
              <label>{t("file")} {isEdit ? `(${t("fileEditNote")})` : ""}</label>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" onChange={(e) => setFile(e.target.files[0])} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? t("docSaving") : isEdit ? t("saveEdit") : t("newDoc")}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
              {t("cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
