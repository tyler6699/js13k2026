// keys.js - tracks which keys are currently held down
var Keys = {
  down: {},

  isDown: function (code) {
    return !!Keys.down[code];
  },

  init: function () {
    window.addEventListener("keydown", function (e) {
      Keys.down[e.code] = true;

      if (
        e.code === "KeyF" &&
        !e.repeat &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        e.preventDefault();
        toggleFullscreen();
      }
    });
    window.addEventListener("keyup", function (e) {
      Keys.down[e.code] = false;
    });

    var buttons = document.querySelectorAll("[data-key]");
    for (var i = 0; i < buttons.length; i++) {
      Keys.bindTouchButton(buttons[i]);
    }

    document
      .getElementById("fullscreen-button")
      .addEventListener("click", function (e) {
        e.preventDefault();
        toggleFullscreen();
      });

    window.addEventListener("blur", function () {
      for (var code in Keys.down) Keys.down[code] = false;
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active");
      }
    });
  },

  bindTouchButton: function (button) {
    var code = button.getAttribute("data-key");

    function press(e) {
      e.preventDefault();
      button.setPointerCapture(e.pointerId);
      Keys.down[code] = true;
      button.classList.add("active");
    }

    function release(e) {
      e.preventDefault();
      Keys.down[code] = false;
      button.classList.remove("active");
    }

    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  },
};
