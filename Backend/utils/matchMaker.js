export const activeUsers = {};
export const matchingQueue = [];
export const activeChats = {};
export const userRooms = {};

// Every currently-connected socket, regardless of whether they've submitted
// the form yet. Used purely for the "X people online" count.
export const onlineSockets = new Set();

// Session-only block list: reported/blocked pairs won't be re-matched.
// Keyed by socket ids, so it resets if either person reconnects (new socket id).
// There's no persistent user identity in this app, so this is best-effort, not permanent.
const blockedPairs = new Set();

const pairKey = (a, b) => [a, b].sort().join("::");

export const isBlocked = (a, b) => blockedPairs.has(pairKey(a, b));

export const blockPair = (a, b) => {
    blockedPairs.add(pairKey(a, b));
};

export const findMatch = (socketId) => {
    const currentUser = activeUsers[socketId];
    if (!currentUser) return null;

    let bestMatch = null;
    let bestScore = 0;

    for (let id of matchingQueue) {
        if (id === socketId) continue;
        if (isBlocked(socketId, id)) continue;

        const shared = currentUser.interests.filter(i =>
            activeUsers[id]?.interests.includes(i)
        );

        if (shared.length > bestScore) {
            bestScore = shared.length;
            bestMatch = id;
        }
    }

    return bestMatch;
}