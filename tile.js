// tile.js - tile size + which tile ids are solid
var TILE_SIZE = 32;
var TILE_EPSILON = 0.001;

// 0 = empty, 1 = solid ground
var SOLID_TILES = { 1: true };

function isSolidTileId(id) {
  return !!SOLID_TILES[id];
}
