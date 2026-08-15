// entity.js - base class for anything that lives in the level and moves
function Entity(x, y, w, h) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.vx = 0;
  this.vy = 0;
  this.onGround = false;
  this.touchingWallLeft = false;
  this.touchingWallRight = false;
}

// Moves the entity by (dx, dy), resolving collisions against solid tiles
// one axis at a time so diagonal movement can't clip into corners.
Entity.prototype.moveAndCollide = function (dx, dy) {
  this.x += dx;
  this.resolveAxis("x");

  this.y += dy;
  this.resolveAxis("y");

  // Collision resolution only reports a landing on the frame that downward
  // movement enters a tile. Probe just below the feet afterwards so the state
  // remains true while standing still instead of flickering true/false.
  this.onGround = this.touchesSolid(this.x, this.y + this.h, this.w, 1);

  this.updateWallTouch();
};

// Moving platforms carry entities independently of their own velocity. Resolve
// that displacement using the platform's direction so a sideways push into a
// wall is handled horizontally instead of becoming a vertical pop next frame.
Entity.prototype.moveByPlatform = function (dx, dy) {
  if (dx !== 0) {
    this.x += dx;
    this.resolveAxis("x", dx);
  }
  if (dy !== 0) {
    this.y += dy;
    this.resolveAxis("y", dy);
  }
};

// True if a solid tile overlaps the given rect - used as a general probe
// rather than relying on actual collision (which only fires while moving).
Entity.prototype.touchesSolid = function (x, y, w, h) {
  var col0 = Math.floor(x / TILE_SIZE);
  var col1 = Math.floor((x + w - TILE_EPSILON) / TILE_SIZE);
  var row0 = Math.floor(y / TILE_SIZE);
  var row1 = Math.floor((y + h - TILE_EPSILON) / TILE_SIZE);

  for (var row = row0; row <= row1; row++) {
    for (var col = col0; col <= col1; col++) {
      if (isSolidTileId(Level.tileAt(col, row))) return true;
    }
  }
  return false;
};

// Casts a 1px probe left/right of the entity to see if it's resting
// against a wall. The vertical inset stops floor/ceiling corners from
// being mistaken for a wall, and isTallWall filters out single-tile
// ledges (only a real multi-tile wall should trigger a wall jump).
Entity.prototype.updateWallTouch = function () {
  var inset = 4;
  var probeY = this.y + inset;
  var probeH = this.h - inset * 2;

  this.touchingWallLeft =
    this.touchesSolid(this.x - 1, probeY, 1, probeH) &&
    this.isTallWall(this.x - 1, probeY, probeH);
  this.touchingWallRight =
    this.touchesSolid(this.x + this.w, probeY, 1, probeH) &&
    this.isTallWall(this.x + this.w, probeY, probeH);
};

// A stray one-tile platform corner shouldn't feel like a wall. Require at
// least 2 vertically-stacked solid tiles in the probed column to count.
Entity.prototype.isTallWall = function (x, probeY, probeH) {
  var col = Math.floor(x / TILE_SIZE);
  var row0 = Math.floor(probeY / TILE_SIZE) - 1;
  var row1 = Math.floor((probeY + probeH - TILE_EPSILON) / TILE_SIZE) + 1;
  var solidCount = 0;

  for (var row = row0; row <= row1; row++) {
    if (isSolidTileId(Level.tileAt(col, row))) solidCount++;
  }
  return solidCount >= 2;
};

// this.onGround only gets set once collision resolution has already run,
// so on the exact frame you land it's still reporting last frame's value
// (false). Jump decisions happen before that resolution runs, so relying
// on the stale flag can misclassify a normal landing-frame jump as an air
// jump. This probes the ground directly at the current position, with a
// margin sized to how far you'll fall this frame, so it catches landings
// the same frame they happen.
Entity.prototype.isGroundedProbe = function (dt) {
  var margin = Math.max(4, this.vy * dt + 2);
  return this.touchesSolid(this.x, this.y + this.h, this.w, margin);
};

Entity.prototype.resolveAxis = function (axis, movement) {
  var left = this.x;
  var right = this.x + this.w;
  var top = this.y;
  var bottom = this.y + this.h;

  var col0 = Math.floor(left / TILE_SIZE);
  var col1 = Math.floor((right - TILE_EPSILON) / TILE_SIZE);
  var row0 = Math.floor(top / TILE_SIZE);
  var row1 = Math.floor((bottom - TILE_EPSILON) / TILE_SIZE);
  var direction =
    movement === undefined ? (axis === "x" ? this.vx : this.vy) : movement;

  for (var row = row0; row <= row1; row++) {
    for (var col = col0; col <= col1; col++) {
      if (!isSolidTileId(Level.tileAt(col, row))) continue;

      var tileLeft = col * TILE_SIZE;
      var tileTop = row * TILE_SIZE;

      if (axis === "x") {
        if (direction > 0) this.x = tileLeft - this.w;
        else if (direction < 0) this.x = tileLeft + TILE_SIZE;
        this.vx = 0;
      } else {
        if (direction > 0) {
          this.y = tileTop - this.h;
          this.onGround = true;
        } else if (direction < 0) {
          this.y = tileTop + TILE_SIZE;
        }
        this.vy = 0;
      }
      return; // one correction per axis is enough for a basic platformer
    }
  }
};
