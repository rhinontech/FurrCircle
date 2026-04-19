import jwt from "jsonwebtoken";
import type { Server, Socket } from "socket.io";

let io: Server | null = null;

export const getActorRoom = (actorType: string, actorId: string) => `actor:${actorType}:${actorId}`;

export const setRealtimeServer = (server: Server) => {
  io = server;
};

export const getRealtimeServer = () => io;

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
      socket.join(getActorRoom(actorType, actorId));
    }
  });
};

export const emitToActor = (actorId: string, actorType: string, event: string, payload: unknown) => {
  io?.to(getActorRoom(actorType, actorId)).emit(event, payload);
};
