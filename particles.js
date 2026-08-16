// particles.js - tiny pooled-style movement effects
var Particles = {
  items: [],
  wallTimer: 0,
  rainbowIndex: 0,
  rainbow: ["#ff304f", "#e66a19", "#ffd43b", "#34c759", "#0a84ff", "#af52de"],

  nextRainbow: function () {
    var colorCount = Level.blueUnlocked
      ? 5
      : Level.greenUnlocked
        ? 4
        : Level.yellowUnlocked
        ? 3
        : Level.orangeUnlocked
          ? 2
          : Level.redUnlocked
            ? 1
            : 0;
    if (colorCount === 0) return "#c7c2c8";
    var color = Particles.rainbow[Particles.rainbowIndex % colorCount];
    Particles.rainbowIndex = (Particles.rainbowIndex + 1) % colorCount;
    return color;
  },

  bounce: function (hero) {
    for (var i = 0; i < 18; i++) {
      var direction = Math.random() * 2 - 1;
      Particles.add(
        hero.x + hero.w / 2 + direction * hero.w,
        hero.y + hero.h,
        direction * (120 + Math.random() * 180),
        -90 - Math.random() * 230,
        0.45 + Math.random() * 0.25,
        3 + Math.random() * 4,
        i % 3 === 0 ? COLOR_INFO.green.highlight : COLOR_INFO.green.color
      );
    }
  },

  portal: function (x, y) {
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      Particles.add(
        x,
        y,
        Math.cos(angle) * (70 + Math.random() * 90),
        Math.sin(angle) * (70 + Math.random() * 90),
        0.3 + Math.random() * 0.2,
        2 + Math.random() * 3,
        i % 3 === 0 ? COLOR_INFO.blue.highlight : COLOR_INFO.blue.color
      );
    }
  },

  add: function (x, y, vx, vy, life, size, color) {
    Particles.items.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      life: life,
      maxLife: life,
      size: size,
      color: color,
    });
  },

  burst: function (x, y, count, speed, upward) {
    for (var i = 0; i < count; i++) {
      var direction = Math.random() * 2 - 1;
      Particles.add(
        x + direction * 30,
        y,
        direction * speed * (0.5 + Math.random() * 0.65),
        -(upward + Math.random() * speed * 0.55),
        0.28 + Math.random() * 0.2,
        2 + Math.random() * 3,
        Particles.nextRainbow()
      );
    }
  },

  jump: function (hero, type) {
    var count = type === "air" ? 10 : 6;
    Particles.burst(hero.x + hero.w / 2, hero.y + hero.h, count, 100, 14);
  },

  land: function (hero, impact) {
    var count = Math.round(clamp(impact / 55, 6, 14));
    Particles.burst(hero.x + hero.w / 2, hero.y + hero.h, count, 135, 24);
  },

  wallSlide: function (hero, side, dt) {
    Particles.wallTimer -= dt;
    if (Particles.wallTimer > 0) return;
    Particles.wallTimer = 0.055;
    var x = side < 0 ? hero.x : hero.x + hero.w;
    Particles.add(
      x,
      hero.y + hero.h * 0.7,
      -side * (40 + Math.random() * 20),
      15 + Math.random() * 20,
      0.28 + Math.random() * 0.12,
      3,
      Particles.nextRainbow()
    );
  },

  update: function (dt) {
    for (var i = Particles.items.length - 1; i >= 0; i--) {
      var p = Particles.items[i];
      p.life -= dt;
      if (p.life <= 0) {
        Particles.items.splice(i, 1);
        continue;
      }
      p.vy += 500 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.05, dt);
    }
  },

  draw: function (ctx, camera) {
    var cameraX = Math.round(camera.x);
    var cameraY = Math.round(camera.y);
    for (var i = 0; i < Particles.items.length; i++) {
      var p = Particles.items[i];
      var fade = p.life / p.maxLife;
      ctx.globalAlpha = fade;
      ctx.fillStyle = p.color;
      var size = Math.max(1, Math.round(p.size * fade));
      ctx.fillRect(Math.round(p.x) - cameraX, Math.round(p.y) - cameraY, size, size);
    }
    ctx.globalAlpha = 1;
  },
};
