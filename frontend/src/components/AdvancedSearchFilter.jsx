import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

export default function AdvancedSearchFilter({ onSearch, onClear, initialFilters = {}, isAdmin, categories = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    search: initialFilters.search || "",
    categoryId: initialFilters.categoryId || "",
    status: initialFilters.status || "",
    year: initialFilters.year || "",
    department: initialFilters.department || "",
  });

  // Update internal filters state if initial filters change
  useEffect(() => {
    setFilters({
      search: initialFilters.search || "",
      categoryId: initialFilters.categoryId || "",
      status: initialFilters.status || "",
      year: initialFilters.year || "",
      department: initialFilters.department || "",
    });
  }, [initialFilters]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleClearClick = () => {
    const cleared = {
      search: "",
      categoryId: "",
      status: "",
      year: "",
      department: "",
    };
    setFilters(cleared);
    onClear();
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-outline"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
          fontSize: "14px"
        }}
      >
        🔍 {isOpen ? t("hideAdvancedSearch") : t("advancedSearch")}
      </button>

      {isOpen && (
        <div
          className="card"
          style={{
            padding: "20px",
            backgroundColor: "#fff",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border, #eee)",
            animation: "slideDown 0.2s ease-out"
          }}
        >
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "20px"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--color-text-muted)" }}>{t("keyword")}</label>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleChange}
                  placeholder={t("searchPlaceholder")}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--color-text-muted)" }}>{t("category")}</label>
                <select
                  name="categoryId"
                  value={filters.categoryId}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                >
                  <option value="">{isAdmin ? t("all_categories") : t("my_spaces")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--color-text-muted)" }}>{t("status")}</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                >
                  <option value="">{t("status")}</option>
                  <option value="active">{t("active")}</option>
                  <option value="archived">{t("archived")}</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--color-text-muted)" }}>{t("year")}</label>
                <input
                  type="number"
                  name="year"
                  value={filters.year}
                  onChange={handleChange}
                  placeholder="2026"
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--color-text-muted)" }}>{t("department")}</label>
                <input
                  type="text"
                  name="department"
                  value={filters.department}
                  onChange={handleChange}
                  placeholder={t("department")}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="submit" className="btn btn-accent">
                {t("search")}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleClearClick}
              >
                {t("clearFilters")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
