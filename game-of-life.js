// Pattern data lives in patterns.js (must be loaded before this file).

// Stamp a pattern (array of [x, y]) onto the grid at the given offset.
function placePattern(coords, startX, startY) {
    for (const [x, y] of coords) {
        grid[x + startX][y + startY] = 1;
    }
}

// ===== Canvas / grid setup =====
const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');
gameCanvas.width = window.innerWidth;
gameCanvas.height = 800;
const volumeCanvas = document.getElementById('volumeCanvas');
const volumeCtx = volumeCanvas.getContext('2d');
const width = gameCanvas.width;
const height = gameCanvas.height;
let cellSize = 2.2; // larger cells = clearer visuals
const rows = Math.floor(height / cellSize);
const cols = Math.floor(width / cellSize);
let grid = new Array(cols).fill(null).map(() => new Array(rows).fill(0));
let lastGliderTime = 0;
let cooldownPeriod = 2500;
let threshold = 13;

// ===== Audio input =====
navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(processAudio)
    .catch(error => console.log('Error accessing microphone:', error));

function processAudio(stream) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let toggle = true;

    function audioToGrid() {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const inCooldown = Date.now() - lastGliderTime < cooldownPeriod;
        drawVolumeIndicator(average, threshold, inCooldown);
        if (!inCooldown && average > threshold) {
            const sideMargin = Math.floor(cols * 0.1);
            const topY = 0;
            createGlider(sideMargin, topY, "topLeftToBottomRight");
            createGlider(cols - sideMargin - 3, topY, "topRightToBottomLeft");
            toggle = !toggle;
            lastGliderTime = Date.now();
        }
    }

    setInterval(() => {
        audioToGrid();
        updateGameOfLife();
        draw();
    }, 75);
}

function createGlider(x, y, direction) {
    placePattern(patterns.gliders[direction], x, y);
}

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
    ctx.clearRect(0, 0, width, height);
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            ctx.fillStyle = grid[x][y] === 1 ? 'white' : 'black';
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
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

// ===== Initial seed =====
if (cellSize < 5) {
    placePattern(patterns.pulsar, Math.floor(cols / 2 - 8), 0);
}