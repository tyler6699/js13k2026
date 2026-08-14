// keys.js - tracks which keys are currently held down
var Keys = {
  down: {},

  isDown: function (code) {
    return !!Keys.down[code];
  },

  init: function () {
    window.addEventListener("keydown", function (e) {
      Keys.down[e.code] = true;
    });
    window.addEventListener("keyup", function (e) {
      Keys.down[e.code] = false;
    });
  },
};
