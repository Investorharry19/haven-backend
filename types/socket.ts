// types/socket.ts
import type { Server, Socket } from "socket.io";
import type { JwtPayload } from "jsonwebtoken";
import type { INotification } from "../schema/notification.ts";

export interface SocketTokenPayload extends JwtPayload {
  Id: string;
  propertyId?: string;
}

export type Role = "landlord" | "tenant";

export interface ClientToServerEvents {
  "notifications:read": (ids: string[]) => void;
  "notifications:delete": (ids: string[]) => void;
}

export interface ServerToClientEvents {
  "notifications:init": (notifications: INotification[]) => void;
  "landlord_update:init": (updates: unknown[]) => void;
  "notifications:new": (notification: INotification) => void;
  "landlord_update:new": (notication: INotification) => void;
}

export type InterServerEvents = Record<string, never>;

export interface SocketData {
  user: SocketTokenPayload;
}

export type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
