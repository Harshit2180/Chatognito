export const activeUsers = {};
export const matchingQueue = [];
export const activeChats = {};
export const userRooms = {};


export const findMatch = (socketId) => {
    const currentUser = activeUsers[socketId];
    if (!currentUser) return null;

    let bestMatch = null;
    let bestScore = 0;

    for (let id of matchingQueue) {
        if (id === socketId) continue;

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
