import { Message } from "../models/message.model.js";
import { activeUsers, findMatch, matchingQueue, activeChats, userRooms } from "../utils/matchMaker.js";


export const socketHandler = (io) => {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.emit("connected", { socketId: socket.id });

        // JOIN QUEUE
        socket.on("join_queue", (data) => {
            activeUsers[socket.id] = {
                ...data,
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
                    sharedInterests: shared
                });

                io.to(match).emit("match_found", {
                    roomId,
                    sharedInterests: shared
                });

            } else {
                matchingQueue.push(socket.id);
                socket.emit("waiting_for_match");
            }
        });

        // SEND MESSAGE
        socket.on("send_message", async (data) => {
            const roomId = userRooms[socket.id];
            if (!roomId) return;

            const message = await Message.create({
                roomId,
                senderId: socket.id,
                content: data.content,
                isEmoji: data.isEmoji
            });

            const otherUser = activeChats[roomId]?.find(id => id !== socket.id);

            if (otherUser) {
                io.to(otherUser).emit("receive_message", {
                    content: data.content,
                    timestamp: message.timestamp,
                    from: "them"
                });
            }

            socket.emit("message_sent", {
                content: data.content,
                timestamp: message.timestamp,
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
                    isTyping: data.isTyping
                });
            }
        });

        // DISCONNECT CHAT
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

        // DISCONNECT
        socket.on("disconnect", () => {
            console.log("Disconnected:", socket.id);

            const queueIndex = matchingQueue.indexOf(socket.id);
            if (queueIndex > -1) matchingQueue.splice(queueIndex, 1);

            delete activeUsers[socket.id];
        });

    });
};
