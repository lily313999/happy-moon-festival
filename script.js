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

// -------------------- 遊戲邏輯 --------------------
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.style.cursor = "none";

// 游標圖片元素
const cursorImgEl = document.createElement("img");
cursorImgEl.style.position = "absolute";
cursorImgEl.style.pointerEvents = "none";
cursorImgEl.style.transform = "translate(-50%, -50%)";
document.body.appendChild(cursorImgEl);

// 5 張拼板圖片
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

// -------------------- 初始化 --------------------
function initGame() {
  cursorImgEl.src = pieces[currentIndex];
  cursorImgEl.style.display = "block";
  resizeCanvas();

  // 滑鼠事件
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("click", onClick);

  // 觸控事件
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchstart", onTouchStart, { passive: false });

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
  cursorImgEl.style.left = e.clientX + "px";
  cursorImgEl.style.top = e.clientY + "px";
}

function onTouchMove(e) {
  if (gameFinished) return;
  e.preventDefault(); // 阻止手機頁面拖動
  const touch = e.touches[0];
  cursorImgEl.style.left = touch.clientX + "px";
  cursorImgEl.style.top = touch.clientY + "px";
}

// -------------------- 放置圖片 --------------------
function onClick(e) {
  handlePlace(e.clientX, e.clientY);
}

function onTouchStart(e) {
  e.preventDefault(); // 阻止手機點擊後捲動
  const touch = e.changedTouches[0];
  handlePlace(touch.clientX, touch.clientY);
}

function handlePlace(clientX, clientY) {
  if (gameFinished) return;
  if (currentIndex < pieces.length) {
    const rect = canvas.getBoundingClientRect();

    // 將螢幕座標轉換成 canvas 真實像素座標
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

      cursorImgEl.style.display = "none";

      currentIndex++;
      if (currentIndex < pieces.length) {
        cursorImgEl.src = pieces[currentIndex];
        cursorImgEl.style.display = "block";
      } else {
        gameFinished = true;
        cursorImgEl.style.display = "none";
        drawAllPlaced(true);
        document.getElementById("download-btn").style.display = "inline-block";
        document.getElementById("restart-btn").style.display = "inline-block";
      }
    };
  }
}

// -------------------- 繪製圖片 --------------------
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
document.getElementById("restart-btn").addEventListener("click", () => {
  placedPositions = [];
  currentIndex = 0;
  gameFinished = false;
  cursorImgEl.src = pieces[currentIndex];
  cursorImgEl.style.display = "block";
  document.getElementById("download-btn").style.display = "none";
  document.getElementById("restart-btn").style.display = "none";
  drawAllPlaced();
});

// -------------------- 下載 --------------------
document.getElementById("download-btn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "card.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
