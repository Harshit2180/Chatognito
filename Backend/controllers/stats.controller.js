import { activeUsers, matchingQueue, activeChats, onlineSockets } from "../utils/matchMaker.js";

export const getStats = (req, res) => {
    res.json({
        onlineNow: onlineSockets.size,
        activeUsers: Object.keys(activeUsers).length,
        waiting: matchingQueue.length,
        activeChats: Object.keys(activeChats).length
    });
};