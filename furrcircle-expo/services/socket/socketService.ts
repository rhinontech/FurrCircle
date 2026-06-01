/**
 * socketService.ts
 *
 * Singleton Socket.IO client for FurrCircle.
 *
 * Connection lifecycle:
 *  - Call connect(token) once the user logs in (handled in _layout.tsx)
 *  - Call disconnect() on logout
 *  - Use on/off to subscribe to events anywhere in the app
 *
 * The server joins each authenticated user to the room:
 *   actor:{userType}:{userId}
 * and emits:
 *   - notification:new   → full AppNotification JSON
 *   - notification:counts → { activity: number; campaign: number; total: number }
 *   - chat:unread        → { conversationId: string | null; at: string }
 */

import { io, Socket } from "socket.io-client";

// Derive WebSocket base URL from the same env var Axios uses,
// stripping the trailing "/api" segment so Socket.IO connects to
// the root of the HTTP server.
const rawApiUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? "http://localhost:5001/api" : "");

const SOCKET_URL = rawApiUrl.replace(/\/api\/?$/, "");

// ─── Singleton socket reference ───────────────────────────────────────────────

let socket: Socket | null = null;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Connect (or reconnect) the socket with a fresh JWT token.
 * Safe to call multiple times — if already connected it disconnects first.
 */
export const connectSocket = (token: string): void => {
  if (socket?.connected) {
    // Update auth token and reconnect so the server re-authenticates
    socket.auth = { token };
    socket.disconnect().connect();
    return;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity,
  });

  socket.on("connect", () => {
    console.log("[Socket] Connected:", socket?.id);
  });

  socket.on("connect_error", (err) => {
    console.warn("[Socket] Connect error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason);
  });
};

/**
 * Disconnect and destroy the socket instance.
 * Call on logout so we don't leak a connection for a previous user session.
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("[Socket] Disconnected and cleared.");
  }
};

/**
 * Subscribe to a socket event.
 * Returns an unsubscribe function for easy cleanup.
 */
export const onSocketEvent = <T = unknown>(
  event: string,
  handler: (data: T) => void
): (() => void) => {
  if (!socket) {
    console.warn(`[Socket] onSocketEvent(${event}) called before connect()`);
    return () => {};
  }
  socket.on(event, handler as any);
  return () => {
    socket?.off(event, handler as any);
  };
};

/**
 * Unsubscribe from a socket event.
 */
export const offSocketEvent = (event: string, handler?: (...args: any[]) => void): void => {
  socket?.off(event, handler);
};

/**
 * Returns true when the socket is connected.
 */
export const isSocketConnected = (): boolean => socket?.connected ?? false;

export const socketService = {
  connect: connectSocket,
  disconnect: disconnectSocket,
  on: onSocketEvent,
  off: offSocketEvent,
  isConnected: isSocketConnected,
};
