// Arquivo: script.js - Versão com Modo Solo e Dueto

// A lista de palavras permanece a mesma
const words = ["sagaz","âmago",/* ...cole sua lista completa de palavras aqui... */,"apoio"];

// --- VARIÁVEIS GLOBAIS DE ESTADO ---
let gameMode = 'solo'; // 'solo' ou 'dueto'
let targets = []; // Array para guardar a(s) palavra(s) alvo
let solvedStates = []; // Array para saber se cada palavra foi resolvida
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

// Mapeamento dos elementos do tabuleiro
const gameBoards = {
    solo: [document.getElementById("game-solo")],
    dueto: [document.getElementById("game-dueto1"), document.getElementById("game-dueto2")]
};

// --- FUNÇÕES DE LÓGICA (permanecem as mesmas) ---
function normalize(str) { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
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
  for (let ch of t) { counts[ch] = (counts[ch] || 0) + 1; }
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

// --- FUNÇÕES DE JOGO REESTRUTURADAS ---

// NOVO: Função central para iniciar/reiniciar o jogo
function startGame(mode) {
    gameMode = mode;
    currentRow = 0;
    currentCol = 0;
    isAnimating = false;
    targets = [];
    solvedStates = [];

    // Limpa todos os tabuleiros e o teclado
    document.querySelectorAll(".tile").forEach(tile => {
        tile.remove(); // Remove as células antigas
    });
    buildGameBoards(); // Constrói as células novas
    document.querySelectorAll(".key").forEach(key => {
        key.classList.remove("correct", "present", "absent");
        key.dataset.status = "unset";
    });

    // Sorteia as palavras alvo para o modo escolhido
    if (mode === 'solo') {
        targets.push(words[Math.floor(Math.random() * words.length)]);
        solvedStates.push(false);
        soloContainer.classList.remove("hidden");
        duetoContainer.classList.add("hidden");
        tabSolo.classList.add("active");
        tabDueto.classList.remove("active");
    } else { // modo dueto
        targets.push(words[Math.floor(Math.random() * words.length)]);
        let word2 = words[Math.floor(Math.random() * words.length)];
        while(word2 === targets[0]) { // Garante que a segunda palavra seja diferente
            word2 = words[Math.floor(Math.random() * words.length)];
        }
        targets.push(word2);
        solvedStates.push(false);
        solvedStates.push(false);
        soloContainer.classList.add("hidden");
        duetoContainer.classList.remove("hidden");
        tabSolo.classList.remove("active");
        tabDueto.classList.add("active");
    }
    console.log("Palavras alvo:", targets);
    updateSelection();
}

// ALTERADO: A animação agora acontece em uma linha específica de um tabuleiro
function animateRowFlip(boardElement, rowIndex, statuses, guess) {
    const rowElement = boardElement.querySelectorAll(".row")[rowIndex];
    const tiles = Array.from(rowElement.children);
    
    tiles.forEach((tile, i) => {
        const back = tile.querySelector(".back");
        back.textContent = guess[i].toUpperCase();
        back.classList.add(statuses[i]);
        updateKeyboard(guess[i], statuses[i]);
        
        setTimeout(() => {
            tile.classList.add("flip");
        }, i * 300);
    });
}

// ALTERADO: A revelação agora aplica a lógica a todos os tabuleiros ativos
function revealGuess(guess) {
    isAnimating = true;
    const activeBoards = gameBoards[gameMode];

    for (let i = 0; i < activeBoards.length; i++) {
        if (!solvedStates[i]) { // Só processa tabuleiros não resolvidos
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

function handleKeyPress(key) {
    if (isAnimating) return;
    const activeBoard = gameBoards[gameMode][0]; // A digitação sempre ocorre no primeiro tabuleiro visível
    const row = activeBoard.querySelectorAll(".row")[currentRow];
    if (!row) return;
    const tiles = Array.from(row.children);

    if (key === "Backspace") {
        if (currentCol > 0 && tiles[currentCol].querySelector(".front").textContent === "") {
             currentCol--;
        }
        tiles[currentCol].querySelector(".front").textContent = "";
        if(gameMode === 'dueto') {
            gameBoards.dueto[1].querySelectorAll(".row")[currentRow].children[currentCol].querySelector(".front").textContent = "";
        }
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
        // Preenche a letra em todos os tabuleiros ativos
        gameBoards[gameMode].forEach(board => {
            const currentTile = board.querySelectorAll(".row")[currentRow].children[currentCol];
            currentTile.querySelector(".front").textContent = key.toUpperCase();
        });

        // Lógica de cursor inteligente
        let nextEmptyCol = tiles.findIndex((tile, index) => index > currentCol && tile.querySelector(".front").textContent === "");
        if (nextEmptyCol === -1) nextEmptyCol = tiles.findIndex(tile => tile.querySelector(".front").textContent === "");
        currentCol = nextEmptyCol === -1 ? wordLength : nextEmptyCol;
        updateSelection();
    }
}

function updateSelection() {
    document.querySelectorAll(".front").forEach(f => f.classList.remove("selected"));
    if (currentCol < wordLength) {
        gameBoards[gameMode].forEach(board => {
            const tile = board.querySelectorAll(".row")[currentRow].children[currentCol];
            tile.querySelector(".front").classList.add("selected");
        });
    }
}

// --- INICIALIZAÇÃO E MONTAGEM DO DOM ---
function buildGameBoards() {
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
}

function setupPage() {
    buildGameBoards(); // Constrói todos os tabuleiros uma vez

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

    // Listeners do teclado e das abas
    document.addEventListener("keydown", (e) => handleKeyPress(e.key));
    tabSolo.addEventListener("click", () => startGame('solo'));
    tabDueto.addEventListener("click", () => startGame('dueto'));

    // Inicia o primeiro jogo no modo solo
    startGame('solo');
}

setupPage(); // Roda a configuração inicial da página
