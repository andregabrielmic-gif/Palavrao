let words = [];
let activeMode = 'solo';
let isAnimating = false;
const wordLength = 5;

const gameState = {
    solo: { targets: [], solved: [], currentRow: 0, currentCol: 0, boardState: [], maxRows: 6 },
    dueto: { targets: [], solved: [], currentRow: 0, currentCol: 0, boardState: [], maxRows: 7 },
    quarteto: { targets: [], solved: [], currentRow: 0, currentCol: 0, boardState: [], maxRows: 9 }
};

// Elementos do DOM
const keyboard = document.getElementById("keyboard");
const tabSolo = document.getElementById("tab-solo");
const tabDueto = document.getElementById("tab-dueto");
const tabQuarteto = document.getElementById("tab-quarteto"); 
const soloContainer = document.getElementById("solo-container");
const duetoContainer = document.getElementById("dueto-container");
const quartetoContainer = document.getElementById("quarteto-container"); 

const gameBoards = {
    solo: [document.getElementById("game-solo")],
    dueto: [document.getElementById("game-dueto1"), document.getElementById("game-dueto2")],
    quarteto: [ 
        document.getElementById("game-quarteto1"), 
        document.getElementById("game-quarteto2"),
        document.getElementById("game-quarteto3"),
        document.getElementById("game-quarteto4")
    ] 
};

// Elementos do Placar
const placarModal = document.getElementById('placar-modal');
const placarBtn = document.getElementById('placar-btn');
const closeModalBtn = document.querySelector('.modal-close-btn');
let stats = {};

// Mapa de cores para desenhar o teclado
const COLORS = {
    correct: '#538d4e',
    present: '#b59f3b',
    absent: '#3a3a3c',
    unset: '#818384'
};

// --- LÓGICA DO PLACAR ---

function getInitialStats() {
    const savedStats = localStorage.getItem('termoGameStats');
    let statsData;

    try {
        statsData = savedStats ? JSON.parse(savedStats) : {};
    } catch (e) {
        statsData = {};
    }

    const defaultStats = {
        gamesPlayed: 0, 
        wins: 0, 
        currentStreak: 0, 
        maxStreak: 0,
        guessDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 },
        keyboardStates: {
            solo: {},
            dueto: {},
            quarteto: {} 
        }
    };

    // Migração de dados antigos se necessário
    if (statsData.keyboardState) {
        delete statsData.keyboardState; 
    }
    
    return { ...defaultStats, ...statsData };
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
    graficoContainer.innerHTML = '';
    const maxDistribution = Math.max(...Object.values(stats.guessDistribution).filter(v => v > 0));

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
        bar.style.width = count > 0 ? `${percentage}%` : '0%';
        bar.textContent = count;
        
        barContainer.appendChild(bar);
        graficoContainer.appendChild(label);
        graficoContainer.appendChild(barContainer);
    }
}

function normalize(str) { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
const PRIORITY = { unset: -1, absent: 0, present: 1, correct: 2 };

// --- NOVA LÓGICA DE TECLADO ---
// Agora aceita o índice do tabuleiro (boardIndex) para saber qual parte pintar
function updateKeyboard(letter, status, boardIndex) {
    const normalizedLetter = normalize(letter).toLowerCase();
    const modeState = stats.keyboardStates[activeMode]; 
    if (!modeState) return; 

    // Inicializa se não existir
    if (!modeState[normalizedLetter]) {
        if (activeMode === 'solo') modeState[normalizedLetter] = 'unset';
        else if (activeMode === 'dueto') modeState[normalizedLetter] = ['unset', 'unset'];
        else if (activeMode === 'quarteto') modeState[normalizedLetter] = ['unset', 'unset', 'unset', 'unset'];
    }

    // Atualiza baseada na prioridade
    if (activeMode === 'solo') {
        const currentPriority = PRIORITY[modeState[normalizedLetter]];
        if (PRIORITY[status] > currentPriority) {
            modeState[normalizedLetter] = status;
        }
    } else {
        // Para Dueto e Quarteto, atualizamos o índice específico do array
        const currentStatus = modeState[normalizedLetter][boardIndex];
        const currentPriority = PRIORITY[currentStatus];
        if (PRIORITY[status] > currentPriority) {
            modeState[normalizedLetter][boardIndex] = status;
        }
    }
}

function updateKeyboardState() {
    const modeState = stats.keyboardStates[activeMode];
    
    document.querySelectorAll(".key").forEach(key => {
        // Limpa estilos inline antigos
        key.style.background = '';
        key.className = 'key'; // Reseta classes

        // Ignora teclas especiais
        if (key.getAttribute('data-key').length > 1) return;

        const char = key.getAttribute('data-key');
        // Se não tiver estado salvo para essa letra, sai
        if (!modeState || !modeState[char]) return;

        const data = modeState[char];

        if (activeMode === 'solo') {
            if (data !== 'unset') key.classList.add(data);
        } 
        else if (activeMode === 'dueto') {
            // Cria gradiente linear (metade esquerda / metade direita)
            const c1 = COLORS[data[0]] || COLORS.unset;
            const c2 = COLORS[data[1]] || COLORS.unset;
            key.style.background = `linear-gradient(90deg, ${c1} 50%, ${c2} 50%)`;
        } 
        else if (activeMode === 'quarteto') {
            // Cria gradiente cônico para 4 quadrantes
            // Ordem visual: TopLeft(0), TopRight(1), BotLeft(2), BotRight(3)
            // Conic gradient começa 12h (Top). 
            // 0-90deg (TopRight -> index 1)
            // 90-180deg (BotRight -> index 3)
            // 180-270deg (BotLeft -> index 2)
            // 270-360deg (TopLeft -> index 0)
            
            const c1 = COLORS[data[0]] || COLORS.unset; // Top Left
            const c2 = COLORS[data[1]] || COLORS.unset; // Top Right
            const c3 = COLORS[data[2]] || COLORS.unset; // Bot Left
            const c4 = COLORS[data[3]] || COLORS.unset; // Bot Right

            key.style.background = `conic-gradient(${c2} 0% 25%, ${c4} 25% 50%, ${c3} 50% 75%, ${c1} 75% 100%)`;
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
                    status: back.className.match(/correct|present|absent/)?.[0] || null,
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
        const boardData = state.boardState[boardIndex] || [];
        const rows = board.querySelectorAll('.row');
        rows.forEach((row, rIndex) => {
            const tiles = row.querySelectorAll('.tile');
            tiles.forEach((tile, tIndex) => {
                const tileData = (boardData[rIndex] && boardData[rIndex][tIndex]) ? boardData[rIndex][tIndex] : { letter: '', status: null, isFlipped: false };
                tile.querySelector('.front').textContent = tileData.letter;
                const back = tile.querySelector('.back');
                back.textContent = tileData.letter;
                back.classList.remove('correct', 'present', 'absent');
                tile.classList.remove('flip');
                if (tileData.status) back.classList.add(tileData.status);
                if (tileData.isFlipped) tile.classList.add('flip');
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

    soloContainer.style.display = 'none';
    duetoContainer.style.display = 'none';
    quartetoContainer.style.display = 'none';
    
    tabSolo.classList.remove("active");
    tabDueto.classList.remove("active");
    tabQuarteto.classList.remove("active");
    
    if (newMode === 'solo') {
        soloContainer.style.display = 'flex'; 
        tabSolo.classList.add("active");
    } else if (newMode === 'dueto') {
        duetoContainer.style.display = 'flex';
        tabDueto.classList.add("active");
    } else if (newMode === 'quarteto') {
        quartetoContainer.style.display = 'flex'; 
        tabQuarteto.classList.add("active");
    }

    loadState(newMode); 
}


function revealGuess(guess) {
    isAnimating = true;
    const state = gameState[activeMode];
    const activeBoards = gameBoards[activeMode];
    let allSolvedNow = true;
    let anyBoardSolvedThisTurn = false;

    for (let i = 0; i < activeBoards.length; i++) {
        // Só verifica tabuleiros que ainda NÃO foram resolvidos
        if (!state.solved[i]) {
            const statuses = getStatuses(guess, state.targets[i]);
            // Passa o índice 'i' para saber qual pedaço do teclado pintar
            animateRowFlip(activeBoards[i], state.currentRow, statuses, guess, i);
            if (statuses.every(s => s === 'correct')) {
                state.solved[i] = true;
                anyBoardSolvedThisTurn = true;
            }
        }
        if (!state.solved[i]) allSolvedNow = false;
    }

    setTimeout(() => {
        if (anyBoardSolvedThisTurn) {
            for (let i = 0; i < activeBoards.length; i++) {
                if (state.solved[i]) {
                    // Efeito visual de vitória na linha
                    const rowElement = activeBoards[i].querySelectorAll(".row")[state.currentRow];
                    const tiles = Array.from(rowElement.children);
                    tiles.forEach((tile, j) => {
                        setTimeout(() => tile.classList.add("bounce"), j * 100);
                    });
                    // Adiciona classe para "apagar" o tabuleiro ganho (opcional)
                    activeBoards[i].classList.add("solved-board");
                }
            }
        }
        isAnimating = false;
        
        if (allSolvedNow) {
            addWin(state.currentRow + 1);
            saveStats(); 
            setTimeout(() => {
                alert("Parabéns, você acertou tudo!");
                updatePlacarModal();
                placarModal.style.display = 'flex';
            }, 1000); 
            return;
        }
        
        if (state.currentRow >= state.maxRows - 1) {
            addLoss();
            saveStats(); 
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

function animateRowFlip(boardElement, rowIndex, statuses, guess, boardIndex) {
    const rowElement = boardElement.querySelectorAll(".row")[rowIndex];
    const tiles = Array.from(rowElement.children);
    tiles.forEach((tile, i) => {
        const back = tile.querySelector(".back");
        back.textContent = guess[i].toUpperCase();
        back.classList.add(statuses[i]);
        
        // Atualiza o pedaço específico do teclado
        updateKeyboard(guess[i], statuses[i], boardIndex);
        
        setTimeout(() => tile.classList.add("flip"), i * 300);
    });
    setTimeout(updateKeyboardState, wordLength * 300);
}

function shakeCurrentRow() {
    const state = gameState[activeMode];
    // Balança apenas os tabuleiros não resolvidos
    gameBoards[activeMode].forEach((board, index) => {
        if (!state.solved[index]) {
            const rowElement = board.querySelectorAll(".row")[state.currentRow];
            if (rowElement) {
                rowElement.classList.add('shake');
                setTimeout(() => rowElement.classList.remove('shake'), 600);
            }
        }
    });
}


function handleKeyPress(event) {
    if (isAnimating) return;
    const key = event.key;
    const state = gameState[activeMode];
    
    // Se todos estiverem resolvidos ou acabou as chances, para tudo.
    if (state.solved.every(s => s === true) || state.currentRow >= state.maxRows) return;

    if (key === "ArrowRight") {
        event.preventDefault(); 
        if (state.currentCol < wordLength - 1) { 
            state.currentCol++;
            updateSelection(); 
        }
        return; 
    }

    if (key === "ArrowLeft") {
        event.preventDefault(); 
        if (state.currentCol > 0) { 
            state.currentCol--;
            updateSelection(); 
        }
        return; 
    }

    // --- CORREÇÃO DO BACKSPACE ---
    if (key === "Backspace") {
        // Se a coluna atual tiver letra, apaga ela
        let hasLetterCurrent = false;
        // Verifica o primeiro board não resolvido para saber se tem letra
        const firstActiveBoardIndex = state.solved.findIndex(s => s === false);
        if (firstActiveBoardIndex !== -1) {
             const tile = gameBoards[activeMode][firstActiveBoardIndex]
                .querySelectorAll(".row")[state.currentRow]
                .children[state.currentCol];
             if (tile.querySelector(".front").textContent !== "") {
                 hasLetterCurrent = true;
             }
        }

        if (hasLetterCurrent) {
            gameBoards[activeMode].forEach((board, index) => {
                if (!state.solved[index]) { // SÓ APAGA NOS NÃO RESOLVIDOS
                    board.querySelectorAll(".row")[state.currentRow]
                         .children[state.currentCol]
                         .querySelector(".front").textContent = "";
                }
            });
        } 
        else if (state.currentCol > 0) {
            state.currentCol--; 
            gameBoards[activeMode].forEach((board, index) => {
                if (!state.solved[index]) { // SÓ APAGA NOS NÃO RESOLVIDOS
                    board.querySelectorAll(".row")[state.currentRow]
                         .children[state.currentCol]
                         .querySelector(".front").textContent = "";
                }
            });
        }
        updateSelection(); 
        return; 
    } 
    
    else if (key === "Enter") {
        // Verifica se completou usando o primeiro board não resolvido como referência
        const firstActiveBoard = gameBoards[activeMode][state.solved.findIndex(s => s === false)];
        if (!firstActiveBoard) return;

        const row = firstActiveBoard.querySelectorAll(".row")[state.currentRow];
        const tiles = Array.from(row.children);
        const isComplete = tiles.every(tile => tile.querySelector(".front").textContent !== '');
        
        if (!isComplete) { 
            shakeCurrentRow();
            return;
        }

        const guess = tiles.map(tile => tile.querySelector(".front").textContent).join('');
        
        if (!words.some(w => normalize(w) === normalize(guess.toLowerCase()))) {
            shakeCurrentRow();
            return;
        }
        revealGuess(guess);
        return; 
    } 
    
    else if (/^[a-zA-ZÀ-ÿ]$/.test(key) && state.currentCol < wordLength) {
        gameBoards[activeMode].forEach((board, index) => {
            // --- TRAVA DE QUADROS RESOLVIDOS ---
            // Só escreve se o board NÃO estiver resolvido
            if (!state.solved[index]) {
                board.querySelectorAll(".row")[state.currentRow]
                     .children[state.currentCol]
                     .querySelector(".front").textContent = key.toUpperCase();
            }
	    });
        
        if (state.currentCol < wordLength - 1) {
            state.currentCol++;
        }
        updateSelection();
        return; 
    }
}


function updateSelection() {
    const state = gameState[activeMode];
    document.querySelectorAll(".front").forEach(f => f.classList.remove("selected"));
    
    // Se o jogo acabou, não seleciona nada
    if (state.solved.every(s => s) || state.currentRow >= state.maxRows) return;

    if (state.currentCol < wordLength && state.currentRow < state.maxRows) {
        gameBoards[activeMode].forEach((board, index) => {
            // Só mostra a seleção nos boards ativos
            if (!state.solved[index]) {
                const tile = board.querySelectorAll(".row")[state.currentRow]?.children[state.currentCol];
                if (tile) tile.querySelector(".front").classList.add("selected");
            }
        });
    }
}

async function initialize() {
    stats = getInitialStats(); 
    
    // Limpa o teclado sempre que inicia
    stats.keyboardStates = {
        solo: {},
        dueto: {},
        quarteto: {} 
    };
    saveStats();

    try {
        const response = await fetch('palavras.txt');
        const text = await response.text();
        words = text.split('\n').map(word => word.trim().toLowerCase()).filter(w => w.length === wordLength && /^[a-zà-ÿ]+$/.test(w));
    } catch (error) {
        console.error("Erro ao carregar o arquivo de palavras:", error);
        alert("Não foi possível carregar a lista de palavras.");
        return;
    }

    for (const mode in gameBoards) {
        const boards = gameBoards[mode];
        const maxRowsForMode = gameState[mode].maxRows;
        boards.forEach(boardElement => {
            boardElement.innerHTML = '';
            // Remove classe de resolvido ao reiniciar
            boardElement.classList.remove("solved-board");
            
            for (let r = 0; r < maxRowsForMode; r++) {
                const row = document.createElement("div");
                row.className = "row";
                for (let c = 0; c < wordLength; c++) {
                    const tile = document.createElement("div");
                    tile.className = "tile";
                    tile.innerHTML = `<div class="front"></div><div class="back"></div>`;
                    // Clique no tile (opcional, ajustado para respeitar trava)
                    tile.addEventListener('click', () => {
                        const state = gameState[activeMode];
                        // Só muda cursor se não estiver animando E se o jogo não acabou
                        if (r === state.currentRow && !isAnimating && !state.solved.every(s=>s)) {
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

    keyboard.innerHTML = '';
    const layout = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
    layout.forEach(line => {
        const row = document.createElement("div"); row.className = "key-row";
        const enterKey = document.createElement("div"); enterKey.className = "key"; enterKey.textContent = "Enter";
        const backspaceKey = document.createElement("div"); backspaceKey.className = "key"; backspaceKey.textContent = "⌫";

        enterKey.setAttribute('data-key', 'Enter');
        backspaceKey.setAttribute('data-key', 'Backspace');

        if (line === "zxcvbnm") row.appendChild(enterKey);
        for (let char of line) {
            const key = document.createElement("div"); key.className = "key";
            key.id = "key-" + char; key.textContent = char;
            
            key.setAttribute('data-key', char); 

            key.addEventListener('click', () => handleKeyPress({ key: char }));
            row.appendChild(key);
        }
        if (line === "zxcvbnm") row.appendChild(backspaceKey);
        keyboard.appendChild(row);

        enterKey.addEventListener('click', () => handleKeyPress({ key: 'Enter' }));
        backspaceKey.addEventListener('click', () => handleKeyPress({ key: 'Backspace' }));
    });

    ['solo', 'dueto', 'quarteto'].forEach(mode => {
        const state = gameState[mode];
        state.targets = []; state.solved = [];
        
        let numTargets = 1; 
        if (mode === 'dueto') numTargets = 2;
        if (mode === 'quarteto') numTargets = 4;

        for (let i = 0; i < numTargets; i++) {
            let newWord;
            do { newWord = words[Math.floor(Math.random() * words.length)]; } while (state.targets.includes(newWord));
            state.targets.push(newWord);
            state.solved.push(false);
        }
        const maxRowsForMode = gameState[mode].maxRows;
        state.boardState = Array(numTargets).fill().map(() => Array(maxRowsForMode).fill().map(() => Array(wordLength).fill({ letter: '', status: null, isFlipped: false })));
    });

    document.addEventListener("keydown", handleKeyPress);
    tabSolo.addEventListener("click", () => switchGameMode("solo"));
    tabDueto.addEventListener("click", () => switchGameMode("dueto"));
    tabQuarteto.addEventListener("click", () => switchGameMode("quarteto")); 
    
    placarBtn.addEventListener('click', () => {
        updatePlacarModal();
        placarModal.style.display = 'flex';
    });
    closeModalBtn.addEventListener('click', () => placarModal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === placarModal) placarModal.style.display = 'none';
    });

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
