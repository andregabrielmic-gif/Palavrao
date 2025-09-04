/* Versão Definitiva v3 - Formatado Corretamente */

// COLE A SUA LISTA COMPLETA DE PALAVRAS AQUI
const words = [ "sagaz","âmago", /* ... ... */ "apoio" ];

// --- VARIÁVEIS GLOBAIS ---
let gameMode = 'solo';
let targets = [];
let solvedStates = [];
let currentRow = 0;
let currentCol = 0;
let isAnimating = false;
const maxRows = 7;
const wordLength = 5;

// --- ELEMENTOS DO DOM ---
const keyboard = document.getElementById("keyboard");
const tabSolo = document.getElementById("tab-solo");
const tabDueto = document.getElementById("tab-dueto");
const soloContainer = document.getElementById("solo-container");
const duetoContainer = document.getElementById("dueto-container");
const gameBoards = {
    solo: [document.getElementById("game-solo")],
    dueto: [document.getElementById("game-dueto1"), document.getElementById("game-dueto2")]
};

// --- FUNÇÕES DE LÓGICA (NÃO MUDAM) ---
function normalize(str) { 
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
}

const PRIORITY = { absent: 0, present: 1, correct: 2 };
function updateKeyboard(letter, status) {
    const id = "key-" + normalize(letter).toLowerCase();
    const key = document.getElementById(id);
    if (!key) return;

    const current = key.dataset.status || "unset";
    const curP = PRIORITY[current] ?? -1;
    const newP = PRIORITY[status];

    if (newP > curP) {
        key.dataset.status = status;
        key.classList.remove("correct", "present", "absent");
        key.classList.add(status);
    }
}

function getStatuses(guess, target) {
    const g = normalize(guess).toLowerCase();
    const t = normalize(target).toLowerCase();
    const status = new Array(wordLength).fill("absent");
    const counts = {};

    for (let ch of t) { 
        counts[ch] = (counts[ch] || 0) + 1; 
    }

    for (let i = 0; i < wordLength; i++) {
        if (g[i] === t[i]) { 
            status[i] = "correct"; 
            counts[g[i]] -= 1; 
        }
    }

    for (let i = 0; i < wordLength; i++) {
        if (status[i] === "correct") continue;
        if ((counts[g[i]] || 0) > 0) { 
            status[i] = "present"; 
            counts[g[i]] -= 1; 
        }
    }
    return status;
}

// --- FUNÇÕES PRINCIPAIS DO JOGO ---

function startGame(mode) {
    gameMode = mode;
    currentRow = 0;
    currentCol = 0;
    isAnimating = false;
    targets = [];
    solvedStates = [];

    document.querySelectorAll(".tile").forEach(tile => {
        tile.classList.remove("flip");
        const front = tile.querySelector(".front");
        const back = tile.querySelector(".back");
        front.textContent = '';
        back.textContent = '';
        back.classList.remove("correct", "present", "absent");
    });
    
    document.querySelectorAll(".key").forEach(key => {
        key.classList.remove("correct", "present", "absent");
        key.dataset.status = "unset";
    });

    if (mode === 'solo') {
        targets.push(words[Math.floor(Math.random() * words.length)]);
        solvedStates.push(false);
        soloContainer.style.display = 'block';
        duetoContainer.style.display = 'none';
        tabSolo.classList.add("active");
        tabDueto.classList.remove("active");
    } else { // modo dueto
        targets.push(words[Math.floor(Math.random() * words.length)]);
        let word2 = words[Math.floor(Math.random() * words.length)];
        while(word2 === targets[0]) { 
            word2 = words[Math.floor(Math.random() * words.length)]; 
        }
        targets.push(word2);
        solvedStates.push(false);
        solvedStates.push(false);
        soloContainer.style.display = 'none';
        duetoContainer.style.display = 'flex';
        tabSolo.classList.remove("active");
        tabDueto.classList.add("active");
    }
    console.log("Palavras alvo:", targets);
    updateSelection();
}

function revealGuess(guess) {
    isAnimating = true;
    const activeBoards = gameBoards[gameMode];

    for (let i = 0; i < activeBoards.length; i++) {
        if (!solvedStates[i]) {
            const statuses = getStatuses(guess, targets[i]);
            animateRowFlip(activeBoards[i], currentRow, statuses, guess);
            if (statuses.every(s => s === 'correct')) { 
                solvedStates[i] = true; 
            }
        }
    }

    setTimeout(() => {
        isAnimating = false;
        if (solvedStates.every(s => s === true)) {
            setTimeout(() => alert("Parabéns, você acertou tudo!"), 100);
            return;
        }
        if (currentRow >= maxRows - 1) {
            alert("Fim de jogo! As palavras eram: " + targets.join(", ").toUpperCase());
            return;
        }
        currentRow++;
        currentCol = 0;
        updateSelection();
    }, wordLength * 300 + 500);
}

function animateRowFlip(boardElement, rowIndex, statuses, guess) {
    const rowElement = boardElement.querySelectorAll(".row")[rowIndex];
    const tiles = Array.from(rowElement.children);
    
    tiles.forEach((tile, i) => {
        const back = tile.querySelector(".back");
        back.textContent = guess[i].toUpperCase();
        back.classList.add(statuses[i]);
        updateKeyboard(guess[i], statuses[i]);
        setTimeout(() => tile.classList.add("flip"), i * 300);
    });
}

function handleKeyPress(key) {
    if (isAnimating) return;

    const activeBoards = gameBoards[gameMode];
    const primaryBoard = activeBoards[0];
    const row = primaryBoard.querySelectorAll(".row")[currentRow];
    if (!row) return;
    const tiles = Array.from(row.children);

    if (key === "Backspace") {
        let targetCol = currentCol;
        if (currentCol === wordLength || (currentCol > 0 && tiles[currentCol - 1].querySelector('.front').textContent === '')) {
             targetCol = currentCol - 1;
        }
        if (targetCol < 0) return;
        
        activeBoards.forEach(board => {
            board.querySelectorAll(".row")[currentRow].children[targetCol].querySelector(".front").textContent = "";
        });
        currentCol = targetCol;
        updateSelection();

    } else if (key === "Enter") {
        let guess = "";
        for(let tile of tiles) {
            const letter = tile.querySelector(".front").textContent;
            if (letter === "") { 
                alert("Complete a palavra!"); 
                return; 
            }
            guess += letter;
        }
        guess = guess.toLowerCase();
        if (!words.some(w => normalize(w) === normalize(guess))) {
            alert("Palavra não encontrada!");
            return;
        }
        revealGuess(guess);

    } else if (/^[a-zA-ZÀ-ÿ]$/.test(key) && currentCol < wordLength) {
        activeBoards.forEach(board => {
            board.querySelectorAll(".row")[currentRow].children[currentCol].querySelector(".front").textContent = key.toUpperCase();
        });

        let nextEmptyCol = -1;
        for (let i = currentCol + 1; i < wordLength; i++) {
            if (tiles[i].querySelector(".front").textContent === "") { nextEmptyCol = i; break; }
        }
        if (nextEmptyCol === -1) {
            for (let i = 0; i < currentCol; i++) {
                if (tiles[i].querySelector(".front").textContent === "") { nextEmptyCol = i; break; }
            }
        }
        
        currentCol = (nextEmptyCol !== -1) ? nextEmptyCol : wordLength;
        updateSelection();
    }
}

function updateSelection() {
    document.querySelectorAll(".front").forEach(f => f.classList.remove("selected"));
    if (currentCol < wordLength) {
        gameBoards[gameMode].forEach(board => {
            const tile = board.querySelectorAll(".row")[currentRow]?.children[currentCol];
            if(tile) tile.querySelector(".front").classList.add("selected");
        });
    }
}

function buildDOM() {
    // Constrói os tabuleiros
    for (const container of Object.values(gameBoards).flat()) {
        for (let r = 0; r < maxRows; r++) {
            const row = document.createElement("div"); 
            row.className = "row";
            for (let c = 0; c < wordLength; c++) {
                const tile = document.createElement("div"); 
                tile.className = "tile";
                tile.innerHTML = `<div class="front"></div><div class="back"></div>`;
                row.appendChild(tile);
            }
            container.appendChild(row);
        }
    }

    // Constrói o teclado
    const layout = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
    layout.forEach(line => {
        const row = document.createElement("div"); 
        row.className = "key-row";
        for (let char of line) {
            const key = document.createElement("div"); 
            key.className = "key";
            key.id = "key-" + char; 
            key.textContent = char;
            key.addEventListener('click', () => handleKeyPress(char));
            row.appendChild(key);
        }
        keyboard.appendChild(row);
    });

    // Adiciona os listeners de eventos
    document.addEventListener("keydown", e => handleKeyPress(e.key));
    tabSolo.addEventListener("click", () => startGame("solo"));
    tabDueto.addEventListener("click", () => startGame("dueto"));

    // Inicia o jogo
    startGame("solo");
}

buildDOM(); // Constrói a página e inicia o jogo
