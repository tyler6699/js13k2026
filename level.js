// level.js - level layout, colour pickup, and exit
// 0 / space = empty, 1 = permanent ground, r = red platform
// C = red crystal, D = end door, ^ = spikes
var Level = {
  cols: 72,
  rows: 14,
  map: null,
  redUnlocked: false,
  crystal: null,
  door: null,
  complete: false,
  failed: false,
  restartTimer: 0,
  time: 0,

  init: function () {
    var rows = [
      "",
      "",
      "",
      "",
      "                         D",
      "                  C",
      "                 11rrrrrrrrrrrr",
      "             111111",
      "1111111111111111111",
      "1111111111111111111^^^^^^^^^^^^",
    ];

    Level.rows = rows.length;
    Level.cols = 0;
    Level.crystal = null;
    Level.door = null;
    Level.redUnlocked = false;
    Level.complete = false;
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
        if (c === "C") {
          Level.crystal = {
            x: colIndex * TILE_SIZE + 7,
            y: rowIndex * TILE_SIZE + 5,
            w: 18,
            h: 22,
          };
        }
        if (c === "D") {
          Level.door = {
            x: colIndex * TILE_SIZE + 4,
            y: rowIndex * TILE_SIZE,
            w: 24,
            h: TILE_SIZE * 2,
          };
        }
        if (c === "1") return 1;
        if (c === "r") return 2;
        if (c === "^") return 3;
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
      if (Level.restartTimer <= 0) Level.restart(hero);
      return;
    }

    if (!Level.complete && Level.touchesHazard(hero)) {
      Level.fail(hero);
      return;
    }

    if (!Level.redUnlocked && rectsOverlap(hero, Level.crystal)) {
      Level.redUnlocked = true;
      camera.shake(7, 0.35);
      for (var i = 0; i < 18; i++) {
        var angle = (i / 18) * Math.PI * 2;
        Particles.add(
          Level.crystal.x + Level.crystal.w / 2,
          Level.crystal.y + Level.crystal.h / 2,
          Math.cos(angle) * (80 + Math.random() * 90),
          Math.sin(angle) * (80 + Math.random() * 90) - 40,
          0.45 + Math.random() * 0.3,
          3 + Math.random() * 3,
          "#ff304f"
        );
      }
    }

    if (Level.redUnlocked && !Level.complete && rectsOverlap(hero, Level.door)) {
      Level.complete = true;
      hero.vx = 0;
      hero.vy = 0;
      camera.shake(5, 0.25);
    }
  },

  fail: function (hero) {
    if (Level.failed) return;
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

  restart: function (hero) {
    Level.init();
    hero.reset(64, 64);
    Particles.items.length = 0;
    camera.x = 0;
    camera.y = 0;
    camera.zoomSpeed = 0;
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

    Level.drawSpikes(
      ctx,
      cameraX,
      cameraY,
      startCol,
      endCol,
      startRow,
      endRow
    );

    for (var redRow = startRow; redRow < endRow; redRow++) {
      for (var redCol = startCol; redCol < endCol; redCol++) {
        if (Level.tileAt(redCol, redRow) !== 2) continue;
        var x = redCol * TILE_SIZE - cameraX;
        var y = redRow * TILE_SIZE - cameraY;
        ctx.globalAlpha = Level.redUnlocked ? 1 : 0.2;
        ctx.fillStyle = "#ff304f";
        ctx.fillRect(x, y, TILE_SIZE + seamOverlap, TILE_SIZE + seamOverlap);
        if (!Level.redUnlocked) {
          ctx.globalAlpha = 0.55;
          ctx.strokeStyle = "#ff8a9d";
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          ctx.setLineDash([]);
        }
      }
    }
    ctx.globalAlpha = 1;

    Level.drawCrystal(ctx, cameraX, cameraY);
    Level.drawDoor(ctx, cameraX, cameraY);
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

  drawCrystal: function (ctx, cameraX, cameraY) {
    if (Level.redUnlocked || !Level.crystal) return;
    var crystal = Level.crystal;
    var x = crystal.x + crystal.w / 2 - cameraX;
    var y = crystal.y + crystal.h / 2 - cameraY + Math.sin(Level.time * 4) * 3;
    var pulse = 8 + Math.sin(Level.time * 5) * 2;

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#ff304f";
    ctx.beginPath();
    ctx.arc(x, y, pulse + 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ff304f";
    ctx.beginPath();
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x + 9, y);
    ctx.lineTo(x, y + 12);
    ctx.lineTo(x - 9, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffb3bf";
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

    ctx.save();
    ctx.fillStyle = Level.redUnlocked ? "#ff304f" : "#615965";
    ctx.fillRect(x, y + 8, door.w, door.h - 8);
    ctx.beginPath();
    ctx.arc(x + door.w / 2, y + 9, door.w / 2, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#17151f";
    ctx.fillRect(x + 5, y + 15, door.w - 10, door.h - 15);
    ctx.fillStyle = Level.redUnlocked ? "#ffd6dd" : "#8f8792";
    ctx.fillRect(x + door.w - 7, y + 36, 3, 3);
    ctx.restore();
  },

  drawHud: function (ctx, canvas) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 15px monospace";
    ctx.fillStyle = Level.redUnlocked ? "#ff304f" : "#f0e9ee";
    var message = Level.redUnlocked
      ? "RED RESTORED - REACH THE DOOR"
      : "FIND THE RED CRYSTAL";
    if (Level.failed) message = "YOU FELL - RESTARTING";
    if (Level.complete) message = "LEVEL COMPLETE";
    ctx.fillText(message, canvas.width / 2, 26);

    if (Level.complete) {
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#ff304f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.font = "bold 32px monospace";
      ctx.fillStyle = "#fff";
      ctx.fillText("RED COMPLETE", canvas.width / 2, canvas.height / 2);
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
