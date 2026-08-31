// game.js - canvas setup + main loop
var canvas, ctx, camera, hero, lastTime, wallRideShakeTimer;
var titleScreen = true;
var titleTime = 0;
var titleBurstTimer = 0.25;
var titleCamera = { x: 0, y: 0 };
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
  window.addEventListener("pointerdown", startFromTitle);
  Sound.init();
  Keys.init();
  // Debug.init();
  Level.init();

  hero = new Hero(64, 64);
  camera = new Camera(GAME_WIDTH, GAME_HEIGHT);
  wallRideShakeTimer = 0;

  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function startFromTitle() {
  if (!titleScreen || Level.gameComplete) return;
  titleScreen = false;
  Particles.items.length = 0;
  document.body.classList.remove("title-screen");
}

function resize() {
  // Keep the game's 800 x 480 coordinate system, but rasterize at the actual
  // display size. Letting CSS shrink an 800px bitmap makes one-pixel details
  // such as locked-tile outlines snap to oversized display pixels.
  var bounds = canvas.getBoundingClientRect();
  var pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
  canvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));
  ctx.setTransform(
    canvas.width / GAME_WIDTH,
    0,
    0,
    canvas.height / GAME_HEIGHT,
    0,
    0
  );
  ctx.imageSmoothingEnabled = false;
  if (camera) {
    camera.resize(GAME_WIDTH, GAME_HEIGHT);
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
  if (titleScreen) {
    titleTime += dt;
    titleBurstTimer -= dt;
    if (titleBurstTimer <= 0) {
      Particles.titleBurst(
        90 + Math.random() * (GAME_WIDTH - 180),
        70 + Math.random() * (GAME_HEIGHT - 170)
      );
      titleBurstTimer = Level.gameComplete ? 0.6 : 1.8 + Math.random() * 1.8;
    }
    Particles.update(dt);
    return;
  }

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
  if (titleScreen) {
    drawTitleScreen();
    return;
  }

  ctx.fillStyle = "#7ec0ee";
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Two distant ridgelines drift at different speeds for cheap parallax depth.
  for (var layer = 0; layer < 2; layer++) {
    ctx.fillStyle = layer ? "#72a8ca" : "#a7cee4";
    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT);
    for (var x = -200; x < 1100; x += 100) {
      ctx.lineTo(
        x - ((camera.x * (layer + 1)) / 12) % 200,
        320 + layer * 70 - (x % 200 ? 45 : 0) - (camera.y * (layer + 1)) / 24
      );
    }
    ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(Math.round(camera.shakeX), Math.round(camera.shakeY));
  ctx.translate(GAME_WIDTH / 2, GAME_HEIGHT / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.viewWidth / 2, -camera.viewHeight / 2);
  Level.draw(ctx, camera);
  hero.drawShadow(ctx, camera);
  Particles.draw(ctx, camera);
  hero.draw(ctx, camera);
  ctx.restore();

  Level.drawHud(ctx, GAME_WIDTH, GAME_HEIGHT);
  // Debug.draw(ctx, hero);
}

function drawTitleScreen() {
  var gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, "#18264a");
  gradient.addColorStop(1, "#39204f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  Particles.draw(ctx, titleCamera);

  ctx.fillStyle = "rgba(10, 14, 30, 0.78)";
  ctx.fillRect(70, 80, 660, 320);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
  ctx.lineWidth = 2;
  ctx.strokeRect(70, 80, 660, 320);

  var title = "UniCorn";
  ctx.font = "900 82px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  var titleWidth = ctx.measureText(title).width;
  var titleX = (GAME_WIDTH - titleWidth) / 2;
  for (var i = 0; i < title.length; i++) {
    var letter = title[i];
    ctx.strokeStyle = "#0c1020";
    ctx.lineWidth = 7;
    ctx.strokeText(letter, titleX, 164);
    ctx.fillStyle = Particles.rainbow[i];
    ctx.fillText(letter, titleX, 164);
    titleX += ctx.measureText(letter).width;
  }

  var bandWidth = 420 / Particles.rainbow.length;
  for (var band = 0; band < Particles.rainbow.length; band++) {
    ctx.fillStyle = Particles.rainbow[band];
    ctx.fillRect(190 + band * bandWidth, 218, Math.ceil(bandWidth), 5);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = "700 24px system-ui, sans-serif";
  ctx.fillText(
    Level.gameComplete
      ? "You have saved the Rainbow!"
      : "Collect all the crystals to save the Rainbow!",
    GAME_WIDTH / 2,
    275
  );

  ctx.globalAlpha = Level.gameComplete ? 0 : 0.65 + Math.sin(titleTime * 4) * 0.35;
  ctx.font = "800 21px system-ui, sans-serif";
  ctx.fillText("CLICK TO START", GAME_WIDTH / 2, 348);
  ctx.globalAlpha = 1;
}
