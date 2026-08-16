// hero.js - the player
var GRAVITY = 1400; // px/s^2
var MOVE_SPEED = 300; // px/s - carrying speed gives jumps more horizontal range
var GROUND_ACCEL = 1200; // takes roughly 0.2s to build to full speed
var GROUND_DECEL = 2100; // braking remains sharper than acceleration
var AIR_ACCEL = 800; // preserves takeoff momentum while allowing corrections
var JUMP_SPEED = 520; // px/s (initial upward velocity)
var BOUNCE_SPEED = 850; // green blocks launch much higher than a normal jump
var JUMP_CUT = 0.45; // releasing jump early shortens the jump
var MAX_AIR_JUMPS = 1; // 1 extra jump after leaving the ground = a double jump
var SOMERSAULT_DURATION = 0.42; // one full turn during the second jump
var WALL_SLIDE_SPEED = 100; // max fall speed while sliding down a wall
var WALL_JUMP_VX = 80; // horizontal kick away from the wall
var WALL_JUMP_VY = 480; // upward kick off the wall
var WALL_COYOTE_TIME = 0.12; // grace window after leaving a wall where a jump still counts as a wall jump
var WALL_JUMP_LOCK_TIME = 0.12; // brief protected kick before air steering takes over
var GROUND_COYOTE_TIME = 0.1; // grace window after leaving the ground where a jump still counts as a ground jump
var TRAIL_SPACING = 6; // px between rainbow trail samples
var TRAIL_LIFE = 0.42; // seconds before a trail sample disappears
var TRAIL_BAND_WIDTH = 3;
var TRAIL_COLORS = ["#ff304f", "#e66a19", "#ffd43b", "#34c759", "#0a84ff", "#af52de"];
var SHADOW_MAX_DISTANCE = 240;
var SQUISHINESS = 1.2; // 0 = rigid, 1 = original deformation, higher = squishier

function squishScale(scale) {
  return 1 + (scale - 1) * SQUISHINESS;
}

function Hero(x, y) {
  Entity.call(this, x, y, 22, 28);
  this.facing = 1;
  this.airJumpsLeft = MAX_AIR_JUMPS;
  this.jumpKeyWasDown = false;
  this.wallCoyoteLeft = 0;
  this.wallCoyoteRight = 0;
  this.wallJumpLock = 0;
  this.groundCoyote = 0;
  this.lastJumpType = "none"; // ground / air / wall / bounce - for debugging
  this.jumpSerial = 0; // increments once per jump so other systems can react
  this.moveDirection = 0;
  this.visualScaleX = 1;
  this.visualScaleY = 1;
  this.visualTilt = 0;
  this.somersaultAngle = 0;
  this.somersaultTime = 0;
  this.somersaultDirection = 1;
  this.wallShape = 0;
  this.wallShapeSide = 1;
  this.trail = [];
  this.trailDistance = 0;
}
Hero.prototype = Object.create(Entity.prototype);
Hero.prototype.constructor = Hero;

Hero.prototype.reset = function (x, y) {
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.onGround = false;
  this.touchingWallLeft = false;
  this.touchingWallRight = false;
  this.airJumpsLeft = MAX_AIR_JUMPS;
  this.jumpKeyWasDown = false;
  this.wallCoyoteLeft = 0;
  this.wallCoyoteRight = 0;
  this.wallJumpLock = 0;
  this.groundCoyote = 0;
  this.lastJumpType = "none";
  this.visualScaleX = 1;
  this.visualScaleY = 1;
  this.visualTilt = 0;
  this.somersaultAngle = 0;
  this.somersaultTime = 0;
  this.wallShape = 0;
  this.trail.length = 0;
  this.trailDistance = 0;
};

Hero.prototype.update = function (dt) {
  var trailStartX = this.x + this.w / 2;
  var trailStartY = this.y + this.h / 2;
  var wasGrounded = this.onGround;
  var landingSpeed;
  var left = Keys.isDown("ArrowLeft") || Keys.isDown("KeyA");
  var right = Keys.isDown("ArrowRight") || Keys.isDown("KeyD");
  var jumpDown = Keys.isDown("Space") || Keys.isDown("ArrowUp") || Keys.isDown("KeyW");
  var jumpPressed = jumpDown && !this.jumpKeyWasDown; // edge trigger, not held-repeat
  var jumpReleased = !jumpDown && this.jumpKeyWasDown;
  this.jumpKeyWasDown = jumpDown;

  var inputVx = 0;
  var inputFacing = this.facing;
  if (left) {
    inputVx = -MOVE_SPEED;
    inputFacing = -1;
  }
  if (right) {
    inputVx = MOVE_SPEED;
    inputFacing = 1;
  }

  var inputDirection = inputVx === 0 ? 0 : inputVx > 0 ? 1 : -1;
  if (
    inputDirection !== 0 &&
    this.moveDirection !== 0 &&
    inputDirection !== this.moveDirection &&
    this.onGround
  ) {
    this.visualScaleX = squishScale(1.18);
    this.visualScaleY = squishScale(0.88);
    this.visualTilt = -inputDirection * 0.16;
  }
  if (inputDirection !== 0) this.moveDirection = inputDirection;

  // this.onGround reflects the END of last frame's collision pass, so on the
  // exact frame you land it's still false. The probe checks the current
  // position/speed directly, so it catches the landing the same frame it happens.
  var groundedNow = this.onGround || (this.vy >= 0 && this.isGroundedProbe(dt));
  this.groundCoyote = groundedNow ? GROUND_COYOTE_TIME : Math.max(0, this.groundCoyote - dt);
  var isGroundedForJump = this.groundCoyote > 0;

  // Refresh the coyote window any time we're actually against a wall, so
  // there's a short forgiving buffer instead of needing frame-perfect contact.
  this.wallCoyoteLeft = this.touchingWallLeft ? WALL_COYOTE_TIME : Math.max(0, this.wallCoyoteLeft - dt);
  this.wallCoyoteRight = this.touchingWallRight ? WALL_COYOTE_TIME : Math.max(0, this.wallCoyoteRight - dt);

  var wallSide = 0; // -1 = wall on our left, 1 = wall on our right
  if (!isGroundedForJump) {
    if (this.wallCoyoteLeft > 0) wallSide = -1;
    else if (this.wallCoyoteRight > 0) wallSide = 1;
  }
  var onWall = wallSide !== 0;

  if (isGroundedForJump) {
    this.airJumpsLeft = MAX_AIR_JUMPS;
  }

  if (jumpPressed) {
    if (isGroundedForJump) {
      this.vy = -JUMP_SPEED;
      this.lastJumpType = "ground";
      this.jumpSerial++;
      this.visualScaleX = squishScale(0.78);
      this.visualScaleY = squishScale(1.24);
      Particles.jump(this, "ground");
      this.groundCoyote = 0; // consumed - stops a single press re-triggering next frame
    } else if (onWall) {
      this.vy = -WALL_JUMP_VY;
      this.vx = wallSide < 0 ? WALL_JUMP_VX : -WALL_JUMP_VX; // always kicks away from the wall
      this.facing = wallSide < 0 ? 1 : -1;
      this.airJumpsLeft = MAX_AIR_JUMPS; // wall jump refreshes the double jump
      this.wallJumpLock = WALL_JUMP_LOCK_TIME;
      this.wallCoyoteLeft = 0; // consume the wall so you can't re-trigger it next frame
      this.wallCoyoteRight = 0;
      this.lastJumpType = "wall";
      this.jumpSerial++;
      this.visualScaleX = squishScale(0.76);
      this.visualScaleY = squishScale(1.26);
      Particles.jump(this, "wall");
    } else if (this.airJumpsLeft > 0) {
      this.vy = -JUMP_SPEED;
      this.airJumpsLeft--;
      this.lastJumpType = "air";
      this.jumpSerial++;
      this.visualScaleX = squishScale(0.72);
      this.visualScaleY = squishScale(1.3);
      this.somersaultAngle = 0;
      this.somersaultTime = SOMERSAULT_DURATION;
      this.somersaultDirection = this.facing;
      Particles.jump(this, "air");
    }
  }

  if (jumpReleased && this.vy < -120) {
    this.vy *= JUMP_CUT;
  }

  // While locked, keep the kick's velocity instead of letting held input
  // overwrite it immediately - otherwise holding "into" the wall cancels
  // the jump-away on the very next frame.
  if (this.wallJumpLock > 0) {
    this.wallJumpLock -= dt;
  } else {
    var acceleration = groundedNow
      ? inputVx === 0
        ? GROUND_DECEL
        : GROUND_ACCEL
      : AIR_ACCEL;
    this.vx = moveTowards(this.vx, inputVx, acceleration * dt);
    this.facing = inputFacing;
  }

  this.vy += GRAVITY * dt;

  // slide down walls slower than a normal fall, like a standard wall-jump platformer
  if (onWall && this.vy > WALL_SLIDE_SPEED) {
    this.vy = WALL_SLIDE_SPEED;
  }

  if (onWall && this.vy > 0) {
    Particles.wallSlide(this, wallSide, dt);
  }

  landingSpeed = this.vy;
  var previousBottom = this.y + this.h;
  this.moveAndCollide(this.vx * dt, this.vy * dt);
  Level.resolveMovingPlatforms(this, previousBottom);

  var teleported = Level.updatePortals(this, dt, this.vx, landingSpeed);
  if (
    !teleported &&
    landingSpeed > 0 &&
    this.onGround &&
    Level.isOnGreenBounce(this)
  ) {
    this.vy = -BOUNCE_SPEED;
    this.onGround = false;
    this.groundCoyote = 0;
    this.airJumpsLeft = MAX_AIR_JUMPS;
    this.lastJumpType = "bounce";
    this.jumpSerial++;
    this.visualScaleX = squishScale(1.5);
    this.visualScaleY = squishScale(0.55);
    Particles.bounce(this);
    camera.shake(7, 0.24);
  }
  this.updateTrail(dt, trailStartX, trailStartY);

  var touchingWallSide = this.touchingWallLeft ? -1 : this.touchingWallRight ? 1 : 0;
  var wallShapeTarget = touchingWallSide !== 0 && !this.onGround ? 1 : 0;
  if (touchingWallSide !== 0) this.wallShapeSide = touchingWallSide;
  this.wallShape +=
    (wallShapeTarget - this.wallShape) * (1 - Math.exp(-18 * dt));

  if (!wasGrounded && this.onGround) {
    this.visualScaleX = squishScale(clamp(1 + landingSpeed / 1100, 1.12, 1.42));
    this.visualScaleY = squishScale(clamp(1 - landingSpeed / 1500, 0.62, 0.86));
    Particles.land(this, landingSpeed);
  }

  var visualReturn = 1 - Math.exp(-13 * dt);
  this.visualScaleX += (1 - this.visualScaleX) * visualReturn;
  this.visualScaleY += (1 - this.visualScaleY) * visualReturn;
  var targetTilt = clamp(this.vx / MOVE_SPEED, -1, 1) * 0.07;
  this.visualTilt += (targetTilt - this.visualTilt) * (1 - Math.exp(-10 * dt));

  if (this.somersaultTime > 0) {
    this.somersaultTime = Math.max(0, this.somersaultTime - dt);
    var somersaultProgress = 1 - this.somersaultTime / SOMERSAULT_DURATION;
    this.somersaultAngle = this.somersaultDirection * somersaultProgress * Math.PI * 2;
    if (this.somersaultTime === 0) this.somersaultAngle = 0;
  }

  // Safety fallback for maps without a hazard row.
  if (this.y > Level.heightPx()) {
    Level.fail(this);
  }
};

Hero.prototype.updateTrail = function (dt, startX, startY) {
  for (var i = this.trail.length - 1; i >= 0; i--) {
    this.trail[i].life -= dt;
    if (this.trail[i].life <= 0) this.trail.splice(i, 1);
  }

  var endX = this.x + this.w / 2;
  var endY = this.y + this.h / 2;
  var dx = endX - startX;
  var dy = endY - startY;
  var distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < 0.01) return;

  var nextSample = TRAIL_SPACING - this.trailDistance;
  while (nextSample <= distance) {
    var amount = nextSample / distance;
    if (this.trail.length === 0) {
      this.trail.push({ x: startX, y: startY, life: TRAIL_LIFE });
    }
    this.trail.push({
      x: startX + dx * amount,
      y: startY + dy * amount,
      life: TRAIL_LIFE,
    });
    nextSample += TRAIL_SPACING;
  }
  this.trailDistance = (this.trailDistance + distance) % TRAIL_SPACING;
};

Hero.prototype.drawShadow = function (ctx, camera) {
  var centerX = this.x + this.w / 2;
  var feetY = this.y + this.h;
  var col = Math.floor(centerX / TILE_SIZE);
  var startRow = Math.max(0, Math.floor(feetY / TILE_SIZE));
  var floorY = -1;

  for (var row = startRow; row < Level.rows; row++) {
    if (isSolidTileId(Level.tileAt(col, row))) {
      floorY = row * TILE_SIZE;
      break;
    }
  }

  if (floorY < 0) return;
  var distance = Math.max(0, floorY - feetY);
  if (distance > SHADOW_MAX_DISTANCE) return;

  var heightAmount = distance / SHADOW_MAX_DISTANCE;
  var shadowWidth = this.w * (0.95 - heightAmount * 0.45);
  var shadowHeight = 3 - heightAmount * 1.4;

  ctx.save();
  ctx.globalAlpha = 0.4 * (1 - heightAmount);
  ctx.fillStyle = "#FFF";
  ctx.beginPath();
  ctx.ellipse(
    Math.round(centerX) - Math.round(camera.x),
    floorY - Math.round(camera.y) + 1,
    shadowWidth / 2,
    shadowHeight,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();
};

Hero.prototype.draw = function (ctx, camera) {
  var drawX = Math.round(this.x) - Math.round(camera.x);
  var drawY = Math.round(this.y) - Math.round(camera.y);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = TRAIL_BAND_WIDTH + 0.5;
  for (var i = 1; i < this.trail.length; i++) {
    var previous = this.trail[i - 1];
    var sample = this.trail[i];
    var segmentX = sample.x - previous.x;
    var segmentY = sample.y - previous.y;
    var segmentLength = Math.sqrt(segmentX * segmentX + segmentY * segmentY) || 1;
    var normalX = -segmentY / segmentLength;
    var normalY = segmentX / segmentLength;
    var fade = Math.min(previous.life, sample.life) / TRAIL_LIFE;

    ctx.globalAlpha = fade * 0.85;
    var trailColors = Level.blueUnlocked
      ? [TRAIL_COLORS[0], TRAIL_COLORS[1], TRAIL_COLORS[2], TRAIL_COLORS[3], TRAIL_COLORS[4]]
      : Level.greenUnlocked
        ? [TRAIL_COLORS[0], TRAIL_COLORS[1], TRAIL_COLORS[2], TRAIL_COLORS[3]]
        : Level.yellowUnlocked
        ? [TRAIL_COLORS[0], TRAIL_COLORS[1], TRAIL_COLORS[2]]
        : Level.orangeUnlocked
          ? [TRAIL_COLORS[0], TRAIL_COLORS[1]]
          : Level.redUnlocked
            ? [TRAIL_COLORS[0]]
            : ["#c7c2c8"];
    for (var band = 0; band < trailColors.length; band++) {
      var offset = (band - (trailColors.length - 1) / 2) * TRAIL_BAND_WIDTH;
      ctx.strokeStyle = trailColors[band];
      ctx.beginPath();
      ctx.moveTo(
        previous.x + normalX * offset - camera.x,
        previous.y + normalY * offset - camera.y
      );
      ctx.lineTo(
        sample.x + normalX * offset - camera.x,
        sample.y + normalY * offset - camera.y
      );
      ctx.stroke();
    }
  }
  ctx.restore();

  ctx.save();
  ctx.translate(drawX + this.w / 2, drawY + this.h / 2);
  ctx.rotate(this.somersaultAngle);
  ctx.translate(0, this.h / 2);
  ctx.rotate(this.visualTilt);
  ctx.scale(this.visualScaleX, this.visualScaleY);
  ctx.fillStyle = Level.blueUnlocked
    ? "#0a84ff"
    : Level.greenUnlocked
      ? "#34c759"
      : Level.yellowUnlocked
      ? "#ffd43b"
      : Level.orangeUnlocked
        ? "#e66a19"
        : Level.redUnlocked
          ? "#e63946"
          : "#aaa5ad";
  var wallEdge = this.wallShapeSide * this.w / 2;
  var freeEdge = -this.wallShapeSide * this.w / 2;
  var taperedBottom =
    freeEdge + this.wallShapeSide * this.w * 0.16 * SQUISHINESS * this.wallShape;
  ctx.beginPath();
  ctx.moveTo(wallEdge, -this.h);
  ctx.lineTo(freeEdge, -this.h);
  ctx.lineTo(taperedBottom, 0);
  ctx.lineTo(wallEdge, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};
