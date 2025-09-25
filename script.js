// -------------------- 初始畫面 --------------------
const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const saveHint = document.getElementById('save-hint');
const pieceCounterEl = document.getElementById("piece-counter");
const remainingCountEl = document.getElementById("remaining-count");

// -------------------- 裝置判斷 --------------------
const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// -------------------- 控制按鈕 --------------------
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.style.cursor = "none";

const cursorImgEl = document.createElement("img");
cursorImgEl.style.position = "absolute";
cursorImgEl.style.pointerEvents = "none";
cursorImgEl.style.transform = "translate(-50%, -50%)";
document.body.appendChild(cursorImgEl);

const confirmBtn = document.getElementById("confirm-btn");
const downloadBtn = document.getElementById("download-btn");
const restartBtn = document.getElementById("restart-btn");
const backBtn = document.getElementById("back-btn");

let resultImg = null;
downloadBtn.style.display = "none";

// -------------------- 拼圖數量設定 --------------------
const pieceCounts = {
  1: 5,
  2: 7,
  3: 6,
  4: 9,
  5: 35
};

let pieces = [];
let selectedChoice = null;

const backgrounds = [
  "img/background1.jpg",
  "img/background2.jpg",
  "img/background3.jpg"
];
let bg = new Image();

let currentIndex = 0;
let placedPositions = [];
let gameFinished = false;
let cursorPos = { x: 0, y: 0 };

// -------------------- 隱藏關計數 --------------------
let hiddenClickCount = 0;     // 第六關計數
const choice6El = document.getElementById("choice6");

let unlockSequence = [5,5,5,5,5,4,4,4,4,3,3,3,2,2,1]; // 第七關解鎖序列
let currentUnlockIndex = 0;
const choice7El = document.getElementById("choice7");

// -------------------- 第五關浮到最上層的拼圖 --------------------
const topLayerPieces = [
  "img/piece1-3.png", "img/piece1-4.png", "img/piece1-5.png",
  "img/piece2-3.png", "img/piece2-4.png", "img/piece2-5.png",
  "img/piece3-2.png", "img/piece3-3.png", "img/piece3-4.png",
  "img/piece4-5.png", "img/piece4-6.png", "img/piece4-7.png"
];

// -------------------- 產生拼片組合 --------------------
function generatePieces(choice) {
  let result = [];
  if (choice === 5) {
    for (let c = 1; c <= 4; c++) {
      const count = pieceCounts[c];
      for (let i = 1; i <= count; i++) {
        result.push(`img/piece${c}-${i}.png`);
      }
    }
  } else if (choice === 6) {
    for (let i = 1; i <= 5; i++) {
      result.push(`img/piece6-${i}.png`);
    }
  } else if (choice === 7) {
    // 🔑 第七關隨機組合
    result.push("img/piece7-1.png"); // 必出
    const rand23 = Math.random() < 0.5 ? 2 : 3;
    result.push(`img/piece7-${rand23}.png`);
    const rand456 = 4 + Math.floor(Math.random() * 3);
    result.push(`img/piece7-${rand456}.png`);
  } else {
    const count = pieceCounts[choice];
    for (let i = 1; i <= count; i++) {
      result.push(`img/piece${choice}-${i}.png`);
    }
  }
  return result;
}

// -------------------- 初始畫面選擇 --------------------
document.querySelectorAll('.image-selection img').forEach(img => {
  img.addEventListener('click', () => {
    const choice = parseInt(img.dataset.choice);

    // 第六關解鎖
    if (choice === 1) {
      hiddenClickCount++;
      if (hiddenClickCount >= 10) {
        choice6El.style.display = "inline-block";
      }
    } else {
      hiddenClickCount = 0;
    }

    // 第七關解鎖
    if (choice === unlockSequence[currentUnlockIndex]) {
      currentUnlockIndex++;
      if (currentUnlockIndex >= unlockSequence.length) {
        choice7El.style.display = "inline-block";
      }
    } else {
      currentUnlockIndex = 0;
    }

    selectedChoice = choice.toString();
    document.querySelectorAll('.image-selection img').forEach(i => i.classList.remove('active'));
    img.classList.add('active');
    startBtn.disabled = false;
  });
});

startBtn.addEventListener('click', () => {
  if (!selectedChoice) return;
  pieces = generatePieces(parseInt(selectedChoice));

  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  saveHint.style.display = "none";

  if (selectedChoice === "5") {
    pieceCounterEl.style.display = "block";
    remainingCountEl.textContent = pieces.length;
  } else {
    pieceCounterEl.style.display = "none";
  }

  initGame();
});

// -------------------- 初始化遊戲 --------------------
function initGame() {
  if (selectedChoice === "5") {
    bg = new Image();
    bg.src = "img/background5.jpg";
  } else if (selectedChoice === "6") {
    bg = new Image();
    bg.src = "img/background4.jpg";
  } else if (selectedChoice === "7") {
    bg = new Image();
    bg.src = "img/background7.jpg";
  } else {
    const randomIndex = Math.floor(Math.random() * backgrounds.length);
    bg = new Image();
    bg.src = backgrounds[randomIndex];
  }

  bg.onload = () => {
    resizeCanvas();
    drawAllPlaced();

    requestAnimationFrame(() => {
      if (pieces.length > 0) cursorImgEl.src = pieces[currentIndex];
      cursorImgEl.style.display = "block";

      if (selectedChoice === "5" && isMobile && pieces.length > 0) {
        const tempImg = new Image();
        tempImg.src = pieces[currentIndex];
        tempImg.onload = () => {
          cursorImgEl.style.width = tempImg.width * 2 / 3 + "px";
          cursorImgEl.style.height = tempImg.height * 2 / 3 + "px";
        };
      } else {
        cursorImgEl.style.width = "auto";
        cursorImgEl.style.height = "auto";
      }
    });

    if (isMobile) {
      confirmBtn.style.display = "inline-block";
      canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    } else {
      confirmBtn.style.display = "none";
      canvas.addEventListener("mousemove", onMouseMove);
      canvas.addEventListener("click", onClick);
    }

    restartBtn.style.display = "inline-block";
    backBtn.style.display = "inline-block";

    canvas.style.display = "block";
    if (resultImg) {
      resultImg.remove();
      resultImg = null;
    }

    window.addEventListener("resize", resizeCanvas);
  };
}

// -------------------- 調整 canvas --------------------
function resizeCanvas() {
  const maxWidth = Math.min(window.innerWidth, 600);
  const ratio = bg.width / bg.height || 1;
  canvas.width = maxWidth;
  canvas.height = maxWidth / ratio;
  drawAllPlaced();
}

// -------------------- 游標跟隨 --------------------
function onMouseMove(e) {
  if (gameFinished) return;
  cursorPos.x = e.clientX;
  cursorPos.y = e.clientY;
  cursorImgEl.style.left = cursorPos.x + "px";
  cursorImgEl.style.top = cursorPos.y + "px";
}

function onTouchMove(e) {
  if (gameFinished) return;
  e.preventDefault();
  const touch = e.touches[0];
  cursorPos.x = touch.clientX;
  cursorPos.y = touch.clientY;
  cursorImgEl.style.left = cursorPos.x + "px";
  cursorImgEl.style.top = cursorPos.y + "px";
}

// -------------------- 電腦模式：點擊放置 --------------------
function onClick(e) {
  handlePlace(e.clientX, e.clientY);
}

// -------------------- 手機模式：按下按鈕放置 --------------------
confirmBtn.addEventListener("click", () => {
  handlePlace(cursorPos.x, cursorPos.y);
});

// -------------------- 放置邏輯 --------------------
function handlePlace(clientX, clientY) {
  if (gameFinished) return;
  if (currentIndex < pieces.length) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x = (clientX - rect.left) * scaleX;
    let y = (clientY - rect.top) * scaleY;

    const img = new Image();
    img.src = pieces[currentIndex];
    img.onload = () => {
      let w = img.width;
      let h = img.height;

      if (selectedChoice === "5" && isMobile) {
        w = w * 2 / 3;
        h = h * 2 / 3;
      }

      placedPositions.push({
        img: img,
        src: pieces[currentIndex],
        x: x - w / 2,
        y: y - h / 2,
        w: w,
        h: h
      });

      currentIndex++;

      if (selectedChoice === "5") {
        remainingCountEl.textContent = pieces.length - currentIndex;
      }

      if (currentIndex < pieces.length) {
        cursorImgEl.src = pieces[currentIndex];
      } else {
        // -------------------- 完成拼圖 --------------------
        gameFinished = true;
        cursorImgEl.style.display = "none";
        confirmBtn.style.display = "none";
        pieceCounterEl.style.display = "none";

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        const finalizeExport = () => {
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            resultImg = document.createElement("img");
            resultImg.src = url;
            resultImg.style.width = "100%";
            resultImg.style.maxWidth = "600px";
            resultImg.style.border = "1px solid #ccc";
            resultImg.style.display = "block";
            resultImg.style.margin = "10px auto";
            canvas.style.display = "none";
            canvas.parentNode.insertBefore(resultImg, canvas.nextSibling);

            setTimeout(() => {
              if (isMobile) {
                saveHint.style.display = "block";
              } else {
                alert("📌 提示：右鍵圖片即可另存");
              }
            }, 200);
          }, "image/png");
        };

        if (selectedChoice === "7") {
          // 1) 隨機 piece7-7~10 最底層
          const rand710 = 7 + Math.floor(Math.random() * 4);
          const randImg = new Image();
          randImg.src = `img/piece7-${rand710}.png`;
          randImg.onload = () => {
            const maxX = canvas.width - randImg.width;
            const maxY = canvas.height - randImg.height;
            const rx = Math.random() * maxX;
            const ry = Math.random() * maxY;
            ctx.drawImage(randImg, rx, ry, randImg.width, randImg.height);

            // 2) 畫非 piece7-1 的拼片
            placedPositions.forEach(p => {
              if (!p.src.includes("piece7-1.png")) {
                ctx.drawImage(p.img, p.x, p.y, p.w, p.h);
              }
            });

            // 3) piece7-1 在最上層
            placedPositions.forEach(p => {
              if (p.src.includes("piece7-1.png")) {
                ctx.drawImage(p.img, p.x, p.y, p.w, p.h);
              }
            });

            // 4) 覆蓋率檢查
            let totalArea = placedPositions.reduce((a, p) => a + p.w * p.h, 0);
            const bgArea = canvas.width * canvas.height;
            if (totalArea < bgArea / 4) {
              const p7 = new Image();
              p7.src = "img/piece7-1.png";
              p7.onload = () => {
                const cx = (canvas.width - p7.width) / 2;
                const cy = (canvas.height - p7.height) / 2;
                ctx.drawImage(p7, cx, cy, p7.width, p7.height);
                finalizeExport();
              };
            } else {
              finalizeExport();
            }
          };
        } else {
          // 其他關卡
          placedPositions.forEach(p => {
            if (!(selectedChoice === "5" && topLayerPieces.includes(p.src))) {
              ctx.drawImage(p.img, p.x, p.y, p.w, p.h);
            }
          });
          if (selectedChoice === "5") {
            placedPositions.forEach(p => {
              if (topLayerPieces.includes(p.src)) {
                ctx.drawImage(p.img, p.x, p.y, p.w, p.h);
              }
            });
          }
          finalizeExport();
        }
      }
    };
  }
}

// -------------------- 繪製 --------------------
function drawAllPlaced() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  placedPositions.forEach(p => {
    ctx.drawImage(p.img, p.x, p.y, p.w, p.h);
  });
}

// -------------------- 再玩一次 --------------------
restartBtn.addEventListener("click", () => {
  placedPositions = [];
  currentIndex = 0;
  gameFinished = false;
  pieces = generatePieces(parseInt(selectedChoice));
  if (pieces.length > 0) cursorImgEl.src = pieces[currentIndex];
  cursorImgEl.style.display = "block";

  if (isMobile) confirmBtn.style.display = "inline-block";
  else confirmBtn.style.display = "none";

  if (selectedChoice === "5") {
    pieceCounterEl.style.display = "block";
    remainingCountEl.textContent = pieces.length;
  }

  saveHint.style.display = "none";
  initGame();
});

// -------------------- 回到選圖 --------------------
backBtn.addEventListener("click", () => {
  placedPositions = [];
  currentIndex = 0;
  gameFinished = false;
  pieces = [];
  selectedChoice = null;

  gameScreen.style.display = "none";
  startScreen.style.display = "block";

  document.querySelectorAll('.image-selection img').forEach(i => i.classList.remove('active'));
  startBtn.disabled = true;

  confirmBtn.style.display = "none";
  restartBtn.style.display = "none";
  backBtn.style.display = "none";
  cursorImgEl.style.display = "none";
  saveHint.style.display = "none";
  pieceCounterEl.style.display = "none";

  if (resultImg) {
    resultImg.remove();
    resultImg = null;
  }

  choice6El.style.display = "none";
  hiddenClickCount = 0;
  choice7El.style.display = "none";
  currentUnlockIndex = 0;
});
