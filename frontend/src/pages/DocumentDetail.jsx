import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { SERVER_BASE_URL, API_BASE_URL } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function DocumentDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [doc, setDoc] = useState(null);
  const [versions, setVersions] = useState([]);
  const [previewError, setPreviewError] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    api.get(`/documents/${id}`)
      .then((res) => setDoc(res.data))
      .catch(() => setLoadError(true));
    api.get(`/documents/${id}/versions`).then((res) => setVersions(res.data));

    let blobUrl = "";
    api.get(`/documents/${id}/qrcode`, { responseType: "blob" })
      .then((res) => {
        blobUrl = URL.createObjectURL(res.data);
        setQrCodeUrl(blobUrl);
      })
      .catch((err) => {
        console.error("Error fetching QR code", err);
      });

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [id]);

  function handlePrintLabel() {
    if (!doc) return;
    const printWindow = window.open("", "_blank", "width=600,height=600");
    if (!printWindow) {
      alert(t("printLabelPopupBlocked"));
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${t("printLabelTitle")} - ${doc.reference_code}</title>
          <style>
            @page {
              size: 50mm 50mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 5px;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              direction: rtl;
              text-align: center;
              box-sizing: border-box;
              width: 50mm;
              height: 50mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .qr-code {
              width: 25mm;
              height: 25mm;
              margin-bottom: 2px;
            }
            .ref-code {
              font-family: monospace;
              font-weight: bold;
              font-size: 10px;
              background: #f0f0f0;
              padding: 2px 4px;
              border-radius: 3px;
              margin-bottom: 2px;
              word-break: break-all;
            }
            .title {
              font-size: 9px;
              font-weight: 600;
              margin: 2px 0;
              max-width: 100%;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            }
            .category {
              font-size: 8px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <img class="qr-code" src="${qrCodeUrl}" alt="QR Code" />
          <div class="ref-code">${doc.reference_code}</div>
          <div class="title">${doc.title}</div>
          <div class="category">${doc.category_name}</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  async function handleDelete() {
    if (!window.confirm(t("deleteDocConfirm"))) return;
    try {
      await api.delete(`/documents/${id}`);
      navigate("/documents");
    } catch (err) {
      alert(err.response?.data?.message || t("deleteDocError"));
    }
  }

  function handleDownload() {
    const token = localStorage.getItem("token");
    const downloadUrl = `${API_BASE_URL}/documents/${id}/download?token=${token}`;

    // Trigger download via blob with axios auth header
    api.get(`/documents/${id}/download`, { responseType: "blob" }).then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.file_original_name || `document-${doc.reference_code}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }).catch(() => {
      window.open(downloadUrl, "_blank");
    });
  }

  function handleDownloadVersion(versionId, originalName) {
    api.get(`/documents/${id}/versions/${versionId}/download`, { responseType: "blob" })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", originalName || `version-${versionId}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(() => alert(t("versionDownloadError")));
  }

  if (loadError) return <div className="empty-state" style={{ color: "var(--color-danger)" }}>⚠️ {t("notFound")}</div>;
  if (!doc) return <div className="empty-state">{t("loading")}</div>;

  // ✅ السطر الصحيح
  const fileUrl = doc.file_path ? `${SERVER_BASE_URL}/${doc.file_path.replace(/^\//, '')}` : null;
  const isImage = doc.file_path && /\.(png|jpe?g)$/i.test(doc.file_path);
  const isPdf = doc.file_path && /\.pdf$/i.test(doc.file_path);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{doc.title}</h1>
          <p>
            <span className="ref-code">{doc.reference_code}</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to={`/documents/${id}/edit`} className="btn btn-outline">
            {t("edit")}
          </Link>
          {(isAdmin || (user?.role === "agent" && (user?.spaces || []).some(s => s.category_id === doc.category_id))) && (
            <button className="btn btn-danger-ghost" onClick={handleDelete}>
              {t("delete")}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: doc.file_path ? "1fr 1fr" : "1fr", gap: 20 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>{t("docInfoHeading")}</h3>
          <dl style={{ display: "grid", gridTemplateColumns: "140px 1fr", rowGap: 14, fontSize: 14 }}>
            <dt style={{ color: "var(--color-text-muted)" }}>{t("docCategoryLabel")}</dt>
            <dd style={{ fontWeight: 600 }}>{doc.category_name}</dd>

            <dt style={{ color: "var(--color-text-muted)" }}>{t("docYearLabel")}</dt>
            <dd>{doc.doc_year}</dd>

            <dt style={{ color: "var(--color-text-muted)" }}>{t("docDepartmentLabel")}</dt>
            <dd>{doc.department || "—"}</dd>

            <dt style={{ color: "var(--color-text-muted)" }}>{t("docStatusLabel")}</dt>
            <dd>
              <span className={`badge ${doc.status}`}>{doc.status === "active" ? t("active") : t("archived")}</span>
            </dd>

            <dt style={{ color: "var(--color-text-muted)" }}>{t("docDescriptionLabel")}</dt>
            <dd>{doc.description || "—"}</dd>

            <dt style={{ color: "var(--color-text-muted)" }}>{t("docUploadedByLabel")}</dt>
            <dd>{doc.uploaded_by_name}</dd>

            <dt style={{ color: "var(--color-text-muted)" }}>{t("docCreatedAtLabel")}</dt>
            <dd>{new Date(doc.created_at).toLocaleString("fr-FR")}</dd>

            <dt style={{ color: "var(--color-text-muted)" }}>{t("docFileLabel")}</dt>
            <dd>
              {doc.file_path ? (
                <button
                  onClick={handleDownload}
                  className="btn btn-accent"
                  style={{ padding: "6px 14px" }}
                >
                  📥 {t("downloadOriginal")} ({doc.file_original_name || t("file")})
                </button>
              ) : (
                <span style={{ color: "var(--color-text-muted)" }}>{t("noFileAttached")}</span>
              )}
            </dd>

            <dt style={{ color: "var(--color-text-muted)" }}>{t("docQrLabel")}</dt>
            <dd>
              {qrCodeUrl ? (
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <img
                    src={qrCodeUrl}
                    alt={t("qrCode")}
                    style={{ width: 100, height: 100, border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: 4, background: "#fff" }}
                  />
                  <button
                    onClick={handlePrintLabel}
                    className="btn btn-outline"
                    style={{ padding: "6px 12px", fontSize: 13 }}
                  >
                    🖨️ {t("printLabel")}
                  </button>
                </div>
              ) : (
                <span style={{ color: "var(--color-text-muted)" }}>{t("loadingQr")}</span>
              )}
            </dd>
          </dl>
        </div>

        {doc.file_path && (
          <div className="card" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 16 }}>{t("previewHeading")}</h3>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ fontSize: 12, padding: "4px 8px" }}
              >
                {t("openInNewTab")}
              </a>
            </div>

            <div style={{ flex: 1, minHeight: 350, background: "#f0f2f5", borderRadius: "var(--radius-md)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isImage ? (
                <img
                  src={fileUrl}
                  alt={doc.title}
                  style={{ maxWidth: "100%", maxHeight: 480, objectFit: "contain" }}
                  onError={() => setPreviewError(true)}
                />
              ) : isPdf ? (
                <iframe
                  src={fileUrl}
                  title={t("previewHeading")}
                  width="100%"
                  height="480px"
                  style={{ border: "none" }}
                />
              ) : (
                <div style={{ textAlign: "center", padding: 24, color: "var(--color-text-muted)" }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
                  <p style={{ fontWeight: 600 }}>{doc.file_original_name}</p>
                  <p style={{ fontSize: 13 }}>{t("previewNotSupported")}</p>
                  <button onClick={handleDownload} className="btn btn-primary" style={{ marginTop: 12 }}>
                    {t("downloadFile")}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {versions.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            onClick={() => setShowVersions(!showVersions)}
          >
            <h3 style={{ fontSize: 16, margin: 0 }}>{t("previousVersions")} ({versions.length})</h3>
            <span>{showVersions ? "▲" : "▼"}</span>
          </div>

          {showVersions && (
            <div style={{ marginTop: 16 }}>
              <table className="table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>{t("originalFileName")}</th>
                    <th>{t("uploadedBy")}</th>
                    <th>{t("createdAt")}</th>
                    <th>{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map(v => (
                    <tr key={v.id}>
                      <td>{v.file_original_name}</td>
                      <td>{v.uploaded_by_name}</td>
                      <td>{new Date(v.created_at).toLocaleString("fr-FR")}</td>
                      <td>
                        <button
                          className="btn btn-outline"
                          style={{ padding: "4px 8px", fontSize: 12 }}
                          onClick={() => handleDownloadVersion(v.id, v.file_original_name)}
                        >
                          {t("download")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
