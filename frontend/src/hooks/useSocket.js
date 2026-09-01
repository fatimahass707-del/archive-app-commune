import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { SERVER_BASE_URL } from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function useSocket(onNotificationReceived) {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user || !user.id) return;

    // Connect to Socket.io server
    const socket = io(SERVER_BASE_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] Connected to server");
      // Join user-specific room
      socket.emit("join_user_room", user.id);
    });

    socket.on("new_notification", (notification) => {
      console.log("[Socket] New notification received:", notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected from server");
    });

    return () => {
      socket.disconnect();
    };
  }, [user, onNotificationReceived]);

  return socketRef.current;
}
