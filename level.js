// level.js - level layouts, colour pickups, hazards, and exits
// space = empty, 1 = ground, r/o/y/g = colour platforms
// C/O/Y/G/B = colour crystals, u/v/</> = portals, D = door, ^ = spikes
var LEVEL_COMPLETE_DELAY = 2;
var COLOR_INFO = {
  red: { tileId: 2, color: "#ff304f", highlight: "#ffb3bf" },
  orange: { tileId: 4, color: "#e66a19", highlight: "#ffc08a" },
  yellow: { tileId: 5, color: "#ffd43b", highlight: "#fff3a3", disappears: true },
  green: { tileId: 6, color: "#34c759", highlight: "#a8f0b8", bounces: true },
  blue: { color: "#0a84ff", highlight: "#8dc8ff" },
};

var Level = {
  levels: [
    {
      colors: ["red"],
      rows: [
        "",
        "",
        "",
        "",
        "                         D",
        "                  C",
        "                 11rrrrrrrrrrrr",
        "             111111",
        "1111111111111111111",
        "1111111111111111111^^^^^^^^^^^",
      ],
    },
    {
      colors: ["red", "orange"],
      rows: [
        "",
        "",
        "                                               D",
        "",
        "                                     O      11111",
        "                                  rrrrr   rrr",
        "                       C      rrrrr   M",
        "                    1111  rrrrr",
        "               111111",
        "          111111",
        "11111111111111^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^",
      ],
    },
    {
      colors: ["red", "orange", "yellow"],
      rows: [
        "",
        "",
        "                                               y",
        "                                               y     D",
        "                                            Y  y",
        "                                        oooooo y 111111111",
        "                                  oooooo",
        "                          O  ooooo",
        "                    rrrrrrrr",
        "                  C",
        "1111111111yyyyyy1111^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^",
      ],
    },
    {
      colors: ["red", "orange", "yellow", "green"],
      rows: [
        "",
        "                                                   1    D",
        "                                                   1",
        "                                                   11    111",
        "                                               y",
        "                                               y",
        "                                            Y  y",
        "                                        oooooo y",
        "                                  oooooo       y",
        "                          O  ooooo             y",
        "                    rrrrrrrr                   yG  ggg",
        "                  C                          11111111111",
        "1111111111yyyyyy1111^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^",
      ],
    },
    {
      colors: ["red", "orange", "yellow", "green", "blue"],
      rows: [
        "",
        "",
        "                                                       B",
        "                                                   1111111111       >      D",
        "                                               y",
        "                                               y                      1111111111",
        "                                            Y  y",
        "                                        oooooo y",
        "                                  oooooo       y",
        "                          O  ooooo             y",
        "                    rrrrrrrr                   yG  ggg        u",
        "                  C                          11111111111    11111",
        "1111111111yyyyyy1111^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^",
      ],
    },
  ],
  currentIndex: 0,
  cols: 0,
  rows: 0,
  map: null,
  requiredColors: null,
  redUnlocked: false,
  orangeUnlocked: false,
  yellowUnlocked: false,
  greenUnlocked: false,
  blueUnlocked: false,
  crystals: null,
  movingPlatforms: null,
  portals: null,
  portalCooldown: 0,
  door: null,
  complete: false,
  completeTimer: 0,
  gameComplete: false,
  failed: false,
  restartTimer: 0,
  time: 0,

  init: function (levelIndex) {
    if (levelIndex !== undefined) Level.currentIndex = levelIndex;
    var definition = Level.levels[Level.currentIndex];
    var rows = definition.rows;

    Level.rows = rows.length;
    Level.cols = 0;
    Level.requiredColors = definition.colors;
    Level.redUnlocked = false;
    Level.orangeUnlocked = false;
    Level.yellowUnlocked = false;
    Level.greenUnlocked = false;
    Level.blueUnlocked = false;
    Level.crystals = [];
    Level.movingPlatforms = [];
    Level.portals = [];
    Level.portalCooldown = 0;
    Level.door = null;
    Level.complete = false;
    Level.completeTimer = 0;
    Level.gameComplete = false;
    Level.failed = false;
    Level.restartTimer = 0;
    Level.time = 0;

    for (var i = 0; i < rows.length; i++) {
      Level.cols = Math.max(Level.cols, rows[i].length);
    }

    Level.map = rows.map(function (row, rowIndex) {
      var cells = row.split("");
      while (cells.length < Level.cols) cells.push(" ");
      return cells.map(function (c, colIndex) {
        var crystalColor =
          c === "C"
            ? "red"
            : c === "O"
              ? "orange"
              : c === "Y"
                ? "yellow"
                : c === "G"
                  ? "green"
                  : c === "B"
                    ? "blue"
                    : null;
        if (crystalColor) {
          Level.crystals.push({
            color: crystalColor,
            x: colIndex * TILE_SIZE + 7,
            y: rowIndex * TILE_SIZE + 5,
            w: 18,
            h: 22,
          });
        }
        if (c === "D") {
          Level.door = {
            x: colIndex * TILE_SIZE + 4,
            y: rowIndex * TILE_SIZE,
            w: 24,
            h: TILE_SIZE * 2,
          };
        }
        if (c === "M") {
          Level.movingPlatforms.push({
            x: colIndex * TILE_SIZE,
            y: rowIndex * TILE_SIZE,
            startX: colIndex * TILE_SIZE,
            startY: rowIndex * TILE_SIZE,
            w: TILE_SIZE * 2,
            h: TILE_SIZE / 2,
            axis: "x",
            range: TILE_SIZE * 4,
            speed: 80,
            offset: 0,
            direction: 1,
            dx: 0,
            dy: 0,
          });
        }
        var portalDirection =
          c === "u"
            ? { x: 0, y: -1 }
            : c === "v"
              ? { x: 0, y: 1 }
              : c === "<"
                ? { x: -1, y: 0 }
                : c === ">"
                  ? { x: 1, y: 0 }
                  : null;
        if (portalDirection) {
          Level.portals.push({
            pair: Math.floor(Level.portals.length / 2),
            x: colIndex * TILE_SIZE + 4,
            y: rowIndex * TILE_SIZE + 4,
            w: TILE_SIZE - 8,
            h: TILE_SIZE - 8,
            nx: portalDirection.x,
            ny: portalDirection.y,
          });
        }
        if (c === "1") return 1;
        if (c === "r") return COLOR_INFO.red.tileId;
        if (c === "^") return 3;
        if (c === "o") return COLOR_INFO.orange.tileId;
        if (c === "y") return COLOR_INFO.yellow.tileId;
        if (c === "g") return COLOR_INFO.green.tileId;
        return 0;
      });
    });
  },

  widthPx: function () {
    return Level.cols * TILE_SIZE;
  },

  heightPx: function () {
    return Level.rows * TILE_SIZE;
  },

  tileAt: function (col, row) {
    if (row < 0 || row >= Level.rows || col < 0 || col >= Level.cols) return 1;
    return Level.map[row][col];
  },

  isSolidAtPixel: function (x, y) {
    var col = Math.floor(x / TILE_SIZE);
    var row = Math.floor(y / TILE_SIZE);
    return isSolidTileId(Level.tileAt(col, row));
  },

  isColorUnlocked: function (color) {
    if (color === "red") return Level.redUnlocked;
    if (color === "orange") return Level.orangeUnlocked;
    if (color === "yellow") return Level.yellowUnlocked;
    if (color === "green") return Level.greenUnlocked;
    if (color === "blue") return Level.blueUnlocked;
    return false;
  },

  unlockColor: function (color) {
    if (color === "red") Level.redUnlocked = true;
    if (color === "orange") Level.orangeUnlocked = true;
    if (color === "yellow") Level.yellowUnlocked = true;
    if (color === "green") Level.greenUnlocked = true;
    if (color === "blue") Level.blueUnlocked = true;
  },

  isOnGreenBounce: function (entity) {
    if (!Level.greenUnlocked) return false;
    var row = Math.floor((entity.y + entity.h + TILE_EPSILON) / TILE_SIZE);
    var col0 = Math.floor(entity.x / TILE_SIZE);
    var col1 = Math.floor((entity.x + entity.w - TILE_EPSILON) / TILE_SIZE);
    for (var col = col0; col <= col1; col++) {
      if (Level.tileAt(col, row) === COLOR_INFO.green.tileId) return true;
    }
    return false;
  },

  updatePortals: function (hero, dt, entryVx, entryVy) {
    Level.portalCooldown = Math.max(0, Level.portalCooldown - dt);
    if (!Level.blueUnlocked || Level.portalCooldown > 0) return false;

    for (var i = 0; i < Level.portals.length; i++) {
      var source = Level.portals[i];
      if (!rectsOverlap(hero, source)) continue;

      var target = null;
      for (var j = 0; j < Level.portals.length; j++) {
        if (i !== j && Level.portals[j].pair === source.pair) {
          target = Level.portals[j];
          break;
        }
      }
      if (!target) return false;

      var speed = Math.max(Math.sqrt(entryVx * entryVx + entryVy * entryVy), 360);
      Particles.portal(
        source.x + source.w / 2,
        source.y + source.h / 2
      );
      hero.x =
        target.x +
        target.w / 2 -
        hero.w / 2 +
        target.nx * (target.w / 2 + hero.w / 2 + 4);
      hero.y =
        target.y +
        target.h / 2 -
        hero.h / 2 +
        target.ny * (target.h / 2 + hero.h / 2 + 4);
      hero.vx = target.nx * speed;
      hero.vy = target.ny * speed;
      hero.onGround = false;
      hero.touchingWallLeft = false;
      hero.touchingWallRight = false;
      hero.groundCoyote = 0;
      Level.portalCooldown = 0.3;
      Particles.portal(
        target.x + target.w / 2,
        target.y + target.h / 2
      );
      camera.shake(4, 0.18);
      return true;
    }
    return false;
  },

  hasRequiredColors: function () {
    for (var i = 0; i < Level.requiredColors.length; i++) {
      if (!Level.isColorUnlocked(Level.requiredColors[i])) return false;
    }
    return true;
  },

  updateMovingPlatforms: function (hero, dt) {
    for (var i = 0; i < Level.movingPlatforms.length; i++) {
      var platform = Level.movingPlatforms[i];
      platform.dx = 0;
      platform.dy = 0;
      if (!Level.orangeUnlocked) continue;

      var wasStanding =
        hero.onGround &&
        Math.abs(hero.y + hero.h - platform.y) <= 2 &&
        hero.x + hero.w > platform.x &&
        hero.x < platform.x + platform.w;
      var oldX = platform.x;
      var oldY = platform.y;
      platform.offset += platform.direction * platform.speed * dt;
      if (platform.offset >= platform.range) {
        platform.offset = platform.range;
        platform.direction = -1;
      } else if (platform.offset <= 0) {
        platform.offset = 0;
        platform.direction = 1;
      }
      if (platform.axis === "x") platform.x = platform.startX + platform.offset;
      else platform.y = platform.startY - platform.offset;
      platform.dx = platform.x - oldX;
      platform.dy = platform.y - oldY;

      if (wasStanding) {
        hero.moveByPlatform(platform.dx, platform.dy);
      }
    }
  },

  resolveMovingPlatforms: function (hero, previousBottom) {
    for (var i = 0; i < Level.movingPlatforms.length; i++) {
      var platform = Level.movingPlatforms[i];
      var overlapsX =
        hero.x + hero.w > platform.x && hero.x < platform.x + platform.w;
      var crossesTop =
        previousBottom <= platform.y + 4 && hero.y + hero.h >= platform.y;
      if (hero.vy >= 0 && overlapsX && crossesTop) {
        hero.y = platform.y - hero.h;
        hero.vy = 0;
        hero.onGround = true;
        return;
      }
    }
  },

  touchesHazard: function (entity) {
    var col0 = Math.max(0, Math.floor(entity.x / TILE_SIZE));
    var col1 = Math.min(
      Level.cols - 1,
      Math.floor((entity.x + entity.w - TILE_EPSILON) / TILE_SIZE)
    );
    var row0 = Math.max(0, Math.floor(entity.y / TILE_SIZE));
    var row1 = Math.min(
      Level.rows - 1,
      Math.floor((entity.y + entity.h - TILE_EPSILON) / TILE_SIZE)
    );

    for (var row = row0; row <= row1; row++) {
      for (var col = col0; col <= col1; col++) {
        if (Level.tileAt(col, row) !== 3) continue;
        var spikeHitbox = {
          x: col * TILE_SIZE,
          y: row * TILE_SIZE + 4,
          w: TILE_SIZE,
          h: TILE_SIZE - 4,
        };
        if (rectsOverlap(entity, spikeHitbox)) return true;
      }
    }
    return false;
  },

  update: function (hero, dt) {
    Level.time += dt;

    if (Level.failed) {
      Level.restartTimer -= dt;
      if (Level.restartTimer <= 0) Level.resetLevel(hero, Level.currentIndex);
      return;
    }

    if (Level.complete) {
      if (Level.gameComplete) return;
      Level.completeTimer -= dt;
      if (Level.completeTimer <= 0) {
        if (Level.currentIndex + 1 < Level.levels.length) {
          Level.resetLevel(hero, Level.currentIndex + 1);
        } else {
          Level.gameComplete = true;
        }
      }
      return;
    }

    if (Level.touchesHazard(hero)) {
      Level.fail(hero);
      return;
    }

    for (var i = 0; i < Level.crystals.length; i++) {
      var crystal = Level.crystals[i];
      if (Level.isColorUnlocked(crystal.color) || !rectsOverlap(hero, crystal)) continue;
      Level.collectCrystal(crystal);
    }

    if (Level.hasRequiredColors() && rectsOverlap(hero, Level.door)) {
      Level.complete = true;
      Level.completeTimer = LEVEL_COMPLETE_DELAY;
      hero.vx = 0;
      hero.vy = 0;
      camera.shake(5, 0.25);
    }
  },

  collectCrystal: function (crystal) {
    var info = COLOR_INFO[crystal.color];
    Level.unlockColor(crystal.color);
    camera.shake(7, 0.35);
    for (var i = 0; i < 18; i++) {
      var angle = (i / 18) * Math.PI * 2;
      Particles.add(
        crystal.x + crystal.w / 2,
        crystal.y + crystal.h / 2,
        Math.cos(angle) * (80 + Math.random() * 90),
        Math.sin(angle) * (80 + Math.random() * 90) - 40,
        0.45 + Math.random() * 0.3,
        3 + Math.random() * 3,
        info.color
      );
    }
  },

  fail: function (hero) {
    if (Level.failed || Level.complete) return;
    Level.failed = true;
    Level.restartTimer = 0.85;
    hero.vx = 0;
    hero.vy = 0;
    camera.shake(8, 0.35);

    for (var i = 0; i < 14; i++) {
      Particles.add(
        hero.x + hero.w / 2,
        hero.y + hero.h,
        (Math.random() * 2 - 1) * 150,
        -70 - Math.random() * 130,
        0.35 + Math.random() * 0.3,
        2 + Math.random() * 4,
        "#ded8e0"
      );
    }
  },

  resetLevel: function (hero, levelIndex) {
    Level.init(levelIndex);
    hero.reset(64, 64);
    Particles.items.length = 0;
    camera.x = 0;
    camera.y = 0;
    camera.zoomSpeed = 0;
  },

  skipLevel: function (hero, direction) {
    var nextIndex = clamp(
      Level.currentIndex + direction,
      0,
      Level.levels.length - 1
    );
    if (nextIndex !== Level.currentIndex) Level.resetLevel(hero, nextIndex);
  },

  draw: function (ctx, camera) {
    var cameraX = Math.round(camera.x);
    var cameraY = Math.round(camera.y);
    var seamOverlap = 1 / camera.zoom;
    var startCol = Math.floor(camera.x / TILE_SIZE);
    var endCol = Math.ceil((camera.x + camera.viewWidth) / TILE_SIZE);
    var startRow = Math.floor(camera.y / TILE_SIZE);
    var endRow = Math.ceil((camera.y + camera.viewHeight) / TILE_SIZE);

    ctx.beginPath();
    for (var row = startRow; row < endRow; row++) {
      for (var col = startCol; col < endCol; col++) {
        if (Level.tileAt(col, row) !== 1) continue;
        ctx.rect(
          col * TILE_SIZE - cameraX,
          row * TILE_SIZE - cameraY,
          TILE_SIZE + seamOverlap,
          TILE_SIZE + seamOverlap
        );
      }
    }
    ctx.fillStyle = "#17151f";
    ctx.fill();

    Level.drawSpikes(ctx, cameraX, cameraY, startCol, endCol, startRow, endRow);
    Level.drawColorTiles(
      ctx,
      cameraX,
      cameraY,
      startCol,
      endCol,
      startRow,
      endRow,
      "red",
      seamOverlap
    );
    Level.drawColorTiles(
      ctx,
      cameraX,
      cameraY,
      startCol,
      endCol,
      startRow,
      endRow,
      "orange",
      seamOverlap
    );
    Level.drawColorTiles(
      ctx,
      cameraX,
      cameraY,
      startCol,
      endCol,
      startRow,
      endRow,
      "yellow",
      seamOverlap
    );
    Level.drawColorTiles(
      ctx,
      cameraX,
      cameraY,
      startCol,
      endCol,
      startRow,
      endRow,
      "green",
      seamOverlap
    );
    Level.drawMovingPlatforms(ctx, cameraX, cameraY);
    Level.drawPortals(ctx, cameraX, cameraY);

    Level.drawCrystals(ctx, cameraX, cameraY);
    Level.drawDoor(ctx, cameraX, cameraY);
  },

  drawColorTiles: function (
    ctx,
    cameraX,
    cameraY,
    startCol,
    endCol,
    startRow,
    endRow,
    color,
    seamOverlap
  ) {
    var info = COLOR_INFO[color];
    var unlocked = Level.isColorUnlocked(color);
    var filled = info.disappears ? !unlocked : unlocked;
    for (var row = startRow; row < endRow; row++) {
      for (var col = startCol; col < endCol; col++) {
        if (Level.tileAt(col, row) !== info.tileId) continue;
        var x = col * TILE_SIZE - cameraX;
        var y = row * TILE_SIZE - cameraY;
        ctx.globalAlpha = filled ? 1 : 0.2;
        ctx.fillStyle = info.color;
        ctx.fillRect(x, y, TILE_SIZE + seamOverlap, TILE_SIZE + seamOverlap);
        if (filled && info.bounces) {
          ctx.globalAlpha = 0.85;
          ctx.strokeStyle = info.highlight;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x + 8, y + 20);
          ctx.lineTo(x + 16, y + 11);
          ctx.lineTo(x + 24, y + 20);
          ctx.stroke();
          ctx.lineWidth = 1;
        } else if (!filled) {
          ctx.globalAlpha = 0.55;
          ctx.strokeStyle = info.highlight;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          ctx.setLineDash([]);
        }
      }
    }
    ctx.globalAlpha = 1;
  },

  drawSpikes: function (ctx, cameraX, cameraY, startCol, endCol, startRow, endRow) {
    ctx.save();
    for (var row = startRow; row < endRow; row++) {
      for (var col = startCol; col < endCol; col++) {
        if (Level.tileAt(col, row) !== 3) continue;
        var x = col * TILE_SIZE - cameraX;
        var y = row * TILE_SIZE - cameraY;
        var half = TILE_SIZE / 2;

        ctx.fillStyle = "#4b4652";
        ctx.fillRect(x, y + half, TILE_SIZE, half);
        ctx.fillStyle = "#ded8e0";
        ctx.beginPath();
        ctx.moveTo(x, y + half);
        ctx.lineTo(x + half / 2, y);
        ctx.lineTo(x + half, y + half);
        ctx.lineTo(x + half + half / 2, y);
        ctx.lineTo(x + TILE_SIZE, y + half);
        ctx.fill();
      }
    }
    ctx.restore();
  },

  drawMovingPlatforms: function (ctx, cameraX, cameraY) {
    for (var i = 0; i < Level.movingPlatforms.length; i++) {
      var platform = Level.movingPlatforms[i];
      var x = Math.round(platform.x) - cameraX;
      var y = Math.round(platform.y) - cameraY;

      ctx.save();
      ctx.fillStyle = Level.orangeUnlocked ? COLOR_INFO.orange.color : "#76614d";
      ctx.fillRect(x, y, platform.w, platform.h);
      ctx.fillStyle = Level.orangeUnlocked ? COLOR_INFO.orange.highlight : "#a68b70";
      ctx.fillRect(x + 5, y + 4, platform.w - 10, 3);
      ctx.fillStyle = "#17151f";
      ctx.beginPath();
      ctx.moveTo(x + platform.w / 2 - 3, y + 4);
      ctx.lineTo(x + platform.w / 2 - 10, y + 8);
      ctx.lineTo(x + platform.w / 2 - 3, y + 12);
      ctx.moveTo(x + platform.w / 2 + 3, y + 4);
      ctx.lineTo(x + platform.w / 2 + 10, y + 8);
      ctx.lineTo(x + platform.w / 2 + 3, y + 12);
      ctx.fill();
      ctx.restore();
    }
  },

  drawPortals: function (ctx, cameraX, cameraY) {
    for (var i = 0; i < Level.portals.length; i++) {
      var portal = Level.portals[i];
      var x = portal.x + portal.w / 2 - cameraX;
      var y = portal.y + portal.h / 2 - cameraY;
      var vertical = portal.nx !== 0;
      var pulse = 1 + Math.sin(Level.time * 7 + i * Math.PI) * 0.12;

      ctx.save();
      ctx.globalAlpha = Level.blueUnlocked ? 1 : 0.25;
      ctx.strokeStyle = COLOR_INFO.blue.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(
        x,
        y,
        (vertical ? 5 : 13) * pulse,
        (vertical ? 13 : 5) * pulse,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.strokeStyle = COLOR_INFO.blue.highlight;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y, vertical ? 4 : 11, vertical ? 11 : 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  },

  drawCrystals: function (ctx, cameraX, cameraY) {
    for (var i = 0; i < Level.crystals.length; i++) {
      var crystal = Level.crystals[i];
      if (Level.isColorUnlocked(crystal.color)) continue;
      Level.drawCrystal(ctx, cameraX, cameraY, crystal);
    }
  },

  drawCrystal: function (ctx, cameraX, cameraY, crystal) {
    var info = COLOR_INFO[crystal.color];
    var x = crystal.x + crystal.w / 2 - cameraX;
    var y = crystal.y + crystal.h / 2 - cameraY + Math.sin(Level.time * 4) * 3;
    var pulse = 8 + Math.sin(Level.time * 5) * 2;

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.arc(x, y, pulse + 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x + 9, y);
    ctx.lineTo(x, y + 12);
    ctx.lineTo(x - 9, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = info.highlight;
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x + 3, y - 1);
    ctx.lineTo(x - 2, y + 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  drawDoor: function (ctx, cameraX, cameraY) {
    if (!Level.door) return;
    var door = Level.door;
    var x = door.x - cameraX;
    var y = door.y - cameraY;
    var open = Level.hasRequiredColors();
    var exitColor = COLOR_INFO[Level.requiredColors[Level.requiredColors.length - 1]];

    ctx.save();
    ctx.fillStyle = open ? exitColor.color : "#615965";
    ctx.fillRect(x, y + 8, door.w, door.h - 8);
    ctx.beginPath();
    ctx.arc(x + door.w / 2, y + 9, door.w / 2, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#17151f";
    ctx.fillRect(x + 5, y + 15, door.w - 10, door.h - 15);
    ctx.fillStyle = open ? exitColor.highlight : "#8f8792";
    ctx.fillRect(x + door.w - 7, y + 36, 3, 3);
    ctx.restore();
  },

  drawHud: function (ctx, canvas) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 15px monospace";
    ctx.fillStyle = "#f0e9ee";

    var nextColor = null;
    for (var i = 0; i < Level.requiredColors.length; i++) {
      if (!Level.isColorUnlocked(Level.requiredColors[i])) {
        nextColor = Level.requiredColors[i];
        break;
      }
    }

    var message;
    if (nextColor) {
      message = "FIND THE " + nextColor.toUpperCase() + " CRYSTAL";
      if (nextColor !== "red") ctx.fillStyle = COLOR_INFO[nextColor].color;
    } else {
      message = "COLOURS RESTORED - REACH THE DOOR";
      ctx.fillStyle = COLOR_INFO[Level.requiredColors[Level.requiredColors.length - 1]].color;
    }
    if (Level.failed) message = "YOU FELL - RESTARTING";
    if (Level.complete) message = "LEVEL " + (Level.currentIndex + 1) + " COMPLETE";
    if (Level.gameComplete) message = "ALL LEVELS COMPLETE";
    ctx.fillText("LEVEL " + (Level.currentIndex + 1) + "  -  " + message, canvas.width / 2, 26);

    if (Level.complete) {
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = COLOR_INFO[Level.requiredColors[Level.requiredColors.length - 1]].color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.font = "bold 32px monospace";
      ctx.fillStyle = "#fff";
      ctx.fillText(
        Level.gameComplete ? "ALL LEVELS COMPLETE" : "LEVEL " + (Level.currentIndex + 1) + " COMPLETE",
        canvas.width / 2,
        canvas.height / 2
      );
    }

    if (Level.failed) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#17151f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.font = "bold 32px monospace";
      ctx.fillStyle = "#fff";
      ctx.fillText("TRY AGAIN", canvas.width / 2, canvas.height / 2);
    }
    ctx.restore();
  },
};
