// tile.js - tile size + which tile ids are solid
var TILE_SIZE = 32;
var TILE_EPSILON = 0.001;

function isSolidTileId(id) {
  if (id === 1) return true;
  if (id === 2) return Level.redUnlocked;
  if (id === 4) return Level.orangeUnlocked;
  return false;
}
