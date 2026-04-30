import { activeUsers, matchingQueue, activeChats } from "../utils/matchMaker.js";

export const getStats = (req, res) => {
    res.json({
        activeUsers: Object.keys(activeUsers).length,
        waiting: matchingQueue.length,
        activeChats: Object.keys(activeChats).length
    });
};