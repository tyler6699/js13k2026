// keys.js - tracks which keys are currently held down
var Keys = {
  down: {},

  isDown: function (code) {
    return !!Keys.down[code];
  },

  init: function () {
    function preventTouchGesture(e) {
      e.preventDefault();
    }

    var touchOptions = { passive: false };
    document.addEventListener("touchstart", preventTouchGesture, touchOptions);
    document.addEventListener("touchmove", preventTouchGesture, touchOptions);
    document.addEventListener("touchend", preventTouchGesture, touchOptions);
    document.addEventListener("gesturestart", preventTouchGesture, touchOptions);
    document.addEventListener("gesturechange", preventTouchGesture, touchOptions);

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

      var skipDirection =
        e.key === "+" || e.code === "NumpadAdd"
          ? 1
          : e.key === "-" || e.code === "NumpadSubtract"
            ? -1
            : 0;
      if (
        skipDirection !== 0 &&
        !e.repeat &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        e.preventDefault();
        Level.skipLevel(hero, skipDirection);
      }
    });
    window.addEventListener("keyup", function (e) {
      Keys.down[e.code] = false;
    });

    var buttons = document.querySelectorAll("[data-key]");
    for (var i = 0; i < buttons.length; i++) {
      Keys.bindTouchButton(buttons[i]);
    }

    var fullscreenButton = document.getElementById("fullscreen-button");
    var standalone =
      window.navigator.standalone ||
      window.matchMedia("(display-mode: standalone)").matches;
    fullscreenButton.hidden = standalone;
    fullscreenButton.addEventListener("pointerup", function (e) {
      e.preventDefault();
      toggleFullscreen();
    });

    document
      .getElementById("fullscreen-help-close")
      .addEventListener("pointerup", function (e) {
        e.preventDefault();
        document.getElementById("fullscreen-help").hidden = true;
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
