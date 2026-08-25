// game.js - canvas setup + main loop
var canvas, ctx, camera, hero, lastTime, wallRideShakeTimer;
var GAME_WIDTH = 800;
var GAME_HEIGHT = 480;

function startGame() {
  canvas = document.getElementById("c");
  ctx = canvas.getContext("2d");

  resize();
  window.addEventListener("resize", resize);

  genAudio();

  window.addEventListener("keydown", startMusic);
  window.addEventListener("pointerdown", startMusic);
  Sound.init();
  Keys.init();
  // Debug.init();
  Level.init();

  hero = new Hero(64, 64);
  camera = new Camera(canvas.width, canvas.height);
  wallRideShakeTimer = 0;

  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function resize() {
  // Keep a fixed 5:3 game surface. CSS scales it to the largest size that
  // fits the browser, leaving letterbox space instead of stretching it.
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  ctx.imageSmoothingEnabled = false;
  if (camera) {
    camera.resize(canvas.width, canvas.height);
  }
}

function loop(now) {
  var dt = Math.min((now - lastTime) / 1000, 1 / 30); // clamp to avoid huge steps on tab-switch
  lastTime = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

function update(dt) {
  if (Level.failed || Level.complete) {
    Level.update(hero, dt);
    Particles.update(dt);
    camera.updateShake(dt);
    return;
  }

  var wasGrounded = hero.onGround;
  var wasTouchingWall = hero.touchingWallLeft || hero.touchingWallRight;
  var previousVx = hero.vx;
  var previousVy = hero.vy;
  var previousJumpSerial = hero.jumpSerial;

  Level.updateMovingPlatforms(hero, dt);
  hero.update(dt);
  Level.update(hero, dt);
  Particles.update(dt);
  camera.follow(hero, dt);

  if (hero.jumpSerial !== previousJumpSerial) {
    camera.shake(2.5, 0.1);
  }
  if (!wasGrounded && hero.onGround) {
    camera.shake(clamp(previousVy / 80, 3, 8), 0.18);
  }

  var wallRiding =
    !hero.onGround && (hero.touchingWallLeft || hero.touchingWallRight);
  if (wallRiding && !wasTouchingWall) {
    camera.shake(clamp(Math.abs(previousVx) / 140, 1.2, 2.2), 0.11);
    wallRideShakeTimer = 0.09;
  } else if (wallRiding && hero.vy > 0) {
    wallRideShakeTimer -= dt;
    if (wallRideShakeTimer <= 0) {
      camera.shake(0.55, 0.045);
      wallRideShakeTimer = 0.1;
    }
  } else {
    wallRideShakeTimer = 0;
  }

  camera.updateShake(dt);
}

function draw() {
  ctx.fillStyle = "#7ec0ee";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Two distant ridgelines drift at different speeds for cheap parallax depth.
  for (var layer = 0; layer < 2; layer++) {
    ctx.fillStyle = layer ? "#72a8ca" : "#a7cee4";
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (var x = -200; x < 1100; x += 100) {
      ctx.lineTo(
        x - ((camera.x * (layer + 1)) / 12) % 200,
        320 + layer * 70 - (x % 200 ? 45 : 0) - (camera.y * (layer + 1)) / 24
      );
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(Math.round(camera.shakeX), Math.round(camera.shakeY));
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.viewWidth / 2, -camera.viewHeight / 2);
  Level.draw(ctx, camera);
  hero.drawShadow(ctx, camera);
  Particles.draw(ctx, camera);
  hero.draw(ctx, camera);
  ctx.restore();

  Level.drawHud(ctx, canvas);
  // Debug.draw(ctx, hero);
}
