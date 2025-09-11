// -------------------- 初始畫面 --------------------
const choiceImg = document.getElementById('selectedImage');
const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');

let chosen = false;

choiceImg.addEventListener('click', () => {
  chosen = true;
  choiceImg.classList.add('active');
  startBtn.disabled = false;
});

startBtn.addEventListener('click', () => {
  if (!chosen) return;
  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  initGame();
});

// -------------------- 裝置判斷 --------------------
const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// -------------------- 遊戲邏輯 --------------------
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.style.cursor = "none";

// 游標圖片
const cursorImgEl = document.createElement("img");
cursorImgEl.style.position = "absolute";
cursorImgEl.style.pointerEvents = "none";
cursorImgEl.style.transform = "translate(-50%, -50%)";
document.body.appendChild(cursorImgEl);

// 控制按鈕
const confirmBtn = document.getElementById("confirm-btn");
const downloadBtn = document.getElementById("download-btn");
const restartBtn = document.getElementById("restart-btn");

// 拼板圖片
const pieces = [
  "img/piece1.png",
  "img/piece2.png",
  "img/piece3.png",
  "img/piece4.png",
  "img/piece5.png",
];

// 背景
let bg = new Image();
bg.src = "img/background.jpg";

let currentIndex = 0;
let placedPositions = []; // {src, x, y}
let gameFinished = false;
let cursorPos = { x: 0, y: 0 }; // 記錄游標位置

// -------------------- 初始化 --------------------
function initGame() {
  cursorImgEl.src = pieces[currentIndex];
  cursorImgEl.style.display = "block";
  resizeCanvas();

  if (isMobile) {
    // 手機模式：顯示按鈕
    confirmBtn.style.display = "inline-block";
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  } else {
    // 電腦模式：隱藏按鈕
    confirmBtn.style.display = "none";
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);
  }

  window.addEventListener("resize", resizeCanvas);
  drawAllPlaced();
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

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const img = new Image();
    img.src = pieces[currentIndex];
    img.onload = () => {
      placedPositions.push({
        src: pieces[currentIndex],
        x: x - img.width / 2,
        y: y - img.height / 2
      });

      currentIndex++;
      if (currentIndex < pieces.length) {
        cursorImgEl.src = pieces[currentIndex];
        cursorImgEl.style.display = "block";
      } else {
        gameFinished = true;
        cursorImgEl.style.display = "none";
        confirmBtn.style.display = "none";
        drawAllPlaced(true);
        downloadBtn.style.display = "inline-block";
        restartBtn.style.display = "inline-block";
      }
    };
  }
}

// -------------------- 繪製 --------------------
function drawAllPlaced(finished = false) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  if (finished) {
    placedPositions.forEach(p => {
      const img = new Image();
      img.src = p.src;
      img.onload = () => {
        ctx.drawImage(img, p.x, p.y);
      };
    });
  }
}

// -------------------- 再玩一次 --------------------
restartBtn.addEventListener("click", () => {
  placedPositions = [];
  currentIndex = 0;
  gameFinished = false;
  cursorImgEl.src = pieces[currentIndex];
  cursorImgEl.style.display = "block";

  if (isMobile) {
    confirmBtn.style.display = "inline-block";
  } else {
    confirmBtn.style.display = "none";
  }

  downloadBtn.style.display = "none";
  restartBtn.style.display = "none";
  drawAllPlaced();
});

// -------------------- 下載 --------------------
downloadBtn.addEventListener("click", () => {
  const dataUrl = canvas.toDataURL("image/png");

  if (isMobile) {
    // 手機：直接開啟圖片，並提示使用者長按存到相簿
    alert("📌 提示：長按圖片即可存到相簿");
    window.open(dataUrl, "_blank");
  } else {
    // 電腦：用 a[download] 下載
    const link = document.createElement("a");
    link.download = "card.png";
    link.href = dataUrl;
    link.click();
  }
});
