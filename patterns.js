// ===== Pattern data =====
// All patterns are stored as base [x, y] coordinates.
// placePattern() (in game-of-life.js) applies the start offset when stamping them onto the grid.
const patterns = {
    pulsar: [
        [2, 4], [2, 5], [2, 6], [2, 10], [2, 11], [2, 12],
        [4, 2], [4, 7], [4, 9], [4, 14],
        [5, 2], [5, 7], [5, 9], [5, 14],
        [6, 2], [6, 7], [6, 9], [6, 14],
        [7, 4], [7, 5], [7, 6], [7, 10], [7, 11], [7, 12],
        [9, 4], [9, 5], [9, 6], [9, 10], [9, 11], [9, 12],
        [10, 2], [10, 7], [10, 9], [10, 14],
        [11, 2], [11, 7], [11, 9], [11, 14],
        [12, 2], [12, 7], [12, 9], [12, 14],
        [14, 4], [14, 5], [14, 6], [14, 10], [14, 11], [14, 12]
    ],
    queenBeeShuttle: [
        [0, 1], [0, 6],
        [1, 0], [1, 7],
        [2, 0], [2, 7],
        [3, 0], [3, 7],
        [4, 0], [4, 7],
        [5, 0], [5, 7],
        [6, 1], [6, 6],
        [7, 2], [7, 3], [7, 4], [7, 5]
    ],
    gliderFactory: [
        [1, 2], [2, 3],
        [3, 1], [3, 2], [3, 3],
        [11, 1], [11, 2], [11, 3],
        [12, 1], [13, 2]
    ],
    // Glider shapes keyed by travel direction (used by createGlider)
    gliders: {
        topLeftToBottomRight: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
        bottomLeftToTopRight: [[0, 1], [1, 0], [2, 0], [2, 1], [2, 2]],
        topRightToBottomLeft: [[1, 0], [0, 1], [0, 2], [1, 2], [2, 2]]
    }
};