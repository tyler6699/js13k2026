// sound.js - tiny generated Web Audio effects (no audio files required)
var Sound = {
  context: null,

  init: function () {
    // Creating/resuming audio from an input event satisfies browser autoplay rules.
    window.addEventListener("keydown", Sound.unlock);
    window.addEventListener("pointerdown", Sound.unlock);
  },

  unlock: function () {
    if (!Sound.context) {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      Sound.context = new AudioContext();
    }
    if (Sound.context.state === "suspended") Sound.context.resume();
  },

  tone: function (startFrequency, endFrequency, duration, type, delay, volume) {
    var audio = Sound.context;
    if (!audio) return;
    var start = audio.currentTime + (delay || 0);
    var oscillator = audio.createOscillator();
    var gain = audio.createGain();
    oscillator.type = type || "sine";
    oscillator.frequency.setValueAtTime(startFrequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
  },

  noise: function (duration, volume) {
    var audio = Sound.context;
    if (!audio) return;
    var buffer = audio.createBuffer(1, audio.sampleRate * duration, audio.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    var source = audio.createBufferSource();
    var gain = audio.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
    source.connect(gain);
    gain.connect(audio.destination);
    source.start();
  },

  play: function (name, volume) {
    // Gameplay can trigger sounds (such as the initial landing) before the
    // player interacts. Never create, resume, or start audio in that state.
    if (!Sound.context || Sound.context.state !== "running") return;
    var v = (volume === undefined ? 1 : volume) * 0.16;
    switch (name) {
      case "jump":
        Sound.tone(190, 430, 0.12, "square", 0, v);
        break;
      case "air":
        Sound.tone(310, 720, 0.15, "triangle", 0, v);
        Sound.tone(620, 880, 0.1, "sine", 0.04, v * 0.45);
        break;
      case "wall":
        Sound.tone(250, 520, 0.1, "sawtooth", 0, v * 0.7);
        break;
      case "bounce":
        Sound.tone(120, 760, 0.24, "square", 0, v);
        break;
      case "land":
        Sound.tone(100, 55, 0.07, "triangle", 0, v * 0.7);
        break;
      case "crystal":
        Sound.tone(520, 620, 0.12, "sine", 0, v);
        Sound.tone(780, 940, 0.16, "sine", 0.07, v);
        break;
      case "portal":
        Sound.tone(180, 900, 0.22, "sine", 0, v);
        Sound.tone(700, 160, 0.25, "triangle", 0.03, v * 0.7);
        break;
      case "complete":
        Sound.tone(523, 523, 0.24, "triangle", 0, v);
        Sound.tone(659, 659, 0.24, "triangle", 0.1, v);
        Sound.tone(784, 1047, 0.38, "triangle", 0.2, v);
        break;
      case "die":
        Sound.tone(260, 55, 0.38, "sawtooth", 0, v);
        Sound.noise(0.16, v * 0.7);
    }
  },
};
