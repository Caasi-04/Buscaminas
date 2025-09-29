// version 1.1.4
let board = [];
let mineCount = 10;
let flagsLeft = 10;
let gameOver = false;
let firstClick = true;
let cellsOpened = 0;
let timerInterval = null;
let startTime = null;
let attemptCount = 0;
let totalPlayTime = 0;        // en milisegundos
let totalTimerInterval = null;
let currentSessionStart = null;



const boardSizes = {
    mini: 10,
    small: 15,
    medium: 24,
    large: 36,
    huge: 48,
    insane: 80,
};

const difficultyRatios = {
    Veasy: 0.05,
    easy: 0.10,
    normal: 0.17,
    hard: 0.30,
    extreme: 0.38,
    insane: 0.54,
};

function onBoardSizeChange() {
    const size = document.getElementById('boardSize').value;
    const customSettings = document.getElementById('customSettings');
    const difficultyLabel = document.getElementById('difficultyLabel');
    const minesLabel = document.getElementById('customMinesLabel');

    if (size === 'custom') {
    customSettings.style.display = 'inline-block';
    difficultyLabel.style.display = 'none';
    minesLabel.style.display = 'inline-block';
    } else {
    customSettings.style.display = 'none';
    difficultyLabel.style.display = 'inline-block';
    minesLabel.style.display = 'none';
    }
}

function startGame() {
    let width, height;
    const size = document.getElementById('boardSize').value;

    if (size === 'custom') {
    width = parseInt(document.getElementById('customWidth').value);
    height = parseInt(document.getElementById('customHeight').value);
    mineCount = parseInt(document.getElementById('customMines').value);
    } else {
    width = boardSizes[size];
    height = Math.ceil(width * 0.8);
    const difficulty = document.getElementById('difficulty').value;
    const ratio = difficultyRatios[difficulty];
    mineCount = Math.round(width * height * ratio);
    }

    if (mineCount >= width * height) mineCount = width * height - 1;
    if (mineCount < 1) mineCount = 1;

    flagsLeft = mineCount;
    gameOver = false;
    firstClick = true;
    cellsOpened = 0;

    document.getElementById('flagsLeft').innerText = flagsLeft;

    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${width}, 30px)`;
    boardEl.style.gridTemplateRows = `repeat(${height}, 30px)`;

    
    resetTimer();
    document.getElementById('retryButton').style.display = 'none';


    board = [];

    for (let r = 0; r < height; r++) {
    board[r] = [];
    for (let c = 0; c < width; c++) {
        const cell = {
        row: r,
        col: c,
        mine: false,
        opened: false,
        flagged: false,
        question: false,
        element: document.createElement('div'),
        adjacent: 0
        };

        cell.element.classList.add('cell');
        cell.element.addEventListener('click', () => handleLeftClick(cell));
        cell.element.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        handleRightClick(cell);
        });

        boardEl.appendChild(cell.element);
        board[r][c] = cell;
    }
    }
}

function placeMines(excludeRow, excludeCol) {
    let placed = 0;
    const rows = board.length;
    const cols = board[0].length;

    while (placed < mineCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    const isExcluded = Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1;

    if (!board[r][c].mine && !isExcluded) {
        board[r][c].mine = true;
        placed++;
    }
    }

    for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
        board[r][c].adjacent = countAdjacentMines(r, c);
    }
    }
}

function countAdjacentMines(r, c) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
        const nr = r + i;
        const nc = c + j;
        if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[0].length && board[nr][nc].mine) {
        count++;
        }
    }
    }
    return count;
}

function handleLeftClick(cell) {
    if (gameOver || cell.opened || cell.flagged) return;

    if (firstClick) {
        placeMines(cell.row, cell.col);
        firstClick = false;
        startTimer();  // ⏱ Iniciar cronómetro
    }

    openCell(cell);

    if (cell.mine) {
        cell.element.classList.add('mine-transform');
        cell.element.innerText = '💣';
        setTimeout(() => {
            cell.element.innerText = '💥';
        }, 400);
        endGame(false);
    }

    if (checkWin()) {
        endGame(true);
    }
}


function openCell(cell) {
    if (cell.opened || cell.flagged) return;

    cell.opened = true;
    cell.element.classList.add('open');
    cell.element.classList.remove('flag', 'question');
    cell.element.innerText = '';
    cell.element.dataset.adjacent = cell.adjacent;

    if (!cell.mine) cellsOpened++;

    if (cell.adjacent > 0) {
    cell.element.innerText = cell.adjacent;
    } else {
    openSurrounding(cell.row, cell.col);
    }
}

function openSurrounding(r, c) {
    for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
        const nr = r + i;
        const nc = c + j;
        if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[0].length) {
        const neighbor = board[nr][nc];
        if (!neighbor.opened && !neighbor.mine && !neighbor.flagged) {
            openCell(neighbor);
        }
        }
    }
    }
}

function handleRightClick(cell) {
    if (gameOver || cell.opened) return;

    if (!cell.flagged && !cell.question && flagsLeft > 0) {
    cell.flagged = true;
    cell.element.innerText = '🚩';
    cell.element.classList.add('flag');
    flagsLeft--;
    } else if (cell.flagged) {
    cell.flagged = false;
    cell.question = true;
    cell.element.innerText = '?';
    cell.element.classList.remove('flag');
    cell.element.classList.add('question');
    flagsLeft++;
    } else if (cell.question) {
    cell.question = false;
    cell.element.innerText = '';
    cell.element.classList.remove('question');
    }

    document.getElementById('flagsLeft').innerText = flagsLeft;
}

function checkWin() {
    const total = board.length * board[0].length;
    return total - mineCount === cellsOpened;
}

function endGame(won) {
    gameOver = true;
    stopTimer();

    if (!won) {
        // ✅ Solo contar intento si se hizo el primer clic
        if (!firstClick) {
            attemptCount++;
            document.getElementById('attempts').innerText = attemptCount;
        }

        // Mostrar minas y errores
        for (let r = 0; r < board.length; r++) {
            for (let c = 0; c < board[0].length; c++) {
                const cell = board[r][c];
                if (cell.mine) {
                    cell.element.innerText = '💣';
                    cell.element.classList.remove('flag', 'question');
                    cell.element.classList.add('mine-transform');
                    setTimeout(() => {
                        cell.element.innerText = '💥';
                    }, 400);
                } else if (cell.flagged) {
                    cell.element.innerText = '❌';
                    cell.element.classList.remove('flag');
                }
            }
        }

        document.getElementById('retryButton').style.display = 'inline-block';
        showRetryMessage();

    } else {
        // Ganar
        for (let r = 0; r < board.length; r++) {
            for (let c = 0; c < board[0].length; c++) {
                const cell = board[r][c];
                if (cell.mine) {
                    cell.element.innerText = '🌸';
                    cell.element.classList.add('mine-flower');
                    cell.element.classList.remove('flag', 'question');
                }
            }
        }
    }
}




function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        document.getElementById('timeElapsed').innerText = formatTime(elapsed);
    }, 1000);
}


function stopTimer() {
    clearInterval(timerInterval);
}

function resetTimer() {
    clearInterval(timerInterval);
    document.getElementById('timeElapsed').innerText = '00:00:00';
}

function retryGame() {
    startGame(); // reinicia el juego con los mismos parámetros
}

function updateAttemptCounter() {
    attemptCount++;
    document.getElementById('attempts').innerText = attemptCount;
}
function startTotalTimer() {
    currentSessionStart = Date.now();

    totalTimerInterval = setInterval(() => {
        const currentElapsed = Date.now() - currentSessionStart;
        const total = totalPlayTime + currentElapsed;
        document.getElementById('totalTime').innerText = formatTime(total);
    }, 1000);
}

function updateClock() {
    const now = new Date();

    const time = now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const date = now.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    const timezoneOffset = -now.getTimezoneOffset() / 60;
    const timezone = `GMT${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`;

    document.getElementById('clockOverlay').innerHTML = `
        <div><strong>${time}</strong></div>
        <div>${date}</div>
        <div>${timezone}</div>
    `;
}

// Actualizar cada segundo
setInterval(updateClock, 1000);
window.addEventListener('load', updateClock);


window.onload = () => {
    onBoardSizeChange();
    startGame();
    startTotalTimer();
};

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
}

document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        const retryBtn = document.getElementById('retryButton');
        if (retryBtn && retryBtn.offsetParent !== null) { // Verifica que esté visible
            retryBtn.click();
        }
    }
});

document.addEventListener('keydown', function(e) {
  if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault(); // Siempre previene el scroll con espacio
  }
});

window.onload = () => {
    // Detectar cambios en parámetros y actualizar juego automáticamente
    document.getElementById('boardSize').addEventListener('change', startGame);
    document.getElementById('difficulty').addEventListener('change', startGame);
    document.getElementById('customWidth').addEventListener('input', startGame);
    document.getElementById('customHeight').addEventListener('input', startGame);
    document.getElementById('customMines').addEventListener('input', startGame);

    onBoardSizeChange();
    startGame();
    startTotalTimer();
};

// Bloquear scroll por espacio siempre
document.addEventListener('keydown', function(e) {
  if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
  }
});

// Reiniciar juego con Enter o espacio, solo si el botón está visible
document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
        const retryBtn = document.getElementById('retryButton');
        if (retryBtn && retryBtn.offsetParent !== null) {
            retryBtn.click();
        }
    }
});

function startGame() {
    // Reinicia estado pero NO inicia timer ni coloca minas
    let width, height;
    const size = document.getElementById('boardSize').value;

    if (size === 'custom') {
        width = parseInt(document.getElementById('customWidth').value);
        height = parseInt(document.getElementById('customHeight').value);
        mineCount = parseInt(document.getElementById('customMines').value);
    } else {
        width = boardSizes[size];
        height = Math.ceil(width * 0.8);
        const difficulty = document.getElementById('difficulty').value;
        const ratio = difficultyRatios[difficulty];
        mineCount = Math.round(width * height * ratio);
    }

    if (mineCount >= width * height) mineCount = width * height - 1;
    if (mineCount < 1) mineCount = 1;

    flagsLeft = mineCount;
    gameOver = false;
    firstClick = true;  // El primer click iniciará minas y tiempo
    cellsOpened = 0;

    document.getElementById('flagsLeft').innerText = flagsLeft;

    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${width}, 30px)`;
    boardEl.style.gridTemplateRows = `repeat(${height}, 30px)`;

    resetTimer();
    document.getElementById('retryButton').style.display = 'none';

    board = [];

    for (let r = 0; r < height; r++) {
        board[r] = [];
        for (let c = 0; c < width; c++) {
            const cell = {
                row: r,
                col: c,
                mine: false,
                opened: false,
                flagged: false,
                question: false,
                element: document.createElement('div'),
                adjacent: 0
            };

            cell.element.classList.add('cell');
            cell.element.addEventListener('click', () => handleLeftClick(cell));
            cell.element.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                handleRightClick(cell);
            });

            boardEl.appendChild(cell.element);
            board[r][c] = cell;
        }
    }
}
