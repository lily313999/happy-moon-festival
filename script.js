// -------------------- 初始畫面 --------------------
const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');

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
const downloadBtn = document.getElementById("download-btn"); // 仍保留，但不顯示
const restartBtn = document.getElementById("restart-btn");
const backBtn = document.getElementById("back-btn");

// 📌 生成完成圖像的 <img>
let resultImg = null;

// 🚫 一律隱藏下載按鈕
downloadBtn.style.display = "none";

// -------------------- 拼圖數量設定 --------------------
const pieceCounts = {
  1: 5,
  2: 7,
  3: 6,
  4: 9
};

let pieces = [];
let selectedChoice = null;

// -------------------- 背景 --------------------
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

// -------------------- 初始畫面選擇 --------------------
document.querySelectorAll('.image-selection img').forEach(img => {
  img.addEventListener('click', () => {
    document.querySelectorAll('.image-selection img').forEach(i => i.classList.remove('active'));
    img.classList.add('active');
    selectedChoice = img.dataset.choice;
    startBtn.disabled = false;
  });
});

startBtn.addEventListener('click', () => {
  if (!selectedChoice) return;

  const count = pieceCounts[selectedChoice];
  pieces = [];
  for (let i = 1; i <= count; i++) {
    pieces.push(`img/piece${selectedChoice}-${i}.png`);
  }

  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  initGame();
});

// -------------------- 初始化遊戲 --------------------
function initGame() {
  const randomIndex = Math.floor(Math.random() * backgrounds.length);
  bg = new Image();
  bg.src = backgrounds[randomIndex];

  bg.onload = () => {
    cursorImgEl.src = pieces[currentIndex];
    cursorImgEl.style.display = "block";

    resizeCanvas();
    drawAllPlaced();

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

    // 確保 canvas 可見
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
      const halfW = img.width / 2;
      const halfH = img.height / 2;

      if (x < halfW) x = halfW;
      if (x > canvas.width - halfW) x = canvas.width - halfW;
      if (y < halfH) y = halfH;
      if (y > canvas.height - halfH) y = canvas.height - halfH;

      placedPositions.push({
        src: pieces[currentIndex],
        x: x - halfW,
        y: y - halfH,
        w: img.width,
        h: img.height
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

        // 🎯 拼圖完成 → 轉成圖片，替代 canvas
        const dataUrl = canvas.toDataURL("image/png");
        resultImg = document.createElement("img");
        resultImg.src = dataUrl;
        resultImg.style.width = "100%";
        resultImg.style.maxWidth = "600px";
        resultImg.style.border = "1px solid #ccc";
        resultImg.style.display = "block";
        resultImg.style.margin = "10px auto";

        canvas.style.display = "none";
        canvas.parentNode.insertBefore(resultImg, canvas.nextSibling);

        if (isMobile) {
          alert("📌 提示：長按圖片即可存到相簿");
        }
      }
    };
  }
}

// -------------------- 繪製 --------------------
function drawAllPlaced(finished = false) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  placedPositions.forEach(p => {
    const img = new Image();
    img.src = p.src;
    img.onload = () => {
      ctx.drawImage(img, p.x, p.y, p.w, p.h);
    };
  });
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

  if (resultImg) {
    resultImg.remove();
    resultImg = null;
  }
});
