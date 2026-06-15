import jwt from "jsonwebtoken";
import type { Server, Socket } from "socket.io";

let io: Server | null = null;

// Map to track user presence: userId -> Set of socketIds
const onlineUsers = new Map<string, Set<string>>();

export const getActorRoom = (actorType: string, actorId: string) => `actor:${actorType}:${actorId}`;

export const setRealtimeServer = (server: Server) => {
  io = server;
};

export const getRealtimeServer = () => io;

export const isUserOnline = (userId: string): boolean => {
  const sockets = onlineUsers.get(userId);
  return !!sockets && sockets.size > 0;
};

export const setupRealtimeServer = (server: Server) => {
  setRealtimeServer(server);

  server.use((socket: Socket, next) => {
    try {
      const rawToken = typeof socket.handshake.auth?.token === "string"
        ? socket.handshake.auth.token
        : typeof socket.handshake.headers.authorization === "string"
          ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, "")
          : "";

      if (!rawToken) {
        next();
        return;
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        next(new Error("JWT_SECRET is not configured"));
        return;
      }

      const decoded = jwt.verify(rawToken, secret) as { id?: string; userType?: string };
      if (decoded?.id && decoded?.userType) {
        socket.data.actorId = decoded.id;
        socket.data.actorType = decoded.userType;
      }

      next();
    } catch {
      next();
    }
  });

  server.on("connection", (socket: Socket) => {
    const actorId = socket.data.actorId as string | undefined;
    const actorType = socket.data.actorType as string | undefined;

    if (actorId && actorType) {
      const room = getActorRoom(actorType, actorId);
      socket.join(room);

      // Presence tracking
      if (!onlineUsers.has(actorId)) {
        onlineUsers.set(actorId, new Set());
      }
      const userSockets = onlineUsers.get(actorId)!;
      userSockets.add(socket.id);

      // Broadcast online status to anyone interested (could be broadcast globally or just room)
      // For now, we mainly need the isUserOnline helper for the backend to decide on push notifications
      io?.emit("presence:online", { userId: actorId, userType: actorType });

      socket.on("disconnect", () => {
        if (onlineUsers.has(actorId)) {
          const sockets = onlineUsers.get(actorId)!;
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            onlineUsers.delete(actorId);
            io?.emit("presence:offline", { userId: actorId, userType: actorType });
          }
        }
      });
    }
  });
};

export const emitToActor = (actorId: string, actorType: string, event: string, payload: unknown) => {
  io?.to(getActorRoom(actorType, actorId)).emit(event, payload);
};

/** Broadcast to every connected client (e.g. live post engagement counts). */
export const emitGlobal = (event: string, payload: unknown) => {
  io?.emit(event, payload);
};
