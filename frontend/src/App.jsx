import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import DocumentForm from "./pages/DocumentForm";
import DocumentDetail from "./pages/DocumentDetail";
import Categories from "./pages/Categories";
import Users from "./pages/Users";
import ActivityLogs from "./pages/ActivityLogs";
import Spaces from "./pages/Spaces";
import NotificationsBell from "./components/NotificationsBell";
import LanguageSwitcher from "./components/LanguageSwitcher";

function AppLayout({ children }) {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBanner, setShowBanner] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowBanner(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setShowBanner(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="app-shell" style={{ display: "flex", minHeight: "100vh" }}>
      {isOffline && showBanner && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: "#d9534f",
          color: "#fff",
          textAlign: "center",
          padding: "10px 20px",
          zIndex: 9999,
          fontSize: "14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span style={{ margin: "0 auto" }}>⚠️ {t("offline")}</span>
          <button 
            onClick={() => setShowBanner(false)} 
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              padding: "0 10px"
            }}
          >
            ✕
          </button>
        </div>
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header className="main-header" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 32px",
          backgroundColor: "#fff",
          borderBottom: "1px solid #eef0f3",
          height: "60px",
          boxSizing: "border-box"
        }}>
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              padding: "4px 8px",
              color: "var(--color-navy)"
            }}
          >
            ☰
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <LanguageSwitcher />
            <NotificationsBell />
          </div>
        </header>
        <main className="main-content" style={isOffline && showBanner ? { paddingTop: "50px" } : {}}>{children}</main>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Documents />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/documents/new"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DocumentForm />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/documents/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DocumentDetail />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/documents/:id/edit"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DocumentForm />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Categories />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/spaces"
        element={
          <ProtectedRoute adminOnly>
            <AppLayout>
              <Spaces />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute adminOnly>
            <AppLayout>
              <Users />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/logs"
        element={
          <ProtectedRoute adminOnly>
            <AppLayout>
              <ActivityLogs />
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}