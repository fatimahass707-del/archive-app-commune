import React, { useEffect, useState, useRef } from "react";
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

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [isScannerLoading, setIsScannerLoading] = useState(false);
  const [scannerHint, setScannerHint] = useState("");
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scannerRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [cameraStream]);

  const startCameraAndScanner = async () => {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setCameraError(t("cameraAccessDenied"));
    }
  };

  const startScanningLoop = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && scannerRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext("2d");
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          try {
            const resultCanvas = scannerRef.current.highlightPaper(canvas);
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(resultCanvas, 0, 0);
          } catch (err) {
            // ignore highlight errors
          }
        }
      }
    }, 100);
  };

  const openCamera = () => {
    setIsCameraOpen(true);
    setCapturedImage(null);
    setCameraError("");
    setScannerHint("");
    setIsScannerLoading(true);

    if (!window.cv || !window.jscanify) {
      const loadScripts = () => {
        return new Promise((resolve) => {
          let loadedCount = 0;
          const checkDone = () => {
            loadedCount++;
            if (loadedCount === 2) resolve();
          };
          
          if (!window.cv) {
            const cvScript = document.createElement("script");
            cvScript.src = "https://docs.opencv.org/4.7.0/opencv.js";
            cvScript.async = true;
            cvScript.onload = checkDone;
            document.body.appendChild(cvScript);
          } else {
            checkDone();
          }
          
          if (!window.jscanify) {
            const jsScript = document.createElement("script");
            jsScript.src = "https://cdn.jsdelivr.net/gh/ColonelParrot/jscanify@master/src/jscanify.min.js";
            jsScript.async = true;
            jsScript.onload = checkDone;
            document.body.appendChild(jsScript);
          } else {
            checkDone();
          }
        });
      };

      loadScripts().then(() => {
        const checkCv = setInterval(() => {
          if (window.cv && window.cv.Mat && window.jscanify) {
            clearInterval(checkCv);
            scannerRef.current = new window.jscanify();
            setIsScannerLoading(false);
            startCameraAndScanner();
          }
        }, 100);
      });
    } else {
      if (!scannerRef.current) scannerRef.current = new window.jscanify();
      setIsScannerLoading(false);
      startCameraAndScanner();
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setCameraStream(null);
    setIsCameraOpen(false);
    setCapturedImage(null);
    setScannerHint("");
  };

  const captureImage = () => {
    if (videoRef.current && scannerRef.current) {
      const video = videoRef.current;
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const ctx = tempCanvas.getContext("2d");
      ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

      let finalCanvas = tempCanvas;
      
      try {
        const extracted = scannerRef.current.extractPaper(tempCanvas, tempCanvas.width, tempCanvas.height);
        if (extracted) {
           const enhancedCanvas = document.createElement("canvas");
           enhancedCanvas.width = extracted.width;
           enhancedCanvas.height = extracted.height;
           const enhancedCtx = enhancedCanvas.getContext("2d");
           enhancedCtx.filter = "contrast(1.2) brightness(1.1)";
           enhancedCtx.drawImage(extracted, 0, 0);
           finalCanvas = enhancedCanvas;
           setScannerHint("");
        } else {
           setScannerHint(t("scannerFallbackHint"));
        }
      } catch (err) {
         console.warn("jscanify extraction failed:", err);
         setScannerHint(t("scannerFallbackHint"));
      }
      
      setCapturedImage(finalCanvas.toDataURL("image/jpeg"));
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    }
  };

  const confirmImage = () => {
    if (capturedImage) {
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const newFile = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
          setFile(newFile);
          closeCamera();
        });
    }
  };

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
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" onChange={(e) => setFile(e.target.files[0])} />
                <button type="button" className="btn btn-outline" onClick={openCamera}>
                  {t("captureWithCamera")}
                </button>
              </div>
              {file && (
                <div style={{ marginTop: "8px", fontSize: "0.9em", color: "var(--text-secondary, #666)" }}>
                  {file.name}
                </div>
              )}
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

      {isCameraOpen && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            className="modal-box card"
            style={{
              backgroundColor: "var(--bg-card, #fff)",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "100%",
              margin: "20px",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "15px" }}>{t("cameraModalTitle")}</h3>
            
            {cameraError ? (
              <div className="error-msg">{cameraError}</div>
            ) : isScannerLoading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
                {t("scannerLoading")}
              </div>
            ) : capturedImage ? (
              <div>
                {scannerHint && <div style={{ marginBottom: "10px", fontSize: "0.9em", color: "var(--text-secondary)" }}>{scannerHint}</div>}
                <img src={capturedImage} alt="Captured" style={{ width: "100%", borderRadius: "4px" }} />
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ display: "none" }}
                  onCanPlay={() => {
                    videoRef.current?.play();
                    startScanningLoop();
                  }}
                />
                <canvas 
                  ref={canvasRef} 
                  style={{ width: "100%", borderRadius: "4px", backgroundColor: "#000" }} 
                />
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "15px", justifyContent: "flex-end" }}>
              {capturedImage ? (
                <>
                  <button type="button" className="btn btn-outline" onClick={() => setCapturedImage(null)}>
                    {t("retake")}
                  </button>
                  <button type="button" className="btn btn-primary" onClick={confirmImage}>
                    {t("useThisPhoto")}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn btn-outline" onClick={closeCamera}>
                    {t("cancel")}
                  </button>
                  {!cameraError && (
                    <button type="button" className="btn btn-primary" onClick={captureImage}>
                      {t("capture")}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
