// Lista de palavras fornecidas por você
const words = [
  "sagaz","âmago","termo","êxito","mexer","nobre","senso","afeto","ética","algoz",
  "plena","fazer","assim","tênue","mútua","sobre","seção","vigor","poder","sutil",
  "porém","fosse","cerne","ideia","sanar","audaz","moral","inato","desde","muito",
  "justo","sonho","honra","torpe","razão","amigo","ícone","etnia","fútil","anexo",
  "dengo","haver","lapso","então","expor","tempo","boçal","hábil","mútuo","saber",
  "casal","graça","xibiu","dizer","ardil","pesar","estar","dever","causa","tenaz",
  "sendo","ainda","pária","temor","brado","genro","comum","ápice","posse","prole",
  "ânimo","ceder","corja","pauta","detém","fugaz","censo","ânsia","culto","atroz",
  "digno","mundo","forte","mesmo","vulgo","vício","saúde","criar","cozer","todos",
  "revés","valha","jeito","pudor","denso","dogma","neném","louco","atrás","regra",
  "ordem","limbo","feliz","pedir","homem","mercê","impor","ajuda","banal","coisa",
  "juízo","forma","legal","sábio","falso","certo","falar","servo","prosa","pífio",
  "desse","presa","posso","cunho","herói","devir","viril","vendo","fácil","ontem",
  "valor","visar","linda","manso","sério","meiga","puder","mágoa","acaso","fluir",
  "afago","ímpio","lugar","temer","abrir","praxe","união","obter","gerar","burro",
  "matiz","óbvio","afins","cisma","bruma","êxodo","pleno","crise","vênia","álibi",
  "tédio","fluxo","ritmo","morte","senil","havia","levar","olhar","enfim","casta",
  "tomar","visão","gênio","prumo","ouvir","brega","reles","falta","vital","parto",
  "calma","bravo","favor","outro","tecer","vivaz","terra","reter","sábia","ameno",
  "viver","tendo","único","força","valia","laico","passo","grato","achar","noção",
  "nicho","rever","carma","nossa","papel","ranço","pobre","rogar","noite","façam",
  "prime","dúbio","fardo","farsa","ativo","coeso","fator","épico","anelo","claro",
  "óbito","selar","líder","leigo","sinto","citar","cisão","cesta","ciúme","sonso",
  "vazio","deter","atuar","velho","gente","ficar","tende","haste","adiar","humor",
  "revel","ideal","fonte","ponto","árduo","labor","igual","marco","senão","remir",
  "terno","exato","feixe","vemos","amplo","hiato","tanto","capaz","lavra","cauda",
  "débil","relva","ciclo","jovem","ótica","varão","gesto","chuva","ambos","raiva",
  "pouco","coçar","caçar","toada","sonsa","vácuo","velar","apoio","imune","série",
  "vimos","xeque","algum","farão","feito","horda","fusão","carro","entre","leito",
  "coesa","minha","sente","cruel","trama","sorte","doido","frase","lazer","brisa",
  "ímpar","verso","torço","chata","rigor","massa","botar","prece","pegar","maior",
  "dorso","seita","fauna","moção","signo","furor","áurea","preso","covil","livro",
  "agora","credo","plano","vetor","comer","flora","casto","saiba","morar","praia",
  "adeus","nunca","dócil","aliás","peste","houve","árido","setor","ambas","ardor",
  "manha","mudar","peixe","parte","visse","rezar","vírus","risco","meses","salvo",
  "vulto","junto","saída","breve","campo","vasto","ótimo","aceso","grupo","estão",
  "morro","antes","sinal","reger","lenda","andar","conta","áureo","prado","anais",
  "acima","opção","serão","verbo","festa","segue","fugir","chulo","vilão","rapaz",
  "leite","birra","motim","nação","texto","treta","brava","índio","tirar","parar",
  "átomo","fitar","ídolo","puxar","jazia","traga","tenso","reino","gerir","filho",
  "alude","átrio","prazo","tosco","prova","turba","norma","bônus","época","exame",
  "manhã","voraz","corpo","acesa","sarça","preto","cheio","bando","aonde","malta",
  "arcar","ligar","nosso","fatos","magia","quase","anciã","cópia","avião","fatal",
  "certa","longe","dessa","praga","afora","nível","fixar","oásis","sexta","mente",
  "apego","pompa","lidar","perda","apelo","tocar","coito","alado","parca","caixa",
  "sumir","verme","fraco","livre","tinha","solda","vezes","porta","lindo","firme",
  "grave","solto","bater","opaco","faixa","astro","salve","irmão","sabia","besta",
  "virão","turva","doído","atual","trupe","fenda","navio","elite","deixa","grata",
  "pardo","exijo","alçar","autor","junto","pique","curso","viria","bicho","bioma",
  "macio","desta","pagão","aluno","ético","chato","coisa","ficha","menos","calda",
  "posto","abuso","rádio","caber","vídeo","supor","culpa","judeu","lápis","verba",
  "zelar","super","gosto","suave","calão","retém","extra","agudo","molho","torso",
  "baixo","vosso","piada","facho","peito","vinha","turma","passa","pódio","sítio",
  "ruína","asilo","combo","traço","órfão","ávida","estio","pilar","turvo","louça",
  "chama","ações","mosto","forem","refém","pisar","páreo","amena","poeta","mesma",
  "bravo","museu","ereto","finda","fenda","lasso","local","meigo","optar","medir",
  "drama","busca","teste","poema","tento","surja","autos","clima","folga","rumor",
  "coral","aviso","rouca","geral","paira","cocho","amiga","calmo","pedra","boato",
  "idoso","feroz","tacha","urgia","cetro","volta","rubro","pacto","feudo","móvel",
  "crime","lição","monge","açude","golpe","ateia","daqui","tetra","ponha","ecoar",
  "ébano","carta","corso","casar","natal","monte","falha","cacho","saldo","aroma",
  "verde","plumo","vigia","itens","conto","briga","fazia","vetar","hoste","grama",
  "tribo","pasmo","tarde","fórum","manga","letal","amada","única","troça","rival",
  "ornar","chefe","vento","sósia","civil","fruto","roupa","venha","úteis","penta",
  "nuvem","pinho","tchau","órgão","plebe","areia","jogar","vazão","cargo","virar",
  "nesse","lesse","jejum","berro","arado","macro","magna","fosso","axila","finjo",
  "perto","gíria","rocha","mídia","farta","beijo","tiver","varoa","légua","troca",
  "tutor","bruto","todas","calor","bruta","traje","deste","renda","gabar","trato",
  "pomar","assar","tenha","porte","surto","perco","amado","guria","vadio","viram",
  "nessa","dança","santo","verão","âmbar","rural","feita","xucro","nesta","odiar",
  "canso","lagos","depor","mamãe","vista","fossa","laudo","aviar","bazar","canto",
  "vedar","marca","pavor","chula","etapa","recém","cheia","negar","salmo","bolsa",
  "irado","irada","cerca","certo","cifra","densa","minar","ágape","clero","visto",
  "vista","cinto","coroa","bucho","vagar","horto","horta","burra","burro","invés",
  "molde","letra","ruído","largo","larga","lesão","folha","quais","prato","sótão",
  "paiol","velha","final","penso","trago","traga","funda","fundo","deram","pasma",
  "vasta","vasto","queda","podar","olhos","troço","linha","piche","troco","troca",
  "úmido","frota","preço","folia","neste","áudio","ileso","peita","peito","outra",
  "outro","farol","resto","resta","disso","disto","manto","manta","matar","monta",
  "cosmo","redor","chave","seiva","barro","cível","bolso","bolsa","mover","misto",
  "mista","falsa","falso","lábia","lábio","retro","vazia","vazio","limpo","limpa",
  "louco","louca","nariz","veloz","justa","justo","barão","louro","loira","lutar",
  "álbum","mimar","macho","sabor","samba","gemer","dados","punha","toque","axial",
  "lucro","porca","porco","arroz","longo","longa","zumbi","calça","enjoo","rente",
  "calvo","calva","venho","venha","findo","salva","salvo","subir","farto","farta",
  "urgir","diabo","pagar","pagou","lousa","baixa","baixo","pluma","firma","solta",
  "sacar","sabiá","sábio","ousar","valer","sexto","bruxa","forro","torna","fazes",
  "sigla","fátuo","repor","reler","fugiu","lento","gueto","hífen","bugre","focar",
  "pular","demão","canil","corte","corar","custo","feira","mania","versa","míope",
  "sadio","ferir","sócio","harém","tumba","sugar","tênis","digna","penca","ceifa",
  "bolos","doces", "disco", "circo", "rouco", "pisca", "prata", "brasa", "broxa", "altar", "fruta", "blusa", "rampa", "palma", "placa"
];

// Palavra alvo sorteada
const target = words[Math.floor(Math.random() * words.length)];

// Normaliza acentos para comparação
function normalize(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

let currentRow = 0;
let currentCol = 0;
const maxRows = 7;
const wordLength = 5;

const game = document.getElementById("game");
const keyboard = document.getElementById("keyboard");

// Criar o tabuleiro
for (let r = 0; r < maxRows; r++) {
  const row = document.createElement("div");
  row.className = "row";
  for (let c = 0; c < wordLength; c++) {
    const tile = document.createElement("div");
    tile.className = "tile";
    row.appendChild(tile);
  }
  game.appendChild(row);
}

// Criar teclado virtual
const layout = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
layout.forEach(line => {
  const row = document.createElement("div");
  row.className = "key-row";
  for (let char of line) {
    const key = document.createElement("div");
    key.className = "key";
    key.id = "key-" + char;
    key.textContent = char;
    row.appendChild(key);
  }
  keyboard.appendChild(row);
});

// --- SUBSTITUA suas funções de teclado/cores e o tratamento do Enter por estas ---

// Normaliza acentos para comparar
function normalize(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// prioridade: cinza < amarelo < verde
const PRIORITY = { absent: 0, present: 1, correct: 2 };

// Atualiza o teclado sem "rebaixar" estado (verde > amarelo > cinza)
function updateKeyboard(letter, status) {
  const id = "key-" + normalize(letter).toLowerCase(); // mapeia á->a, ç->c, etc.
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

// Calcula os status (correct/present/absent) considerando contagem de letras
function getStatuses(guess, target) {
  const g = normalize(guess).toLowerCase();
  const t = normalize(target).toLowerCase();
  const len = g.length;

  const status = new Array(len).fill("absent");

  // 1) conta letras do alvo
  const counts = {};
  for (let i = 0; i < len; i++) {
    const ch = t[i];
    counts[ch] = (counts[ch] || 0) + 1;
  }

  // 2) marca verdes e desconta
  for (let i = 0; i < len; i++) {
    if (g[i] === t[i]) {
      status[i] = "correct";
      counts[g[i]] -= 1;
    }
  }

  // 3) marca amarelos se ainda houver a letra disponível
  for (let i = 0; i < len; i++) {
    if (status[i] === "correct") continue;
    const ch = g[i];
    if ((counts[ch] || 0) > 0) {
      status[i] = "present";
      counts[ch] -= 1;
    } else {
      status[i] = "absent";
    }
  }

  return status;
}

// --- TRATAMENTO DO ENTER (substitua o que você tem por este bloco) ---
document.addEventListener("keydown", (e) => {
  const rows = document.getElementsByClassName("row");
  const row = rows[currentRow];
  const tiles = row.getElementsByClassName("tile");

  if (e.key === "Backspace" && currentCol > 0) {
    currentCol--;
    tiles[currentCol].textContent = "";
    return;
  }

  if (e.key === "Enter" && currentCol === wordLength) {
    // monta a tentativa com as letras visíveis (mantém acentos)
    let guess = "";
    for (let i = 0; i < wordLength; i++) {
      guess += tiles[i].textContent.toLowerCase();
    }

    // valida existência na lista (com normalização para aceitar acentos)
    const normalizedGuess = normalize(guess);
    if (!words.some(w => normalize(w) === normalizedGuess)) {
      alert("Palavra não encontrada!");
      return;
    }

    // calcula os status corretos
    const statuses = getStatuses(guess, target);

    // aplica nas tiles e no teclado
    for (let i = 0; i < wordLength; i++) {
      tiles[i].classList.add(statuses[i]);
      updateKeyboard(guess[i], statuses[i]);
    }

    // vitória?
    if (statuses.every(s => s === "correct")) {
      alert("Parabéns, você acertou!");
      return;
    }

    // próxima linha
    currentRow++;
    currentCol = 0;

    if (currentRow === maxRows) {
      alert("Fim de jogo! A palavra era: " + target);
    }
    return;
  }

  // digitação (letras, incluindo acento)
  if (/^[a-zA-ZÀ-ÿ]$/.test(e.key) && currentCol < wordLength) {
    tiles[currentCol].textContent = e.key.toUpperCase();
    currentCol++;
  }
});

