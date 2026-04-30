import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./database/db.js";
import apiRoutes from "./routes/api.route.js";
import { socketHandler } from "./socket/socketHandler.js";

dotenv.config({ quiet: true });

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", apiRoutes);

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO
const io = new Server(server, {
    cors: { origin: "*" },
    path: "/api/socket.io"
});

// Initialize socket logic
socketHandler(io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server listening at port ${PORT}`);
});