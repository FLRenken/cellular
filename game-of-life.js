// patterns.js must be loaded before this file.

// ===== Live-tunable config (read/written by the control panel) =====
const config = {
    cellSize: 2.2,        // pixel size of each cell (smaller = finer grid)
    threshold: 13,        // audio level needed to spawn gliders
    cooldownPeriod: 2500, // ms between allowed spawns
    tickInterval: 75,     // ms per simulation step (lower = faster)
    sideMarginPct: 0.1,   // how far in from each edge gliders enter (0–0.45)
    aliveColor: '#ffffff',
    deadColor: '#000000',
    spawnGliders: true,   // let audio spawn gliders
    paused: false,        // freeze the simulation
    seedPattern: 'pulsar' // pattern used by Re-seed
};

// ===== Canvas / grid setup =====
const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');
gameCanvas.width = window.innerWidth;
gameCanvas.height = 800;
const volumeCanvas = document.getElementById('volumeCanvas');
const volumeCtx = volumeCanvas.getContext('2d');
const width = gameCanvas.width;
const height = gameCanvas.height;

let cellSize, rows, cols, grid;
let lastGliderTime = 0;

function buildGrid() {
    cellSize = config.cellSize;
    rows = Math.floor(height / cellSize);
    cols = Math.floor(width / cellSize);
    grid = new Array(cols).fill(null).map(() => new Array(rows).fill(0));
}

// Stamp a pattern (array of [x, y]) onto the grid, skipping out-of-bounds cells.
function placePattern(coords, startX, startY) {
    for (const [x, y] of coords) {
        const gx = x + startX, gy = y + startY;
        if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) {
            grid[gx][gy] = 1;
        }
    }
}

// Drop the configured seed pattern centered near the top.
function seed() {
    const p = patterns[config.seedPattern];
    if (!p) return;
    const maxX = Math.max(...p.map(c => c[0]));
    const startX = Math.max(0, Math.floor(cols / 2 - maxX / 2));
    placePattern(p, startX, 2);
}

buildGrid();
if (config.cellSize < 5) seed();

// ===== Audio input =====
let analyser = null, dataArray = null, bufferLength = 0;

navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(processAudio)
    .catch(error => console.log('Error accessing microphone:', error));

function processAudio(stream) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    analyser.fftSize = 256;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
}

function audioToGrid() {
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
    const average = sum / bufferLength;

    const inCooldown = Date.now() - lastGliderTime < config.cooldownPeriod;
    drawVolumeIndicator(average, config.threshold, inCooldown);

    if (config.spawnGliders && !inCooldown && average > config.threshold) {
        const sideMargin = Math.floor(cols * config.sideMarginPct);
        createGlider(sideMargin, 0, "topLeftToBottomRight");
        createGlider(cols - sideMargin - 3, 0, "topRightToBottomLeft");
        lastGliderTime = Date.now();
    }
}

function createGlider(x, y, direction) {
    placePattern(patterns.gliders[direction], x, y);
}

// ===== Main loop (restartable so speed can change live) =====
let loopId = null;
function startLoop() {
    if (loopId) clearInterval(loopId);
    loopId = setInterval(tick, config.tickInterval);
}

function tick() {
    if (analyser) audioToGrid();
    if (!config.paused) updateGameOfLife();
    draw();
}
startLoop();

// ===== Game of Life =====
function updateGameOfLife() {
    let newGrid = grid.map(arr => [...arr]);
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            let neighbors = 0;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    let x1 = x + dx, y1 = y + dy;
                    if (x1 >= 0 && x1 < cols && y1 >= 0 && y1 < rows) {
                        neighbors += grid[x1][y1];
                    }
                }
            }
            if (grid[x][y] === 1 && (neighbors < 2 || neighbors > 3)) {
                newGrid[x][y] = 0;
            } else if (grid[x][y] === 0 && neighbors === 3) {
                newGrid[x][y] = 1;
            }
        }
    }
    grid = newGrid;
}

function draw() {
    ctx.fillStyle = config.deadColor;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = config.aliveColor;
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            if (grid[x][y] === 1) ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
    }
}

function drawVolumeIndicator(volume, threshold, inCooldown) {
    volumeCtx.clearRect(0, 0, volumeCanvas.width, volumeCanvas.height);
    if (inCooldown) {
        volumeCtx.fillStyle = '#888';
        volumeCtx.fillRect(0, 0, volumeCanvas.width, volumeCanvas.height);
    } else {
        volumeCtx.fillStyle = '#00ff00';
        volumeCtx.fillRect(0, 0, (volume / 128) * volumeCanvas.width, volumeCanvas.height);
        volumeCtx.fillStyle = '#ff0000';
        volumeCtx.fillRect((threshold / 128) * volumeCanvas.width, 0, 2, volumeCanvas.height);
    }
}

// ===== API exposed to the control-panel window =====
window.gameAPI = {
    config,
    restartLoop: startLoop,                 // call after changing tickInterval
    rebuild() { buildGrid(); seed(); },     // call after changing cellSize
    clear() { buildGrid(); },               // wipe the grid, keep dimensions
    reseed() { seed(); }                    // drop the seed pattern again
};