// debug.js - on-screen readout of hero state, toggle with F1
var Debug = {
  enabled: false,

  init: function () {
    window.addEventListener("keydown", function (e) {
      if (e.code === "F1") {
        Debug.enabled = !Debug.enabled;
        e.preventDefault();
      }
    });
  },

  draw: function (ctx, hero) {
    if (!Debug.enabled) return;

    var lines = [
      "x: " + hero.x.toFixed(1),
      "y: " + hero.y.toFixed(1),
      "vx: " + hero.vx.toFixed(1),
      "vy: " + hero.vy.toFixed(1),
      "facing: " + hero.facing,
      "onGround: " + hero.onGround,
      "groundCoyote: " + hero.groundCoyote.toFixed(2),
      "touchingWallLeft: " + hero.touchingWallLeft,
      "touchingWallRight: " + hero.touchingWallRight,
      "wallCoyoteLeft: " + hero.wallCoyoteLeft.toFixed(2),
      "wallCoyoteRight: " + hero.wallCoyoteRight.toFixed(2),
      "wallJumpLock: " + hero.wallJumpLock.toFixed(2),
      "airJumpsLeft: " + hero.airJumpsLeft,
      "lastJumpType: " + hero.lastJumpType,
      "jumpKeyWasDown: " + hero.jumpKeyWasDown,
      "redUnlocked: " + Level.redUnlocked,
      "orangeUnlocked: " + Level.orangeUnlocked,
      "yellowUnlocked: " + Level.yellowUnlocked,
      "greenUnlocked: " + Level.greenUnlocked,
      "blueUnlocked: " + Level.blueUnlocked,
      "indigoUnlocked: " + Level.indigoUnlocked,
      "violetUnlocked: " + Level.violetUnlocked,
      "violetTimer: " + Level.violetTimer.toFixed(2),
      "level: " + (Level.currentIndex + 1),
      "levelComplete: " + Level.complete,
      "levelFailed: " + Level.failed,
    ];

    var padding = 8;
    var lineHeight = 15;
    var boxWidth = 210;
    var boxHeight = padding * 2 + lineHeight * lines.length;

    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "#000";
    ctx.fillRect(8, 8, boxWidth, boxHeight);

    ctx.globalAlpha = 1;
    ctx.fillStyle = "#0f0";
    ctx.font = "12px monospace";
    ctx.textBaseline = "top";
    for (var i = 0; i < lines.length; i++) {
      var color = lines[i].indexOf(": true") !== -1 ? "#0f0" : "#ccc";
      ctx.fillStyle = color;
      ctx.fillText(lines[i], 8 + padding, 8 + padding + i * lineHeight);
    }
    ctx.restore();
  },
};
