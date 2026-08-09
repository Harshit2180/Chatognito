import { activeUsers, findMatch, matchingQueue, activeChats, userRooms, blockPair, onlineSockets } from "../utils/matchMaker.js";

const MAX_MESSAGE_LENGTH = 1000;
const RECONNECT_GRACE_MS = 15000; // how long a room stays open waiting for a dropped user to rejoin

// roomId -> { staleSocketId, timeoutId } — rooms currently mid-grace-period
const graceTimers = new Map();

export const socketHandler = (io) => {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);
        onlineSockets.add(socket.id);

        socket.emit("connected", { socketId: socket.id });

        // JOIN QUEUE
        socket.on("join_queue", (data) => {
            // Basic validation — a malformed payload here used to crash findMatch()
            if (!data || typeof data.name !== "string" || !data.name.trim()) {
                socket.emit("queue_error", { message: "A valid name is required." });
                return;
            }

            if (!Array.isArray(data.interests) || data.interests.length === 0) {
                socket.emit("queue_error", { message: "Select at least one interest." });
                return;
            }

            const age = Number(data.age);
            if (!Number.isInteger(age) || age < 13 || age > 120) {
                socket.emit("queue_error", { message: "Age must be between 13 and 120." });
                return;
            }

            activeUsers[socket.id] = {
                ...data,
                name: data.name.trim(),
                age,
                socketId: socket.id
            };

            const match = findMatch(socket.id);

            if (match) {
                const roomId = Math.random().toString(36).substring(2, 10);

                activeChats[roomId] = [socket.id, match];
                userRooms[socket.id] = roomId;
                userRooms[match] = roomId;

                // remove matched user
                const index = matchingQueue.indexOf(match);
                if (index > -1) matchingQueue.splice(index, 1);

                const shared = activeUsers[socket.id].interests.filter(i =>
                    activeUsers[match].interests.includes(i)
                );

                socket.emit("match_found", {
                    roomId,
                    sharedInterests: shared,
                    partnerName: activeUsers[match].name
                });

                io.to(match).emit("match_found", {
                    roomId,
                    sharedInterests: shared,
                    partnerName: activeUsers[socket.id].name
                });

            } else {
                matchingQueue.push(socket.id);
                socket.emit("waiting_for_match");
            }
        });

        // SEND MESSAGE (relayed only — not persisted, chat is ephemeral)
        socket.on("send_message", (data) => {
            const roomId = userRooms[socket.id];
            if (!roomId) return;

            const content = typeof data?.content === "string" ? data.content.trim() : "";
            if (!content || content.length > MAX_MESSAGE_LENGTH) return;

            const timestamp = Date.now();
            const otherUser = activeChats[roomId]?.find(id => id !== socket.id);

            if (otherUser) {
                io.to(otherUser).emit("receive_message", {
                    content,
                    timestamp,
                    from: "them"
                });
            }

            socket.emit("message_sent", {
                content,
                timestamp,
                from: "me"
            });
        });

        // TYPING
        socket.on("typing", (data) => {
            const roomId = userRooms[socket.id];
            if (!roomId) return;

            const otherUser = activeChats[roomId]?.find(id => id !== socket.id);

            if (otherUser) {
                io.to(otherUser).emit("partner_typing", {
                    isTyping: Boolean(data?.isTyping)
                });
            }
        });

        // DISCONNECT CHAT (user explicitly leaves, stays connected to the app)
        socket.on("disconnect_chat", () => {
            const roomId = userRooms[socket.id];
            if (!roomId) return;

            const otherUser = activeChats[roomId]?.find(id => id !== socket.id);

            if (otherUser) {
                io.to(otherUser).emit("partner_disconnected");
                delete userRooms[otherUser];
            }

            delete activeChats[roomId];
            delete userRooms[socket.id];

            socket.emit("chat_disconnected");
        });

        // REPORT + BLOCK PARTNER — ends the chat and prevents this pair from
        // being re-matched for the rest of the session (see matchMaker.js note
        // on the limits of session-only blocking without persistent identity)
        socket.on("report_partner", () => {
            const roomId = userRooms[socket.id];
            if (!roomId) return;

            const otherUser = activeChats[roomId]?.find(id => id !== socket.id);

            if (otherUser) {
                blockPair(socket.id, otherUser);
                io.to(otherUser).emit("partner_disconnected");
                delete userRooms[otherUser];
            }

            delete activeChats[roomId];
            delete userRooms[socket.id];

            socket.emit("chat_disconnected");
        });

        // REJOIN ROOM — client calls this right after reconnecting, if it was
        // mid-chat when the connection dropped
        socket.on("rejoin_room", ({ roomId } = {}) => {
            const pending = graceTimers.get(roomId);

            if (!pending || !activeChats[roomId]) {
                socket.emit("rejoin_failed");
                return;
            }

            clearTimeout(pending.timeoutId);
            graceTimers.delete(roomId);

            // Swap the stale socket id for the new one in this room
            activeChats[roomId] = activeChats[roomId].map((id) =>
                id === pending.staleSocketId ? socket.id : id
            );
            userRooms[socket.id] = roomId;

            const otherUser = activeChats[roomId].find((id) => id !== socket.id);
            if (otherUser) {
                io.to(otherUser).emit("partner_reconnected");
            }

            socket.emit("rejoin_success", { roomId });
        });

        // DISCONNECT (socket closes entirely — tab closed, network drop, etc.)
        socket.on("disconnect", () => {
            console.log("Disconnected:", socket.id);
            onlineSockets.delete(socket.id);

            const queueIndex = matchingQueue.indexOf(socket.id);
            if (queueIndex > -1) matchingQueue.splice(queueIndex, 1);

            const roomId = userRooms[socket.id];
            if (roomId) {
                // Don't tear the room down immediately — give this socket a
                // window to reconnect and call rejoin_room (e.g. a wifi blip).
                const timeoutId = setTimeout(() => {
                    graceTimers.delete(roomId);

                    const otherUser = activeChats[roomId]?.find((id) => id !== socket.id);
                    if (otherUser) {
                        io.to(otherUser).emit("partner_disconnected");
                        delete userRooms[otherUser];
                    }

                    delete activeChats[roomId];
                    delete userRooms[socket.id];
                }, RECONNECT_GRACE_MS);

                graceTimers.set(roomId, { staleSocketId: socket.id, timeoutId });
            }

            delete activeUsers[socket.id];
        });

    });
};