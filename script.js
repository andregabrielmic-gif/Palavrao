// Versão Final Corrigida (Clique e Backspace restaurados)
let words = [];

let activeMode = 'solo';
let isAnimating = false;
const wordLength = 5;

const gameState = {
    solo: { targets: [], solved: [], currentRow: 0, currentCol: 0, boardState: [], maxRows: 6, keyboardState: {} },
    dueto: { targets: [], solved: [], currentRow: 0, currentCol: 0, boardState: [], maxRows: 7, keyboardState: {} }
};

const keyboard = document.getElementById("keyboard");
const tabSolo = document.getElementById("tab-solo");
const tabDueto = document.getElementById("tab-dueto");
const soloContainer = document.getElementById("solo-container");
const duetoContainer = document.getElementById("dueto-container");
const gameBoards = {
    solo: [document.getElementById("game-solo")],
    dueto: [document.getElementById("game-dueto1"), document.getElementById("game-dueto2")]
};

function normalize(str) { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
const PRIORITY = { unset: -1, absent: 0, present: 1, correct: 2 };

function updateKeyboard(letter, status) {
    const state = gameState[activeMode];
    const normalizedLetter = normalize(letter).toLowerCase();
    const currentPriority = PRIORITY[state.keyboardState[normalizedLetter] || 'unset'];
    const newPriority = PRIORITY[status];

    if (newPriority > currentPriority) {
        state.keyboardState[normalizedLetter] = status;
    }
}

function updateKeyboardState() {
    const state = gameState[activeMode];
    document.querySelectorAll(".key").forEach(key => {
        const char = key.id.replace('key-', '');
        const status = state.keyboardState[char] || 'unset';
        key.classList.remove('correct', 'present', 'absent');
        if (status !== 'unset') {
            key.classList.add(status);
        }
    });
}

function getStatuses(guess, target) {
    const g = normalize(guess).toLowerCase();
    const t = normalize(target).toLowerCase();
    const status = new Array(wordLength).fill("absent");
    const counts = {};
    for (let ch of t) { counts[ch] = (counts[ch] || 0) + 1; }
    for (let i = 0; i < wordLength; i++) {
        if (g[i] === t[i]) { status[i] = "correct"; counts[g[i]] -= 1; }
    }
    for (let i = 0; i < wordLength; i++) {
        if (status[i] === "correct") continue;
        if ((counts[g[i]] || 0) > 0) { status[i] = "present"; counts[g[i]] -= 1; }
    }
    return status;
}

function saveCurrentState() {
    if (!activeMode) return;
    const state = gameState[activeMode];
    const activeBoards = gameBoards[activeMode];

    state.boardState = [];
    activeBoards.forEach(board => {
        const boardData = [];
        const rows = board.querySelectorAll('.row');
        rows.forEach(row => {
            const rowData = [];
            const tiles = row.querySelectorAll('.tile');
            tiles.forEach(tile => {
                const back = tile.querySelector('.back');
                rowData.push({
                    letter: tile.querySelector('.front').textContent,
                    status: back.classList.contains('correct') ? 'correct' :
                        back.classList.contains('present') ? 'present' :
                        back.classList.contains('absent') ? 'absent' : null,
                    isFlipped: tile.classList.contains('flip')
                });
            });
            boardData.push(rowData);
        });
        state.boardState.push(boardData);
    });
}

function loadState(mode) {
    const state = gameState[mode];
    const activeBoards = gameBoards[mode];

    activeBoards.forEach((board, boardIndex) => {
        const boardData = state.boardState[boardIndex];
        const rows = board.querySelectorAll('.row');
        rows.forEach((row, rIndex) => {
            const tiles = row.querySelectorAll('.tile');
            tiles.forEach((tile, tIndex) => {
                const tileData = boardData[rIndex][tIndex];
                tile.querySelector('.front').textContent = tileData.letter;
                const back = tile.querySelector('.back');
                back.textContent = tileData.letter;

                back.classList.remove('correct', 'present', 'absent');
                tile.classList.remove('flip');

                if (tileData.status) {
                    back.classList.add(tileData.status);
                }
                if (tileData.isFlipped) {
                    tile.classList.add('flip');
                }
            });
        });
    });
    updateKeyboardState();
    updateSelection();
}

function switchGameMode(newMode) {
    if (activeMode === newMode) return;
    saveCurrentState();
    activeMode = newMode;

    if (newMode === 'solo') {
        soloContainer.style.display = 'block';
        duetoContainer.style.display = 'none';
        tabSolo.classList.add("active");
        tabDueto.classList.remove("active");
    } else {
        soloContainer.style.display = 'none';
        duetoContainer.style.display = 'flex';
        tabSolo.classList.remove("active");
        tabDueto.classList.add("active");
    }
    loadState(newMode);
}

function revealGuess(guess) {
    isAnimating = true;
    const state = gameState[activeMode];
    const activeBoards = gameBoards[activeMode];

    for (let i = 0; i < activeBoards.length; i++) {
        if (!state.solved[i]) {
            const statuses = getStatuses(guess, state.targets[i]);
            animateRowFlip(activeBoards[i], state.currentRow, statuses, guess);
            if (statuses.every(s => s === 'correct')) { state.solved[i] = true; }
        }
    }

    setTimeout(() => {
        isAnimating = false;
        if (state.solved.every(s => s === true)) {
            setTimeout(() => alert("Parabéns, você acertou tudo!"), 100);
            return;
        }
        if (state.currentRow >= state.maxRows - 1) {
            alert("Fim de jogo! As palavras eram: " + state.targets.join(", ").toUpperCase());
            return;
        }
        state.currentRow++;
        state.currentCol = 0;
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
    updateKeyboardState();
}

function handleKeyPress(key) {
    if (isAnimating) return;
    const state = gameState[activeMode];
    if (state.solved.every(s => s === true) || state.currentRow >= state.maxRows) return;

    const activeBoards = gameBoards[activeMode];
    const primaryBoard = activeBoards[0];
    const row = primaryBoard.querySelectorAll(".row")[state.currentRow];
    if (!row) return;

    // CORREÇÃO 2: Lógica do Backspace simplificada e corrigida
    if (key === "Backspace") {
        const tiles = Array.from(row.children);
        // Se a célula atual estiver vazia e não for a primeira, move para trás
        if (state.currentCol > 0 && tiles[state.currentCol - 1].querySelector('.front').textContent !== '' && tiles[state.currentCol]?.querySelector('.front').textContent === '') {
            state.currentCol--;
        }

        // Se o cursor está no final, move para a última letra
        if (state.currentCol === wordLength) {
            state.currentCol--;
        }

        // Apaga o conteúdo da célula atual
        activeBoards.forEach(board => {
            board.querySelectorAll(".row")[state.currentRow].children[state.currentCol].querySelector(".front").textContent = "";
        });

    } else if (key === "Enter") {
        if (state.currentCol !== wordLength) {
             const tiles = Array.from(row.children);
             const isComplete = tiles.every(tile => tile.querySelector('.front').textContent !== '');
             if (!isComplete) {
                alert("Complete a palavra!");
                return;
             }
        }
        let guess = "";
        const tiles = Array.from(row.children);
        for (let tile of tiles) {
            guess += tile.querySelector(".front").textContent;
        }
        guess = guess.toLowerCase();
        if (!words.some(w => normalize(w) === normalize(guess))) {
            alert("Palavra não encontrada!");
            return;
        }
        revealGuess(guess);
    } else if (/^[a-zA-ZÀ-ÿ]$/.test(key) && state.currentCol < wordLength) {
        activeBoards.forEach(board => {
            board.querySelectorAll(".row")[state.currentRow].children[state.currentCol].querySelector(".front").textContent = key.toUpperCase();
        });
        
        // Lógica de cursor inteligente
        const tiles = Array.from(row.children);
        let nextEmptyCol = -1;
        for (let i = state.currentCol + 1; i < wordLength; i++) {
            if (tiles[i].querySelector(".front").textContent === "") { nextEmptyCol = i; break; }
        }
        if (nextEmptyCol === -1) {
            for (let i = 0; i < state.currentCol; i++) {
                if (tiles[i].querySelector(".front").textContent === "") { nextEmptyCol = i; break; }
            }
        }
        state.currentCol = (nextEmptyCol !== -1) ? nextEmptyCol : wordLength;
    }
    updateSelection();
}

function updateSelection() {
    const state = gameState[activeMode];
    document.querySelectorAll(".front").forEach(f => f.classList.remove("selected"));
    if (state.currentCol < wordLength) {
        gameBoards[activeMode].forEach(board => {
            const tile = board.querySelectorAll(".row")[state.currentRow]?.children[state.currentCol];
            if (tile) tile.querySelector(".front").classList.add("selected");
        });
    }
}

async function initialize() {
    try {
        const response = await fetch('palavras.txt');
        const text = await response.text();
        words = text.split('\n').map(word => word.trim()).filter(word => word.length > 0 && /^[a-zA-ZÀ-ÿ]+$/.test(word));
        console.log(`${words.length} palavras carregadas com sucesso!`);
    } catch (error) {
        console.error("Erro ao carregar o arquivo de palavras:", error);
        alert("Não foi possível carregar a lista de palavras. Verifique se o arquivo 'palavras.txt' está na mesma pasta que o HTML.");
        return;
    }

    Object.values(gameBoards).flat().forEach(container => {
        const maxRowsForBoard = 7;
        for (let r = 0; r < maxRowsForBoard; r++) {
            const row = document.createElement("div"); row.className = "row";
            for (let c = 0; c < wordLength; c++) {
                const tile = document.createElement("div"); tile.className = "tile";
                tile.innerHTML = `<div class="front"></div><div class="back"></div>`;

                // CORREÇÃO 1: Adicionando o 'ouvinte de clique' de volta em cada célula
                tile.addEventListener('click', () => {
                    const state = gameState[activeMode];
                    if (r === state.currentRow && !isAnimating) {
                        state.currentCol = c;
                        updateSelection();
                    }
                });

                row.appendChild(tile);
            }
            container.appendChild(row);
        }
    });

    const layout = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
    layout.forEach(line => {
        const row = document.createElement("div"); row.className = "key-row";
        for (let char of line) {
            const key = document.createElement("div"); key.className = "key";
            key.id = "key-" + char; key.textContent = char;
            key.addEventListener('click', () => handleKeyPress(char));
            row.appendChild(key);
        }
        keyboard.appendChild(row);
    });

    ['solo', 'dueto'].forEach(mode => {
        const state = gameState[mode];
        const numTargets = (mode === 'solo') ? 1 : 2;
        for (let i = 0; i < numTargets; i++) {
            let newWord = words[Math.floor(Math.random() * words.length)];
            while (state.targets.includes(newWord)) {
                newWord = words[Math.floor(Math.random() * words.length)];
            }
            state.targets.push(newWord);
            state.solved.push(false);
        }
        for (let i = 0; i < numTargets; i++) {
            state.boardState.push(Array(7).fill().map(() => Array(wordLength).fill({ letter: '', status: null, isFlipped: false })));
        }
    });

    document.addEventListener("keydown", e => handleKeyPress(e.key));
    tabSolo.addEventListener("click", () => switchGameMode("solo"));
    tabDueto.addEventListener("click", () => switchGameMode("dueto"));

    loadState("solo");
}

initialize();
