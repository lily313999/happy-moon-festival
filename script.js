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

// -------------------- 隱藏第六關點擊計數 --------------------
let hiddenClickCount = 0;
const choice6El = document.getElementById("choice6");

// -------------------- 第五關要浮到最上層的拼圖清單 --------------------
const topLayerPieces = [
  "img/piece1-3.png", "img/piece1-4.png", "img/piece1-5.png",
  "img/piece2-3.png", "img/piece2-4.png", "img/piece2-5.png",
  "img/piece3-2.png", "img/piece3-3.png", "img/piece3-4.png",
  "img/piece4-5.png", "img/piece4-6.png", "img/piece4-7.png"
];

// -------------------- 初始畫面選擇 --------------------
document.querySelectorAll('.image-selection img').forEach(img => {
  img.addEventListener('click', () => {
    const choice = img.dataset.choice;

    if (choice === "1") {
      hiddenClickCount++;
      if (hiddenClickCount >= 10) {
        // 🚩 顯示第六關選項
        choice6El.style.display = "inline-block";
      }
    } else {
      hiddenClickCount = 0; // 點到其他選項就歸零
    }

    selectedChoice = choice;

    document.querySelectorAll('.image-selection img').forEach(i => i.classList.remove('active'));
    img.classList.add('active');
    startBtn.disabled = false;
  });
});

startBtn.addEventListener('click', () => {
  if (!selectedChoice) return;

  pieces = [];

  if (selectedChoice === "5") {
    // 🚩 第五關：包含前四關全部拼圖
    for (let c = 1; c <= 4; c++) {
      const count = pieceCounts[c];
      for (let i = 1; i <= count; i++) {
        pieces.push(`img/piece${c}-${i}.png`);
      }
    }
  } else if (selectedChoice === "6") {
    // 🚩 第六關：固定背景4 + 五片拼圖
    for (let i = 1; i <= 5; i++) {
      pieces.push(`img/piece6-${i}.png`);
    }
  } else {
    const count = pieceCounts[selectedChoice];
    for (let i = 1; i <= count; i++) {
      pieces.push(`img/piece${selectedChoice}-${i}.png`);
    }
  }

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
    bg.src = "img/background5.jpg"; // 第五關固定背景
  } else if (selectedChoice === "6") {
    bg = new Image();
    bg.src = "img/background4.jpg"; // 第六關固定背景
  } else {
    const randomIndex = Math.floor(Math.random() * backgrounds.length);
    bg = new Image();
    bg.src = backgrounds[randomIndex];
  }

  bg.onload = () => {
    resizeCanvas();
    drawAllPlaced();

    requestAnimationFrame(() => {
      cursorImgEl.src = pieces[currentIndex];
      cursorImgEl.style.display = "block";

      if (selectedChoice === "5" && isMobile) {
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

      const rect = canvas.getBoundingClientRect();
      cursorPos.x = rect.left + rect.width / 2;
      cursorPos.y = rect.top + rect.height / 2;
      cursorImgEl.style.left = cursorPos.x + "px";
      cursorImgEl.style.top = cursorPos.y + "px";
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

      // 🚩 只有第 5 關在手機上縮小
      if (selectedChoice === "5" && isMobile) {
        w = w * 2 / 3;
        h = h * 2 / 3;
      }

      const halfW = w / 2;
      const halfH = h / 2;

      // ❌ 移除了電腦版自動校正，保留原始位置
      // 超出 canvas 的部分會自動被裁掉

      placedPositions.push({
        img: img,
        src: pieces[currentIndex],
        x: x - halfW,
        y: y - halfH,
        w: w,
        h: h
      });

      currentIndex++;

      if (selectedChoice === "5") {
        remainingCountEl.textContent = pieces.length - currentIndex;
      }

      if (currentIndex < pieces.length) {
        cursorImgEl.src = pieces[currentIndex];
        cursorImgEl.style.display = "block";

        if (selectedChoice === "5" && isMobile) {
          const tempImg2 = new Image();
          tempImg2.src = pieces[currentIndex];
          tempImg2.onload = () => {
            cursorImgEl.style.width = tempImg2.width * 2 / 3 + "px";
            cursorImgEl.style.height = tempImg2.height * 2 / 3 + "px";
          };
        } else {
          cursorImgEl.style.width = "auto";
          cursorImgEl.style.height = "auto";
        }

        const rect2 = canvas.getBoundingClientRect();
        cursorPos.x = rect2.left + rect2.width / 2;
        cursorPos.y = rect2.top + rect2.height / 2;
        cursorImgEl.style.left = cursorPos.x + "px";
        cursorImgEl.style.top = cursorPos.y + "px";
      } else {
        gameFinished = true;
        cursorImgEl.style.display = "none";
        confirmBtn.style.display = "none";
        pieceCounterEl.style.display = "none";

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

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
  cursorImgEl.src = pieces[currentIndex];
  cursorImgEl.style.display = "block";

  const rect = canvas.getBoundingClientRect();
  cursorPos.x = rect.left + rect.width / 2;
  cursorPos.y = rect.top + rect.height / 2;
  cursorImgEl.style.left = cursorPos.x + "px";
  cursorImgEl.style.top = cursorPos.y + "px";

  if (isMobile) {
    confirmBtn.style.display = "inline-block";
  } else {
    confirmBtn.style.display = "none";
  }

  if (selectedChoice === "5") {
    pieceCounterEl.style.display = "block";
    remainingCountEl.textContent = pieces.length;
  }

  saveHint.style.display = "none";
  initGame();
});

// -------------------- 回到選圖畫面 --------------------
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
});
