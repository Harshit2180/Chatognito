import { io } from "socket.io-client";

// Must match the server: PORT 8000, and the custom path set in index.js
export const SERVER_URL = "http://localhost:8000";

export const socket = io(SERVER_URL, {
  path: "/api/socket.io",
  autoConnect: false,
});