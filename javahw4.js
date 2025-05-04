class Bird {
  constructor(x, y, img) {
    this.x = x;
    this.y = y;
    this.radius = 20;          
    this.dy = 0; // 垂直速度
    this.dx = 0;  // 水平速度
    this.gravity = 0.4; // ag
    this.lift = -8;            
    this.speed = 4; // 水平移動速度
    this.img = img;

    this.frameIndex = 0;       
    this.frameCount = 8;  // 總幀
    this.frameWidth = 34;  // 寬
    this.frameHeight = 34;  // 高  
    this.animationTimer = 0;
  }

  update() {
    this.dy += this.gravity;  
    this.y += this.dy;  // 速度位置
    this.x += this.dx;

    // 邊界
    this.handleBoundaryCollision();

    // 更新動畫
    this.updateAnimation();
  }

 
  handleBoundaryCollision() {
    // 垂直
    if (this.y > canvas.height - this.radius) {
      this.y = canvas.height - this.radius;
      this.dy = -this.dy * 0.7;  // 反彈
    }
    if (this.y < this.radius) {
      this.y = this.radius;
      this.dy = 0;
    }

    // 水平border
    if (this.x < this.radius) this.x = this.radius;
    if (this.x > canvas.width - this.radius) this.x = canvas.width - this.radius;
  }

  
  updateAnimation() {
    this.animationTimer++;
    if (this.animationTimer % 5 === 0) {
      this.frameIndex = (this.frameIndex + 1) % this.frameCount;
    }
  }

  flap() {
    this.dy = this.lift;
  }

  
  draw(ctx) {
    ctx.drawImage(
      this.img,
      this.frameIndex * this.frameWidth, 0,
      this.frameWidth, this.frameHeight,
      this.x - this.radius, this.y - this.radius,
      this.radius * 2, this.radius * 2
    );
  }
}


class Pipe {

  constructor(x, topImg, bottomImg) {
    this.x = x;
    this.width = 60;
    this.gap = 200;           
    this.topHeight = Math.floor(Math.random() * 200) + 50; 
    this.speed = 1.5;         
    this.topImg = topImg;
    this.bottomImg = bottomImg;
    this.passed = false;      
  }

  update() {
    this.x -= this.speed;
  }
  
  draw(ctx) {
    ctx.fillStyle = "green";
    ctx.fillRect(this.x, 0, this.width, this.topHeight);
    ctx.fillRect(
      this.x, 
      this.topHeight + this.gap, 
      this.width, 
      canvas.height - (this.topHeight + this.gap)
    );
    
    /* 圖片
    ctx.drawImage(this.topImg, this.x, this.topHeight - this.topImg.height);
    ctx.drawImage(this.bottomImg, this.x, this.topHeight + this.gap);
    */
  }

  checkCollision(bird) {
    return (
      bird.x + bird.radius > this.x &&
      bird.x - bird.radius < this.x + this.width &&
      (bird.y - bird.radius < this.topHeight || 
       bird.y + bird.radius > this.topHeight + this.gap)
    );
  }
}


class Cloud {
  
  constructor(x, y, img) {
    this.x = x;
    this.y = y;
    this.img = img;
    this.speed = 0.5;  
  }
  
  update() {
    this.x -= this.speed;
    // 雲朵++
    if (this.x + this.img.width < 0) {
      this.x = canvas.width + Math.random() * 100;
    }
  }

  
  draw(ctx) {
    ctx.drawImage(this.img, this.x, this.y);
  }
}

class Hill {
  
  constructor(img) {
    this.x = 0;
    this.img = img;
    this.speed = 0.2;
  }

  
  update() {
    this.x -= this.speed;
    //無縫
    if (this.x <= -this.img.width) {
      this.x += this.img.width;
    }
  }
  
   
  draw(ctx) {
    const y = canvas.height - this.img.height;
    
    //hill cover
    let currentX = this.x;
    while (currentX < canvas.width + this.img.width) {
      ctx.drawImage(this.img, Math.floor(currentX), y);
      currentX += this.img.width;
    }
  }
}

//initialize =======

// Canvas+上下文
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameOverScreen = document.getElementById("gameOverScreen");

const birdImg = new Image();
const pipeTopImg = new Image();
const pipeBottomImg = new Image();
const cloudImg = new Image();
const hillImg = new Image();

//img
birdImg.src = "flappy30.png";
pipeTopImg.src = "pipe_top.png";
pipeBottomImg.src = "pipe_bottom.png";
cloudImg.src = "cloud.png";
hillImg.src = "hill.png";

//音效
const flapSound = new Audio("flap.wav");
const deathSound = new Audio("death.wav");

//物件
const bird = new Bird(100, 100, birdImg);
const pipes = [];
const clouds = [
  new Cloud(300, 80, cloudImg),
  new Cloud(100, 50, cloudImg)
];
const hill = new Hill(hillImg);

//variable
let score = 0;
let pipeTimer = 0;
let isGameOver = false;

//功能 ==========


function spawnPipe() {
  pipes.push(new Pipe(canvas.width, pipeTopImg, pipeBottomImg));
}

function endGame() {
  isGameOver = true;
  deathSound.play();
  gameOverScreen.style.display = "block";
}

function restartGame() {
  document.location.reload();
}


function animate() {
  if (isGameOver) return;

  //清除
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 更新背景
  hill.update();
  hill.draw(ctx);

  clouds.forEach(cloud => {
    cloud.update();
    cloud.draw(ctx);
  });

  // 更新bird
  bird.update();
  bird.draw(ctx);

  //管道++
  pipeTimer++;
  if (pipeTimer % 180 === 0) spawnPipe();

  //更新管道
  for (let i = pipes.length - 1; i >= 0; i--) {
    const pipe = pipes[i];
    pipe.update();
    pipe.draw(ctx);

    // 移除管道+加分
    if (pipe.x + pipe.width < 0) {
      pipes.splice(i, 1);
      score++;
    }

    //check fail
    if (pipe.checkCollision(bird)) {
      endGame();
    }
  }

  //score
  ctx.fillStyle = "black";
  ctx.font = "24px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);

  //動畫
  requestAnimationFrame(animate);
}

//load圖片 ==========
let imagesLoaded = 0;
const totalImages = 5;

function checkAllImagesLoaded() {
  imagesLoaded++;
  if (imagesLoaded === totalImages) {
    console.log("All images loaded successfully!");
    animate();
  }
}
birdImg.onload = checkAllImagesLoaded;
pipeTopImg.onload = checkAllImagesLoaded;
pipeBottomImg.onload = checkAllImagesLoaded;
cloudImg.onload = checkAllImagesLoaded;
hillImg.onload = checkAllImagesLoaded;

//  key =======
document.addEventListener("keydown", (e) => {
  // space jump
  if (e.code === "Space" && !isGameOver) {
    bird.flap();
    try {
      flapSound.currentTime = 0;
      flapSound.play();
    } catch (e) {
      console.warn("Failed to play flap sound:", e);
    }
  }
  
  // 水平
  if (e.code === "ArrowLeft") {
    bird.dx = -bird.speed;
  }
  if (e.code === "ArrowRight") {
    bird.dx = bird.speed;
  }
});

// 停止
document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
    bird.dx = 0;
  }
});