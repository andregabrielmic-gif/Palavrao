let words = [];
let activeMode = 'solo';
let isAnimating = false;
const wordLength = 5;

// ALTERADO: A propriedade keyboardState foi movida para o objeto de estatísticas
const gameState = {
    solo: { targets: [], solved: [], currentRow: 0, currentCol: 0, boardState: [], maxRows: 6 },
    dueto: { targets: [], solved: [], currentRow: 0, currentCol: 0, boardState: [], maxRows: 7 }
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

// NOVO: Lógica completa do Placar e Estatísticas
const placarModal = document.getElementById('placar-modal');
const placarBtn = document.getElementById('placar-btn');
const closeModalBtn = document.querySelector('.modal-close-btn');
let stats = {};

function getInitialStats() {
    const savedStats = localStorage.getItem('termoGameStats');
    return savedStats ? JSON.parse(savedStats) : {
        gamesPlayed: 0, wins: 0, currentStreak: 0, maxStreak: 0,
        guessDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 },
        keyboardState: {} // Estado do teclado agora faz parte das estatísticas
    };
}
function saveStats() {
    localStorage.setItem('termoGameStats', JSON.stringify(stats));
}
function addWin(attemptNumber) {
    stats.gamesPlayed++;
    stats.wins++;
    stats.currentStreak++;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    if (attemptNumber <= 6) {
        stats.guessDistribution[attemptNumber]++;
    }
    saveStats();
}
function addLoss() {
    stats.gamesPlayed++;
    stats.currentStreak = 0;
    saveStats();
}
function updatePlacarModal() {
    const winPercentage = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;
    document.getElementById('stat-jogos').textContent = stats.gamesPlayed;
    document.getElementById('stat-vitorias').textContent = `${winPercentage}%`;
    document.getElementById('stat-sequencia').textContent = stats.currentStreak;
    document.getElementById('stat-melhor-seq').textContent = stats.maxStreak;

    const graficoContainer = document.getElementById('distribuicao-grafico');
    graficoContainer.innerHTML = ''; // Limpa o gráfico anterior
    const maxDistribution = Math.max(...Object.values(stats.guessDistribution));

    for (let i = 1; i <= 6; i++) {
        const count = stats.guessDistribution[i];
        const percentage = maxDistribution > 0 ? (count / maxDistribution) * 100 : 0;
        
        const label = document.createElement('div');
        label.className = 'dist-label';
        label.textContent = i;
        
        const barContainer = document.createElement('div');
        barContainer.className = 'dist-bar-container';

        const bar = document.createElement('div');
        bar.className = 'dist-bar';
        bar.style.width = `${percentage}%`;
        bar.textContent = count;
        
        barContainer.appendChild(bar);
        graficoContainer.appendChild(label);
        graficoContainer.appendChild(barContainer);
    }
}
placarBtn.addEventListener('click', () => {
    updatePlacarModal();
    placarModal.style.display = 'flex';
});
closeModalBtn.addEventListener('click', () => placarModal.style.display = 'none');
window.addEventListener('click', (event) => {
    if (event.target === placarModal) placarModal.style.display = 'none';
});
// Fim da lógica do Placar

function normalize(str) { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
const PRIORITY = { unset: -1, absent: 0, present: 1, correct: 2 };

function updateKeyboard(letter, status) {
    const normalizedLetter = normalize(letter).toLowerCase();
    const currentPriority = PRIORITY[stats.keyboardState[normalizedLetter] || 'unset'];
    const newPriority = PRIORITY[status];

    if (newPriority > currentPriority) {
        stats.keyboardState[normalizedLetter] = status;
        saveStats(); // Salva o estado do teclado
    }
}

function updateKeyboardState() {
    document.querySelectorAll(".key").forEach(key => {
        const char = key.id.replace('key-', '');
        const status = stats.keyboardState[char] || 'unset';
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

// ... (as funções saveCurrentState e loadState permanecem as mesmas) ...
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

// ALTERADO: Função revealGuess para incluir chamadas ao placar e animação de pulo
function revealGuess(guess) {
    isAnimating = true;
    const state = gameState[activeMode];
    const activeBoards = gameBoards[activeMode];
    let allSolvedNow = true;
    let anyBoardSolvedThisTurn = false;

    for (let i = 0; i < activeBoards.length; i++) {
        if (!state.solved[i]) {
            const statuses = getStatuses(guess, state.targets[i]);
            animateRowFlip(activeBoards[i], state.currentRow, statuses, guess);
            if (statuses.every(s => s === 'correct')) {
                state.solved[i] = true;
                anyBoardSolvedThisTurn = true;
            }
        }
        if (!state.solved[i]) allSolvedNow = false;
    }

    setTimeout(() => {
        if (anyBoardSolvedThisTurn) {
            // Chama a animação de pulo para as linhas recém-resolvidas
            for (let i = 0; i < activeBoards.length; i++) {
                if (state.solved[i]) {
                    const rowElement = activeBoards[i].querySelectorAll(".row")[state.currentRow];
                    const tiles = Array.from(rowElement.children);
                    tiles.forEach((tile, j) => {
                        setTimeout(() => tile.classList.add("bounce"), j * 100);
                    });
                }
            }
        }

        isAnimating = false;
        if (allSolvedNow) {
            addWin(state.currentRow + 1);
            setTimeout(() => {
                alert("Parabéns, você acertou tudo!");
                updatePlacarModal();
                placarModal.style.display = 'flex';
            }, 500);
            return;
        }
        if (state.currentRow >= state.maxRows - 1) {
            addLoss();
            alert("Fim de jogo! As palavras eram: " + state.targets.join(", ").toUpperCase());
            updatePlacarModal();
            placarModal.style.display = 'flex';
            return;
        }
        state.currentRow++;
        state.currentCol = 0;
        updateSelection();
    }, wordLength * 300 + 500);
}

// ... (a função animateRowFlip permanece a mesma) ...
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

// NOVO: Função para a animação de tremer
function shakeCurrentRow() {
    const state = gameState[activeMode];
    gameBoards[activeMode].forEach(board => {
        const rowElement = board.querySelectorAll(".row")[state.currentRow];
        if (rowElement) {
            rowElement.classList.add('shake');
            setTimeout(() => rowElement.classList.remove('shake'), 600);
        }
    });
}

// ALTERADO: handleKeyPress para usar a animação de tremer em vez de alerts
function handleKeyPress(event) {
    if (isAnimating) return;
    const key = event.key;
    const state = gameState[activeMode];
    if (state.solved.every(s => s === true) || state.currentRow >= state.maxRows) return;
    const primaryBoard = gameBoards[activeMode][0];
    const row = primaryBoard.querySelectorAll(".row")[state.currentRow];
    if (!row) return;

    if (key === "Backspace") {
        if (state.currentCol > 0) {
            state.currentCol--;
            gameBoards[activeMode].forEach(board => {
                board.querySelectorAll(".row")[state.currentRow].children[state.currentCol].querySelector(".front").textContent = "";
            });
        }
    } else if (key === "Enter") {
        const tiles = Array.from(row.children);
        const isComplete = tiles.every(tile => tile.querySelector('.front').textContent !== '');

        if (!isComplete) {
            shakeCurrentRow();
            return;
        }

        let guess = tiles.map(tile => tile.querySelector(".front").textContent).join('').toLowerCase();
        
        if (!words.some(w => normalize(w) === normalize(guess))) {
            shakeCurrentRow();
            return;
        }
        revealGuess(guess);
    
    } else if (key.startsWith("Arrow")) {
      event.preventDefault();
      if (key === "ArrowLeft" && state.currentCol > 0) state.currentCol--;
      else if (key === "ArrowRight" && state.currentCol < wordLength) state.currentCol++;
    
    } else if (/^[a-zA-ZÀ-ÿ]$/.test(key) && state.currentCol < wordLength) {
        gameBoards[activeMode].forEach(board => {
            board.querySelectorAll(".row")[state.currentRow].children[state.currentCol].querySelector(".front").textContent = key.toUpperCase();
        });
        state.currentCol++;
    }
    updateSelection();
}

// ... (a função updateSelection permanece a mesma) ...
function updateSelection() {
    const state = gameState[activeMode];
    document.querySelectorAll(".front").forEach(f => f.classList.remove("selected"));
    
    if (state.currentCol <= wordLength) { 
        gameBoards[activeMode].forEach(board => {
            const colToSelect = Math.min(state.currentCol, wordLength - 1);
            const tile = board.querySelectorAll(".row")[state.currentRow]?.children[colToSelect];
            if (tile) tile.querySelector(".front").classList.add("selected");
        });
    }
}


async function initialize() {
    stats = getInitialStats(); // Carrega as estatísticas salvas
    
    try {
        const response = await fetch('palavras.txt');
        const text = await response.text();
        words = text.split('\n').map(word => word.trim().toLowerCase()).filter(word => word.length > 0 && /^[a-zà-ÿ]+$/.test(word));
    } catch (error) {
        console.error("Erro ao carregar o arquivo de palavras:", error);
        alert("Não foi possível carregar a lista de palavras.");
        return;
    }

    for (const mode in gameBoards) {
        const boards = gameBoards[mode];
        const maxRowsForMode = gameState[mode].maxRows;
        boards.forEach(boardElement => {
            boardElement.innerHTML = ''; // Limpa o tabuleiro antes de recriar
            for (let r = 0; r < maxRowsForMode; r++) {
                const row = document.createElement("div");
                row.className = "row";
                for (let c = 0; c < wordLength; c++) {
                    const tile = document.createElement("div");
                    tile.className = "tile";
                    tile.innerHTML = `<div class="front"></div><div class="back"></div>`;
                    tile.addEventListener('click', () => {
                        const state = gameState[activeMode];
                        if (r === state.currentRow && !isAnimating) {
                            state.currentCol = c;
                            updateSelection();
                        }
                    });
                    row.appendChild(tile);
                }
                boardElement.appendChild(row);
            }
        });
    }

    keyboard.innerHTML = ''; // Limpa o teclado antes de recriar
    const layout = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
    layout.forEach(line => {
        const row = document.createElement("div"); row.className = "key-row";
        for (let char of line) {
            const key = document.createElement("div"); key.className = "key";
            key.id = "key-" + char; key.textContent = char;
            key.addEventListener('click', () => handleKeyPress({ key: char, preventDefault: () => {} }));
            row.appendChild(key);
        }
        keyboard.appendChild(row);
    });

    ['solo', 'dueto'].forEach(mode => {
        const state = gameState[mode];
        state.targets = []; state.solved = []; // Reseta para um novo jogo
        const numTargets = (mode === 'solo') ? 1 : 2;
        for (let i = 0; i < numTargets; i++) {
            let newWord;
            do {
                newWord = words[Math.floor(Math.random() * words.length)];
            } while (state.targets.includes(newWord));
            state.targets.push(newWord);
            state.solved.push(false);
        }
        const maxRowsForMode = gameState[mode].maxRows;
        state.boardState = Array(numTargets).fill().map(() => Array(maxRowsForMode).fill().map(() => Array(wordLength).fill({ letter: '', status: null, isFlipped: false })));
    });

    document.addEventListener("keydown", e => handleKeyPress(e));
    tabSolo.addEventListener("click", () => switchGameMode("solo"));
    tabDueto.addEventListener("click", () => switchGameMode("dueto"));
    
    // ALTERADO: O código do tema foi movido para o final
    const themeBtn = document.getElementById('toggle-theme');
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.className = savedTheme;
    themeBtn.textContent = savedTheme === 'dark' ? '🌙' : '☀️';

    themeBtn.addEventListener('click', () => {
        const currentTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
        document.body.className = currentTheme;
        themeBtn.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
        localStorage.setItem('theme', currentTheme);
    });

    loadState("solo");
}

initialize();
