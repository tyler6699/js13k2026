// level.js - level layouts, colour pickups, hazards, and exits
// space = empty, 1 = ground, r/o/y/g/i = colour platforms
// C/O/Y/G/B/I/V = colour crystals, u/v/</> = portals, D = door, ^ = spikes
var LEVEL_COMPLETE_DELAY = 2;
var INDIGO_CRUMBLE_DELAY = 0.3;
var INDIGO_RESPAWN_DELAY = 1.5;
var VIOLET_EXPLOSION_TIME = 5;
var COLOR_INFO = {
  red: { tileId: 2, color: "#ff304f", highlight: "#ffb3bf" },
  orange: { tileId: 4, color: "#e66a19", highlight: "#ffc08a" },
  yellow: { tileId: 5, color: "#ffd43b", highlight: "#fff3a3", disappears: true },
  green: { tileId: 6, color: "#34c759", highlight: "#a8f0b8", bounces: true },
  blue: { color: "#0a84ff", highlight: "#8dc8ff" },
  indigo: { tileId: 7, color: "#5856d6", highlight: "#b8b7ff", crumbles: true },
  violet: { color: "#af52de", highlight: "#e4b5fa" },
};

// Build fixed-width rows from compact [row, column, tiles] placements. Keeping
// coordinates beside each feature makes the routes easier to tune than long,
// space-padded strings.
function makeLevelRows(width, height, placements) {
  var rows = [];
  for (var row = 0; row < height; row++) rows.push(" ".repeat(width));
  for (var i = 0; i < placements.length; i++) {
    var placement = placements[i];
    var source = rows[placement[0]];
    rows[placement[0]] =
      source.slice(0, placement[1]) +
      placement[2] +
      source.slice(placement[1] + placement[2].length);
  }
  return rows;
}

var Level = {
  levels: [
    {
      colors: ["red"],
      // A gentle staircase, one crystal, and a broad red bridge.
      rows: makeLevelRows(42, 12, [
        [5, 36, "D"],
        [7, 16, "C"],
        [7, 33, "111111111"],
        [8, 13, "1111rrrrrrrrrrrrrrrr"],
        [9, 7, "1111"],
        [10, 0, "111111111111111111^^^^^^^^^^^^^^^111111111"],
      ]),
    },
    {
      colors: ["red","orange"],
      rows: makeLevelRows(36, 12, [
        [0, 0, "1"],
        [1, 0, "1"],
        [1, 35, "D"],
        [2, 0, "1"],
        [3, 0, "1"],
        [3, 34, "11"],
        [4, 0, "1"],
        [4, 32, "11"],
        [5, 0, "1"],
        [6, 0, "1"],
        [6, 17, "O"],
        [6, 30, "11"],
        [7, 0, "1   C"],
        [7, 16, "11  M     M"],
        [8, 0, "1  11 rr   rr"],
        [9, 0, "1 111"],
        [10, 0, "11111^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^"],
      ]),
    },
    {
      colors: ["red", "orange", "yellow"],
      platformRange: 5,
      platformSpeed: 85,
      platformAxis: "x",
      // Yellow removes its own landing, revealing a chain of comfortable
      // single-jump islands. Double jumping is optional throughout this level.
      rows: makeLevelRows(68, 15, [
        [7, 42, "Y"],
        [7, 65, "D"],
        [8, 25, "O"],
        [8, 39, "yyyyyy"],
        [9, 22, "rrrrrr"],
        [9, 31, "M"],
        [9, 59, "111111111"],
        [10, 51, "11111"],
        [11, 11, "C"],
        [11, 17, "rrrr"],
        [11, 41, "1111111"],
        [12, 8, "1111111"],
        [13, 0, "11111111111111111^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^"],
      ]),
    },
    {
      colors: ["red", "orange", "yellow", "green"],
      platformRange: 6,
      platformSpeed: 70,
      platformAxis: "y",
      // Climb right, ride upward, fall through yellow, then use green to loop
      // back across the upper route to the door near the starting side.
      rows: makeLevelRows(46, 20, [
        [3, 8, "D"],
        [3, 36, "Y"],
        [5, 6, "111111"],
        [5, 34, "yyyyyy"],
        [6, 10, "1111111"],
        [8, 14, "1111111"],
        [9, 31, "O"],
        [10, 20, "11111111"],
        [10, 29, "rrrrr"],
        [10, 35, "M"],
        [12, 23, "rrrrr"],
        [14, 17, "rrrrr"],
        [16, 6, "C"],
        [16, 11, "rrrrr"],
        [16, 40, "G"],
        [17, 4, "111111"],
        [17, 29, "gggg"],
        [17, 38, "111111"],
        [18, 0, "1111111111111111111111111111111111111111111111"],
      ]),
    },
    {
      colors: ["red", "orange", "yellow", "green", "blue"],
      platformRange: 6,
      platformSpeed: 90,
      platformAxis: "x",
      // Portals deliver the player to a narrow, forgiving wall-jump tutorial.
      rows: makeLevelRows(62, 19, [
        [3, 60, "D"],
        [5, 54, "1    111"],
        [7, 50, ">"],
        [7, 54, "1    1"],
        [8, 49, "B"],
        [8, 54, "1    1"],
        [9, 46, "1111111"],
        [9, 54, "1    1"],
        [10, 54, "1    1"],
        [11, 40, "Y"],
        [11, 54, "1    1"],
        [12, 23, "O"],
        [12, 38, "yyyyyy"],
        [12, 54, "1    1"],
        [13, 20, "rrrrr"],
        [13, 28, "M"],
        [13, 54, "1    1"],
        [14, 54, "1 u  1"],
        [15, 8, "C"],
        [15, 14, "rrrrr"],
        [15, 41, "G"],
        [15, 54, "1    1"],
        [16, 5, "1111111"],
        [16, 38, "1111111"],
        [16, 47, "gggg"],
        [16, 54, "1    1"],
        [17, 0, "1111111111111111^^^^^^^^^^^^^^^^^^^^^^111111111111111111111111"],
      ]),
    },
    {
      colors: ["red","orange","yellow","green","blue","indigo"],
      rows: makeLevelRows(79, 20, [
        [0, 46, "11111111111111"],
        [1, 59, "1"],
        [2, 59, "1"],
        [3, 59, "1"],
        [4, 59, "1"],
        [5, 59, "1   I"],
        [5, 75, "D"],
        [6, 40, "Y"],
        [6, 59, "1"],
        [7, 39, "111"],
        [7, 53, ">     1    1iiiiiiiii11111"],
        [8, 52, "B"],
        [8, 59, "1    1"],
        [9, 42, "11"],
        [9, 51, "111     1    1"],
        [10, 47, "y"],
        [10, 59, "1    1"],
        [11, 28, "O"],
        [11, 44, "11 y"],
        [11, 59, "1    1"],
        [12, 26, "rrrrr"],
        [12, 45, "1 y"],
        [12, 59, "1    1"],
        [13, 33, "M"],
        [13, 45, "1 y"],
        [13, 59, "1    1"],
        [14, 20, "rrrrr"],
        [14, 47, "y"],
        [14, 59, "1    1"],
        [15, 47, "y"],
        [15, 59, "1    1"],
        [16, 8, "C     rrrrr"],
        [16, 44, "G  y"],
        [16, 59, "1 u  1"],
        [17, 5, "1111111"],
        [17, 41, "1111111  gggg     1    1"],
        [18, 0, "111111111111111^^^^^^^^^^^^^^^^^^^^^^^^^^1111111111111111111111111111111"],
      ]),
    },
    {
      colors: ["red", "orange", "yellow", "green", "blue", "indigo", "violet"],
      platformRange: 6,
      platformSpeed: 115,
      platformAxis: "y",
      // The complete-mechanics finale: a vertical orange ride, portal entry,
      // tall wall climb, crumble bridge, then a five-second wall-jump finish.
      rows: makeLevelRows(90, 21, [
        [5, 62, "I"],
        [5, 79, "D"],
        [6, 52, ">"],
        [6, 58, "1    1"],
        [6, 80, "1    1"],
        [7, 49, "B"],
        [7, 58, "1    1iiiiiiiiiiiiiiii1    1"],
        [8, 47, "1111111"],
        [8, 58, "1    1"],
        [8, 80, "1    1"],
        [9, 41, "Y"],
        [9, 58, "1    1"],
        [9, 80, "1    1"],
        [10, 39, "yyyyyy"],
        [10, 58, "1    1"],
        [10, 80, "1    1"],
        [11, 35, "M"],
        [11, 58, "1    1"],
        [11, 80, "1    1"],
        [12, 58, "1    1"],
        [12, 80, "1  V 1"],
        [13, 29, "O"],
        [13, 58, "1    1"],
        [13, 80, "1    1"],
        [14, 27, "rrrrr"],
        [14, 58, "1    1"],
        [14, 80, "1111111111"],
        [15, 21, "rrrrr"],
        [15, 58, "1    1"],
        [16, 58, "1    1"],
        [17, 8, "C"],
        [17, 14, "rrrrr"],
        [17, 40, "G"],
        [17, 58, "1 u  1"],
        [18, 5, "1111111"],
        [18, 38, "111111"],
        [18, 48, "gggg"],
        [18, 58, "1    1"],
        [18, 80, "1111111111"],
        [19, 0, "111111111111111^^^^^^^^^^^^^^^^^^^^^^^111111111111111111111111111111111111111111111111111"],
      ]),
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
  indigoUnlocked: false,
  violetUnlocked: false,
  violetTimer: 0,
  crystals: null,
  movingPlatforms: null,
  portals: null,
  indigoTiles: null,
  indigoTileStates: null,
  portalCooldown: 0,
  door: null,
  complete: false,
  completeTimer: 0,
  gameComplete: false,
  failed: false,
  failureMessage: "YOU FELL - RESTARTING",
  restartTimer: 0,
  time: 0,
  runTimer: 0,
  deathCount: 0,

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
    Level.indigoUnlocked = false;
    Level.violetUnlocked = false;
    Level.violetTimer = 0;
    Level.crystals = [];
    Level.movingPlatforms = [];
    Level.portals = [];
    Level.indigoTiles = [];
    Level.indigoTileStates = {};
    Level.portalCooldown = 0;
    Level.door = null;
    Level.complete = false;
    Level.completeTimer = 0;
    Level.gameComplete = false;
    Level.failed = false;
    Level.failureMessage = "YOU FELL - RESTARTING";
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
                  : c === "I"
                    ? "indigo"
                    : c === "V"
                      ? "violet"
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
            axis: definition.platformAxis || "x",
            range:
              TILE_SIZE *
              (definition.platformRange === undefined
                ? 4
                : definition.platformRange),
            speed:
              definition.platformSpeed === undefined
                ? 80
                : definition.platformSpeed,
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
        if (c === "i") {
          var indigoTile = {
            col: colIndex,
            row: rowIndex,
            phase: 0,
            timer: 0,
          };
          Level.indigoTiles.push(indigoTile);
          Level.indigoTileStates[rowIndex * Level.cols + colIndex] = indigoTile;
          return COLOR_INFO.indigo.tileId;
        }
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
    var tileId = Level.map[row][col];
    if (tileId === COLOR_INFO.indigo.tileId) {
      var state = Level.indigoTileStates[row * Level.cols + col];
      if (state && state.phase === 2) return 0;
    }
    return tileId;
  },

  baseTileAt: function (col, row) {
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
    if (color === "indigo") return Level.indigoUnlocked;
    if (color === "violet") return Level.violetUnlocked;
    return false;
  },

  unlockColor: function (color) {
    if (color === "red") Level.redUnlocked = true;
    if (color === "orange") Level.orangeUnlocked = true;
    if (color === "yellow") Level.yellowUnlocked = true;
    if (color === "green") Level.greenUnlocked = true;
    if (color === "blue") Level.blueUnlocked = true;
    if (color === "indigo") Level.indigoUnlocked = true;
    if (color === "violet") Level.violetUnlocked = true;
  },

  updateIndigoTiles: function (hero, dt) {
    if (!Level.indigoUnlocked) return;

    for (var i = 0; i < Level.indigoTiles.length; i++) {
      var tile = Level.indigoTiles[i];
      if (tile.phase === 0) continue;

      tile.timer -= dt;
      if (tile.timer > 0) continue;

      if (tile.phase === 1) {
        tile.phase = 2;
        tile.timer = INDIGO_RESPAWN_DELAY;
      } else {
        var tileRect = {
          x: tile.col * TILE_SIZE,
          y: tile.row * TILE_SIZE,
          w: TILE_SIZE,
          h: TILE_SIZE,
        };
        if (!rectsOverlap(hero, tileRect)) {
          tile.phase = 0;
          tile.timer = 0;
        }
      }
    }

    if (!hero.onGround) return;
    var row = Math.floor((hero.y + hero.h + TILE_EPSILON) / TILE_SIZE);
    var col0 = Math.floor(hero.x / TILE_SIZE);
    var col1 = Math.floor((hero.x + hero.w - TILE_EPSILON) / TILE_SIZE);
    for (var col = col0; col <= col1; col++) {
      if (Level.baseTileAt(col, row) !== COLOR_INFO.indigo.tileId) continue;
      var state = Level.indigoTileStates[row * Level.cols + col];
      if (state && state.phase === 0) {
        state.phase = 1;
        state.timer = INDIGO_CRUMBLE_DELAY;
      }
    }
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
      Sound.play("portal");
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
    if (!Level.complete && !Level.gameComplete) Level.runTimer += dt;

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
          titleScreen = true;
          titleBurstTimer = 0;
          document.body.classList.add("title-screen");
        }
      }
      return;
    }

    if (Level.violetUnlocked) {
      Level.violetTimer -= dt;
      if (Level.violetTimer <= 0) {
        Level.violetTimer = 0;
        Level.fail(hero, "rainbow", "BOOM - RESTARTING");
        return;
      }
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

    Level.updateIndigoTiles(hero, dt);

    if (Level.hasRequiredColors() && rectsOverlap(hero, Level.door)) {
      Level.complete = true;
      Level.completeTimer = LEVEL_COMPLETE_DELAY;
      hero.vx = 0;
      hero.vy = 0;
      Sound.play("complete");
      camera.shake(5, 0.25);
    }
  },

  collectCrystal: function (crystal) {
    var info = COLOR_INFO[crystal.color];
    Level.unlockColor(crystal.color);
    Sound.play("crystal");
    if (crystal.color === "violet") Level.violetTimer = VIOLET_EXPLOSION_TIME;
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

  fail: function (hero, color, message) {
    if (Level.failed || Level.complete) return;
    var rainbowExplosion = color === "rainbow";
    Level.deathCount++;
    Level.failed = true;
    Level.failureMessage = message || "YOU FELL - RESTARTING";
    Level.restartTimer = 0.85;
    hero.vx = 0;
    hero.vy = 0;
    Sound.play("die");
    camera.shake(rainbowExplosion ? 16 : 8, rainbowExplosion ? 0.6 : 0.35);

    var count = rainbowExplosion ? 48 : 14;
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 180 + Math.random() * 320;
      Particles.add(
        hero.x + hero.w / 2,
        rainbowExplosion ? hero.y + hero.h / 2 : hero.y + hero.h,
        rainbowExplosion ? Math.cos(angle) * speed : (Math.random() * 2 - 1) * 150,
        rainbowExplosion ? Math.sin(angle) * speed : -70 - Math.random() * 130,
        (rainbowExplosion ? 0.7 : 0.35) + Math.random() * 0.3,
        (rainbowExplosion ? 5 : 2) + Math.random() * (rainbowExplosion ? 5 : 4),
        rainbowExplosion ? Particles.rainbow[i % Particles.rainbow.length] : color || "#ded8e0"
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
    Level.drawColorTiles(
      ctx,
      cameraX,
      cameraY,
      startCol,
      endCol,
      startRow,
      endRow,
      "indigo",
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
    var baseFilled = info.disappears ? !unlocked : unlocked;
    for (var row = startRow; row < endRow; row++) {
      for (var col = startCol; col < endCol; col++) {
        if (Level.baseTileAt(col, row) !== info.tileId) continue;
        var x = col * TILE_SIZE - cameraX;
        var y = row * TILE_SIZE - cameraY;
        var filled = baseFilled;
        var state = null;
        if (info.crumbles) {
          state = Level.indigoTileStates[row * Level.cols + col];
          if (state && state.phase === 2) filled = false;
        }
        ctx.globalAlpha = filled ? 1 : 0.2;
        if (state && state.phase === 1) {
          ctx.globalAlpha = 0.35 + (Math.sin(Level.time * 35) + 1) * 0.25;
        } else if (state && state.phase === 2) {
          ctx.globalAlpha = 0.06;
        }
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
        } else if (filled && info.crumbles) {
          ctx.globalAlpha = state && state.phase === 1 ? 1 : 0.65;
          ctx.strokeStyle = info.highlight;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 8, y + 3);
          ctx.lineTo(x + 14, y + 12);
          ctx.lineTo(x + 10, y + 19);
          ctx.lineTo(x + 18, y + 29);
          ctx.moveTo(x + 14, y + 12);
          ctx.lineTo(x + 24, y + 8);
          ctx.lineTo(x + 21, y + 19);
          ctx.stroke();
          ctx.lineWidth = 1;
        } else if (!filled) {
          ctx.globalAlpha = state && state.phase === 2 ? 0.08 : 0.55;
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

    var totalSeconds = Math.floor(Level.runTimer * 10) / 10;
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = (totalSeconds % 60).toFixed(1);
    if (seconds.length < 4) seconds = "0" + seconds;

    ctx.textAlign = "left";
    ctx.fillText("TIME " + minutes + ":" + seconds, 16, 26);
    ctx.textAlign = "right";
    ctx.fillText("DEATHS " + Level.deathCount, canvas.width - 16, 26);
    ctx.textAlign = "center";

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
    if (Level.violetUnlocked && !Level.failed) {
      message = "REACH THE DOOR - " + Level.violetTimer.toFixed(1) + "s";
    }
    if (Level.failed) message = Level.failureMessage;
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
