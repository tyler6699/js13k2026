// camera.js - follows a target entity, clamped to level bounds
var CAMERA_ZOOM_IN = 1.22;
var CAMERA_ZOOM_OUT = 0.92;
var CAMERA_ZOOM_MAX_SPEED = 520;
var CAMERA_SPEED_EASE = 2.4;
var CAMERA_ZOOM_EASE = 2.8;

function Camera(viewWidth, viewHeight) {
  this.x = 0;
  this.y = 0;
  this.screenWidth = viewWidth;
  this.screenHeight = viewHeight;
  this.zoom = CAMERA_ZOOM_IN;
  this.zoomSpeed = 0;
  this.viewWidth = viewWidth / this.zoom;
  this.viewHeight = viewHeight / this.zoom;
  this.followSpeed = 8;
  this.shakeTime = 0;
  this.shakeDuration = 0;
  this.shakeStrength = 0;
  this.shakeX = 0;
  this.shakeY = 0;
}

Camera.prototype.resize = function (screenWidth, screenHeight) {
  this.screenWidth = screenWidth;
  this.screenHeight = screenHeight;
  this.viewWidth = screenWidth / this.zoom;
  this.viewHeight = screenHeight / this.zoom;
};

Camera.prototype.follow = function (target, dt) {
  var speed = Math.sqrt(target.vx * target.vx + target.vy * target.vy);
  // Filter velocity before converting it to zoom. Collisions and input changes
  // can alter the raw speed in one frame; carrying that through directly makes
  // the camera feel twitchy even when the zoom value itself is eased.
  var speedBlend = 1 - Math.exp(-CAMERA_SPEED_EASE * dt);
  this.zoomSpeed += (speed - this.zoomSpeed) * speedBlend;
  var speedAmount = clamp(this.zoomSpeed / CAMERA_ZOOM_MAX_SPEED, 0, 1);
  // Smoothstep keeps the close camera steady at low speeds, then opens the
  // view more decisively as the hero approaches full movement speed.
  speedAmount = speedAmount * speedAmount * (3 - 2 * speedAmount);
  var targetZoom = CAMERA_ZOOM_IN + (CAMERA_ZOOM_OUT - CAMERA_ZOOM_IN) * speedAmount;
  var zoomBlend = 1 - Math.exp(-CAMERA_ZOOM_EASE * dt);
  this.zoom += (targetZoom - this.zoom) * zoomBlend;
  this.viewWidth = this.screenWidth / this.zoom;
  this.viewHeight = this.screenHeight / this.zoom;

  var targetX = target.x + target.w / 2 - this.viewWidth / 2;
  var targetY = target.y + target.h / 2 - this.viewHeight / 2;
  var maxX = Math.max(0, Level.widthPx() - this.viewWidth);
  var maxY = Math.max(0, Level.heightPx() - this.viewHeight);
  var blend = 1 - Math.exp(-this.followSpeed * dt);

  targetX = clamp(targetX, 0, maxX);
  targetY = clamp(targetY, 0, maxY);
  this.x = clamp(this.x + (targetX - this.x) * blend, 0, maxX);
  this.y = clamp(this.y + (targetY - this.y) * blend, 0, maxY);
};

Camera.prototype.shake = function (strength, duration) {
  this.shakeStrength = Math.max(this.shakeStrength, strength);
  this.shakeDuration = Math.max(this.shakeDuration, duration);
  this.shakeTime = Math.max(this.shakeTime, duration);
};

Camera.prototype.updateShake = function (dt) {
  if (this.shakeTime <= 0) {
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeStrength = 0;
    return;
  }

  this.shakeTime = Math.max(0, this.shakeTime - dt);
  var fade = this.shakeTime / this.shakeDuration;
  var strength = this.shakeStrength * fade * fade;
  this.shakeX = (Math.random() * 2 - 1) * strength;
  this.shakeY = (Math.random() * 2 - 1) * strength;
};
