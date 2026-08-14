// level.js - a tiny test level. Replace this grid with your own later.
// 0 = empty space, 1 = solid tile
var Level = {
  cols: 40,
  rows: 12,
  map: null,

  init: function () {
    var rows = [
      "                                        ",
      "                                        ",
      "                           1 1          ",
      "                  1        1 1          ",
      "                  111      1 1          ",
      "                  1        1 1          ",
      "  11       111    1        1 1          ",
      "  11       1 1             1 1          ",
      "  11                                    ",
      "1111111  1111111111111111111111111111111",
      "1111111  1111111111111111111111111111111",
      "1111111111111111111111111111111111111111",
    ];

    Level.map = rows.map(function (row) {
      var cells = row.split("");
      while (cells.length < Level.cols) cells.push(" ");
      return cells.map(function (c) {
        return c === "1" ? 1 : 0;
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
    if (row < 0 || row >= Level.rows || col < 0 || col >= Level.cols) return 1; // treat out of bounds as solid
    return Level.map[row][col];
  },

  isSolidAtPixel: function (x, y) {
    var col = Math.floor(x / TILE_SIZE);
    var row = Math.floor(y / TILE_SIZE);
    return isSolidTileId(Level.tileAt(col, row));
  },

  draw: function (ctx, camera) {
    // Fractional camera zoom can expose the background between separately
    // rasterized rectangles. Build one solid shape and overlap each tile by
    // one screen pixel so neighbouring tiles remain seamless at every zoom.
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
        var id = Level.tileAt(col, row);
        if (id !== 1) continue;
        ctx.rect(
          col * TILE_SIZE - cameraX,
          row * TILE_SIZE - cameraY,
          TILE_SIZE + seamOverlap,
          TILE_SIZE + seamOverlap
        );
      }
    }
    ctx.fillStyle = "#000";
    ctx.fill();
  },
};
