import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/axios";
import useSocket from "../hooks/useSocket";
import { useTranslation } from "react-i18next";

export default function NotificationsBell() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = () => {
    api.get("/notifications")
      .then((res) => {
        setNotifications(res.data || []);
      })
      .catch((err) => {
        console.error("Error fetching notifications:", err);
      });
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNewNotification = useCallback((notification) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === notification.id)) return prev;
      return [notification, ...prev];
    });
  }, []);

  useSocket(handleNewNotification);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put("/notifications/all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  return (
    <div className="notifications-bell-container" ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "none",
          border: "none",
          color: "inherit",
          fontSize: "20px",
          cursor: "pointer",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          transition: "background 0.2s"
        }}
        className="nav-btn"
        title={t("notifications")}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              backgroundColor: "var(--color-danger, #d9534f)",
              color: "#fff",
              fontSize: "10px",
              fontWeight: "bold",
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "45px", // يفتح للأسفل بعد نقله للبار العلوي
            left: "0",
            width: "300px",
            backgroundColor: "#fff",
            border: "1px solid var(--color-border, #eee)",
            borderRadius: "var(--radius-md, 8px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            color: "#333",
            textAlign: "right",
            direction: "rtl"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px",
              borderBottom: "1px solid #eee"
            }}
          >
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>{t("notifications")}</h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-primary, #1b2a4a)",
                  fontSize: "11px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                {t("markAllRead")}
              </button>
            )}
          </div>

          <div style={{ maxHeight: "250px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", color: "#888", fontSize: "13px" }}>
                {t("noNotifications")}
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #f9f9f9",
                    backgroundColor: n.is_read ? "#fff" : "#f4f6f9",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f2f5")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = n.is_read ? "#fff" : "#f4f6f9")
                  }
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontWeight: n.is_read ? "500" : "700", fontSize: "13px" }}>
                      {n.title}
                    </span>
                    <button
                      onClick={(e) => handleDelete(n.id, e)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#aaa",
                        cursor: "pointer",
                        fontSize: "10px",
                        padding: "2px"
                      }}
                      title={t("delete")}
                    >
                      ✕
                    </button>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#666", lineHeight: "1.4" }}>
                    {n.message}
                  </p>
                  <span style={{ fontSize: "10px", color: "#999", marginTop: "6px" }}>
                    {new Date(n.created_at).toLocaleDateString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
