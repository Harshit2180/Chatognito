import mongoose, { mongo } from "mongoose";

const messageSchema = new mongoose.Schema({
    roomId: {
        type: String
    },
    senderId: {
        type: String
    },
    content: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    isEmoji: {
        type: Boolean,
        default: false
    }
})

export const Message = mongoose.model("Message", messageSchema);