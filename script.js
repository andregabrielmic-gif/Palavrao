let words = [];
let activeMode = 'solo';
let isAnimating = false;
const wordLength = 5;

const gameState = {
    solo: { targets: [], solved: [], currentRow: 0, currentCol: 0, boardState: [], maxRows: 6 },
    dueto: { targets: [], solved: [], currentRow: 0, currentCol: 0, boardState: [], maxRows: 7 }
};

// Elementos do DOM
const keyboard = document.getElementById("keyboard");
const tabSolo = document.getElementById("tab-solo");
const tabDueto = document.getElementById("tab-dueto");
const soloContainer = document.getElementById("solo-container");
const duetoContainer = document.getElementById("dueto-container");
const gameBoards = {
    solo: [document.getElementById("game-solo")],
    dueto: [document.getElementById("game-dueto1"), document.getElementById("game-dueto2")]
};

// Elementos do Placar
const placarModal = document.getElementById('placar-modal');
const placarBtn = document.getElementById('placar-btn');
const closeModalBtn = document.querySelector('.modal-close-btn');
let stats = {};

// --- LÓGICA DO PLACAR ---
function getInitialStats() {
    const savedStats = localStorage.getItem('termoGameStats');
    return savedStats ? JSON.parse(savedStats) : {
        gamesPlayed: 0, wins: 0, currentStreak: 0, maxStreak: 0,
        guessDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 },
        keyboardState: {}
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
// --- FIM DA LÓGICA DO PLACAR ---

function normalize(str) { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
const PRIORITY = { unset: -1, absent: 0, present: 1, correct: 2 };

function updateKeyboard(letter, status) {
    const normalizedLetter = normalize(letter).toLowerCase();
    const currentPriority = PRIORITY[stats.keyboardState[normalizedLetter] || 'unset'];
    const newPriority = PRIORITY[status];

    if (newPriority > currentPriority) {
        stats.keyboardState[normalizedLetter] = status;
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

// --- CORREÇÃO 1 de 2: Adicionando a nova função de reset ---
/**
 * DOCUMENTAÇÃO: resetKeyboardState
 * Objetivo: Limpa o estado lógico (stats.keyboardState) e visual (classes CSS)
 * do teclado. Essencial para trocar de modo de jogo.
 */
function resetKeyboardState() {
    // 1. Limpa o objeto de dados (o "cérebro" do teclado)
    stats.keyboardState = {};
    
    // 2. Limpa o visual (remove as classes CSS de todas as teclas)
    document.querySelectorAll(".key").forEach(key => {
        key.classList.remove('correct', 'present', 'absent');
    });
}
// --- FIM DA CORREÇÃO 1 ---

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

    // --- CORREÇÃO 2 de 2: Chamando a função de reset aqui! ---
    // Antes de trocar de modo, nós limpamos o teclado.
    resetKeyboardState();
    // --- FIM DA CORREÇÃO 2 ---

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
            for (let i = 0; i < activeBoards.length; i++) {
                if (state.solved[i]) {
                    const rowElement = activeBoards[i].querySelectorAll(".row")[state.currentRow];
                    const tiles = Array.from(rowElement.children);
              _       tiles.forEach((tile, j) => {
                        setTimeout(() => tile.classList.add("bounce"), j * 100);
                    });
                }
            }
        }
        isAnimating = false;
        if (allSolvedNow) {
            addWin(state.currentRow + 1);
            saveStats(); // Salva o estado do teclado também
            setTimeout(() => {
                alert("Parabéns, você acertou tudo!");
                updatePlacarModal();
                placarModal.style.display = 'flex';
            }, 1000); // Atraso maior para ver a animação
            return;
        }
        if (state.currentRow >= state.maxRows - 1) {
            addLoss();
            saveStats(); // Salva o estado do teclado também
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
    // Salva o estado do teclado APÓS a linha ser revelada
    setTimeout(updateKeyboardState, wordLength * 300);
}

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

// ===================================================================
// ESTA É A VERSÃO CORRETA DA FUNÇÃO
// ===================================================================

function handleKeyPress(event) {
    if (isAnimating) return;
    const key = event.key;
    const state = gameState[activeMode];
    if (state.solved.every(s => s === true) || state.currentRow >= state.maxRows) return;
    const primaryBoard = gameBoards[activeMode][0];
    const row = primaryBoard.querySelectorAll(".row")[state.currentRow];
    if (!row) return;

    // --- 1. NAVEGAÇÃO COM SETAS (COM PREVENTDEFAULT) ---
    if (key === "ArrowRight") {
        event.preventDefault(); // <-- CORREÇÃO: Impede o navegador de rolar a página
        if (state.currentCol < wordLength - 1) { 
            state.currentCol++;
            updateSelection(); 
        }
        return; // Termina a função aqui
    }

    if (key === "ArrowLeft") {
        event.preventDefault(); // <-- CORREÇÃO: Impede o navegador de rolar a página
        if (state.currentCol > 0) { 
            state.currentCol--;
            updateSelection(); 
        }
        return; // Termina a função aqui
    }

    // 2. CORREÇÃO DO BACKSPACE
    if (key === "Backspace") {
        const currentTile = row.children[state.currentCol];
        if (!currentTile) return; // Segurança

        // Se o tile ATUAL (selecionado) tiver texto, apaga-o e FICA LÁ.
        if (currentTile.querySelector(".front").textContent !== "") {
            gameBoards[activeMode].forEach(board => {
                board.querySelectorAll(".row")[state.currentRow].children[state.currentCol].querySelector(".front").textContent = "";
            });
        } 
        // Se o tile atual JÁ ESTIVER VAZIO E não for o primeiro tile
        // Então, move para trás e apaga o anterior (comportamento padrão).
        else if (state.currentCol > 0) {
            state.currentCol--; // Move o cursor para trás
            gameBoards[activeMode].forEach(board => {
                board.querySelectorAll(".row")[state.currentRow].children[state.currentCol].querySelector(".front").textContent = "";
            });
        }
        updateSelection(); // Atualiza a seleção visual
        return; // Termina a função aqui
    } 
    
    // 3. CORREÇÃO DO ENTER
    else if (key === "Enter") {
        const tiles = Array.from(row.children);
        
        // Nova verificação: checa se TODOS os tiles estão preenchidos
        const isComplete = tiles.every(tile => tile.querySelector(".front").textContent !== '');
        
        if (!isComplete) { // Se qualquer tile estiver vazio, balança
            shakeCurrentRow();
            return;
        }

        // Se estiver completo, continua a lógica original
        const guess = tiles.map(tile => tile.querySelector(".front").textContent).join('');
        
        if (!words.some(w => normalize(w) === normalize(guess.toLowerCase()))) {
            shakeCurrentRow();
            return;
        }
        revealGuess(guess);
        return; // Termina a função aqui
    } 
    
    // 4. LÓGICA DE DIGITAR LETRA (AJUSTADA)
    else if (/^[a-zA-ZÀ-ÿ]$/.test(key) && state.currentCol < wordLength) {
        // Coloca a letra no quadrado selecionado
        gameBoards[activeMode].forEach(board => {
            board.querySelectorAll(".row")[state.currentRow].children[state.currentCol].querySelector(".front").textContent = key.toUpperCase();
        });
        
        // Só avança o cursor se não estiver na última coluna
        if (state.currentCol < wordLength - 1) {
            state.currentCol++;
        }
        updateSelection();
        return; // Termina a função aqui
    }
}

// ===================================================================
// FIM DA FUNÇÃO
// ===================================================================


function updateSelection() {
    const state = gameState[activeMode];
    document.querySelectorAll(".front").forEach(f => f.classList.remove("selected"));
    if (state.currentCol < wordLength && state.currentRow < state.maxRows) {
        gameBoards[activeMode].forEach(board => {
            const tile = board.querySelectorAll(".row")[state.currentRow]?.children[state.currentCol];
            if (tile) tile.querySelector(".front").classList.add("selected");
        });
    }
}

async function initialize() {
    stats = getInitialStats();
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
            for (let r = 0; r < maxRowsForMode; r++) {
                const row = document.createElement("div");
                row.className = "row";
                for (let c = 0; c < wordLength; c++) {
                    const tile = document.createElement("div");
                    tile.className = "tile";
                    tile.innerHTML = `<div class="front"></div><div class="back"></div>`;
      _               tile.addEventListener('click', () => {
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

    keyboard.innerHTML = '';
    const layout = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
    layout.forEach(line => {
        const row = document.createElement("div"); row.className = "key-row";
        const enterKey = document.createElement("div"); enterKey.className = "key"; enterKey.textContent = "Enter";
        const backspaceKey = document.createElement("div"); backspaceKey.className = "key"; backspaceKey.textContent = "⌫";

        if (line === "zxcvbnm") row.appendChild(enterKey);
        for (let char of line) {
            const key = document.createElement("div"); key.className = "key";
            key.id = "key-" + char; key.textContent = char;
          _   key.addEventListener('click', () => handleKeyPress({ key: char }));
            row.appendChild(key);
        }
        if (line === "zxcvbnm") row.appendChild(backspaceKey);
        keyboard.appendChild(row);

        enterKey.addEventListener('click', () => handleKeyPress({ key: 'Enter' }));
        backspaceKey.addEventListener('click', () => handleKeyPress({ key: 'Backspace' }));
    });

    ['solo', 'dueto'].forEach(mode => {
        const state = gameState[mode];
        state.targets = []; state.solved = [];
        const numTargets = (mode === 'solo') ? 1 : 2;
        for (let i = 0; i < numTargets; i++) {
            let newWord;
            do { newWord = words[Math.floor(Math.random() * words.length)]; } while (state.targets.includes(newWord));
            state.targets.push(newWord);
            state.solved.push(false);
        }
        const maxRowsForMode = gameState[mode].maxRows;
        state.boardState = Array(numTargets).fill().map(() => Array(maxRowsForMode).fill().map(() => Array(wordLength).fill({ letter: '', status: null, isFlipped: false })));
    });

    // --- CORREÇÃO: Usando a nova função de reset no início ---
    resetKeyboardState();
    // --------------------------------------------------------

    document.addEventListener("keydown", handleKeyPress);
    tabSolo.addEventListener("click", () => switchGameMode("solo"));
    tabDueto.addEventListener("click", () => switchGameMode("dueto"));
    
    // Liga os botões do placar
    placarBtn.addEventListener('click', () => {
        updatePlacarModal();
        placarModal.style.display = 'flex';
    });
    closeModalBtn.addEventListener('click', () => placarModal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === placarModal) placarModal.style.display = 'none';
    });

    // Liga o botão de tema
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
