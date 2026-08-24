// Song data
var songLoaded = false;
var musicRequested = false;
var musicStarted = false;
var songBuffer;
var songPlayer;
var musicSource;
var musicGain;
var song = {
  songData: [
    {
      i: [3,162,128,0,3,0,128,0,0,0,5,6,45,0,0,0,0,6,1,2,255,0,6,69,0,6,0,6],
      p: [1,2,1,2,1,2],
      c: [
        {n: [121,0,121,121,121,0,121,121,0,116,121,116,123,125,116,121,0,120,120,0,120,0,120,120,0,111,115,111,118,120,123,125],f: []},
        {n: [118,0,118,118,118,0,118,118,0,113,118,113,120,121,123,115,0,115,115,0,115,0,115,115,0,113,111,113,115,116,118,120],f: []}
      ]
    },
    {
      i: [0,119,128,1,3,0,128,0,0,0,0,0,43,0,0,0,0,6,1,2,255,117,3,212,0,6,0,6],
      p: [1,1,1,1,1,1],
      c: [{n: [125,0,0,125,0,0,125,125,0,0,125,0,0,0,0,0,0,0,125,125,0,0,0,125,0,0,125],f: []}]
    },
    {
      i: [2,0,128,0,3,0,128,0,0,196,5,6,41,0,0,0,0,6,1,2,149,0,0,116,0,6,27,6],
      p: [1,1,1,1,1,1],
      c: [{n: [0,0,0,0,137,0,0,0,0,0,0,0,137,0,0,0,0,0,0,0,137,0,0,0,0,0,0,0,137,0,137,137],f: []}]
    },
    {
      i: [2,0,128,0,3,0,128,0,0,131,5,6,29,0,0,0,0,6,1,1,135,0,0,32,147,6,92,2],
      p: [1,1,1,1,1,1],
      c: [{n: [185,0,0,185,0,0,185,0,0,185,0,0,185,185,0,0,185,0,0,185,0,0,185,0,0,185,0,0,185,185],f: []}]
    },
    {
      i: [2,100,128,0,1,201,128,0,0,0,5,6,44,0,0,0,0,6,1,2,83,0,0,5,147,6,45,6],
      p: [1,2,1,2,1,2],
      c: [
        {n: [137,137,137,0,137,137,0,137,0,137,137,0,137,137,0,137,0,123,123,0,135,135,0,135,0,135,135,0,135,135,0,135,140,140,140,0,140,140,0,140,0,140,140,0,140,140,0,140,0,127,127,0,139,139,0,139,0,139,139,0,139,139,0,139,144,144,144,0,144,144,0,144,0,144,144,0,144,144,0,144,0,130,130,0,142,142,0,142,0,142,142,0,142,142,0,142,147,147,147,0,147,147,0,147,0,147,147,0,147,147,0,147,0,132,132,0,144,144,0,144,0,144,144,0,144,144,0,144],f: []},
        {n: [137,137,137,0,137,137,0,137,0,137,137,0,137,137,0,137,0,123,123,0,135,135,0,135,0,135,135,0,135,135,0,135,140,140,140,0,140,140,0,140,0,140,140,0,140,140,0,140,0,127,127,0,139,139,0,139,0,139,139,0,139,139,0,139,142,142,142,0,142,142,0,142,0,142,142,0,142,142,0,142,0,130,130,0,142,142,0,142,0,142,142,0,142,142,0,142,145,145,145,0,145,145,0,145,0,145,145,0,145,145,0,145,0,133,133,0,145,145,0,145,0,145,145,0,145,145,0,145],f: []}
      ]
    },
    {
      i: [1,100,128,0,3,201,128,0,0,0,5,6,58,0,0,0,0,6,1,2,188,53,0,32,0,6,27,6],
      p: [1,2,3,4,1,2],
      c: [
        {n: [0,0,0,0,149,0,0,0,152,0,0,0,157,0,0,0,159,0,0,0,161,0,159,0,0,0,152,0,156,0,157],f: []},
        {n: [0,0,157,0,156,0,152,0,149,0,0,0,147,0,149,0,151,0,152,0,151,0,147,0,142,140,139,140,142,144,145,147],f: []},
        {n: [0,0,0,0,149,0,0,0,152,0,0,0,157,0,0,0,159,0,0,0,161,0,159,0,0,0,152,0,163,0,164],f: []},
        {n: [0,0,166,0,164,0,163,0,159,0,0,0,0,0,164,0,163,0,159,0,156,0,0,0,154,156,157,159,161,156,152,151],f: []}
      ]
    }
  ],
  rowLen: 5088,
  patternLen: 32,
  endPattern: 5,
  numChannels: 6
};


/* -*- mode: javascript; tab-width: 4; indent-tabs-mode: nil; -*-
 *
 * Copyright (c) 2011-2013 Marcus Geelnard
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 *
 * 3. This notice may not be removed or altered from any source
 *    distribution.
 *
 */

"use strict";
var CPlayer = function() {

    //--------------------------------------------------------------------------
    // Private methods
    //--------------------------------------------------------------------------

    // Oscillators
    var osc_sin = function(value) {
        return Math.sin(value * 6.283184);
    };

    var osc_saw = function(value) {
        return 2 * (value % 1) - 1;
    };

    var osc_square = function(value) {
        return (value % 1) < 0.5 ? 1 : -1;
    };

    var osc_tri = function(value) {
        var v2 = (value % 1) * 4;
        if (v2 < 2) return v2 - 1;
        return 3 - v2;
    };

    var getnotefreq = function(n) {
        // 174.61.. / 44100 = 0.003959503758 (F3)
        return 0.003959503758 * Math.pow(2, (n - 128) / 12);
    };

    var createNote = function(instr, n, rowLen) {
        var osc1 = mOscillators[instr.i[0]],
            o1vol = instr.i[1],
            o1xenv = instr.i[3],
            osc2 = mOscillators[instr.i[4]],
            o2vol = instr.i[5],
            o2xenv = instr.i[8],
            noiseVol = instr.i[9],
            attack = instr.i[10] * instr.i[10] * 4,
            sustain = instr.i[11] * instr.i[11] * 4,
            release = instr.i[12] * instr.i[12] * 4,
            releaseInv = 1 / release,
            arp = instr.i[13],
            arpInterval = rowLen * Math.pow(2, 2 - instr.i[14]);

        var noteBuf = new Int32Array(attack + sustain + release);

        // Re-trig oscillators
        var c1 = 0,
            c2 = 0;

        // Local variables.
        var j, j2, e, t, rsample, o1t, o2t;

        // Generate one note (attack + sustain + release)
        for (j = 0, j2 = 0; j < attack + sustain + release; j++, j2++) {
            if (j2 >= 0) {
                // Switch arpeggio note.
                arp = (arp >> 8) | ((arp & 255) << 4);
                j2 -= arpInterval;

                // Calculate note frequencies for the oscillators
                o1t = getnotefreq(n + (arp & 15) + instr.i[2] - 128);
                o2t = getnotefreq(n + (arp & 15) + instr.i[6] - 128) * (1 + 0.0008 * instr.i[7]);
            }

            // Envelope
            e = 1;
            if (j < attack) {
                e = j / attack;
            } else if (j >= attack + sustain) {
                e -= (j - attack - sustain) * releaseInv;
            }

            // Oscillator 1
            t = o1t;
            if (o1xenv) {
                t *= e * e;
            }
            c1 += t;
            rsample = osc1(c1) * o1vol;

            // Oscillator 2
            t = o2t;
            if (o2xenv) {
                t *= e * e;
            }
            c2 += t;
            rsample += osc2(c2) * o2vol;

            // Noise oscillator
            if (noiseVol) {
                rsample += (2 * Math.random() - 1) * noiseVol;
            }

            // Add to (mono) channel buffer
            noteBuf[j] = (80 * rsample * e) | 0;
        }

        return noteBuf;
    };


    //--------------------------------------------------------------------------
    // Private members
    //--------------------------------------------------------------------------

    // Array of oscillator functions
    var mOscillators = [
        osc_sin,
        osc_square,
        osc_saw,
        osc_tri
    ];

    // Private variables set up by init()
    var mSong, mLastRow, mCurrentCol, mNumWords, mMixBuf;


    //--------------------------------------------------------------------------
    // Initialization
    //--------------------------------------------------------------------------

    this.init = function(song) {
        // Define the song
        mSong = song;

        // Init iteration state variables
        mLastRow = song.endPattern;
        mCurrentCol = 0;

        // Prepare song info
        mNumWords = song.rowLen * song.patternLen * (mLastRow + 1) * 2;

        // Create work buffer (initially cleared)
        mMixBuf = new Int32Array(mNumWords);
    };


    //--------------------------------------------------------------------------
    // Public methods
    //--------------------------------------------------------------------------

    // Generate audio data for a single track
    this.generate = function() {
        // Local variables
        var i, j, b, p, row, col, n, cp,
            k, t, lfor, e, x, rsample, rowStartSample, f, da;

        // Put performance critical items in local variables
        var chnBuf = new Int32Array(mNumWords),
            instr = mSong.songData[mCurrentCol],
            rowLen = mSong.rowLen,
            patternLen = mSong.patternLen;

        // Clear effect state
        var low = 0,
            band = 0,
            high;
        var lsample, filterActive = false;

        // Clear note cache.
        var noteCache = [];

        // Patterns
        for (p = 0; p <= mLastRow; ++p) {
            cp = instr.p[p];

            // Pattern rows
            for (row = 0; row < patternLen; ++row) {
                // Execute effect command.
                var cmdNo = cp ? instr.c[cp - 1].f[row] : 0;
                if (cmdNo) {
                    instr.i[cmdNo - 1] = instr.c[cp - 1].f[row + patternLen] || 0;

                    // Clear the note cache since the instrument has changed.
                    if (cmdNo < 16) {
                        noteCache = [];
                    }
                }

                // Put performance critical instrument properties in local variables
                var oscLFO = mOscillators[instr.i[15]],
                    lfoAmt = instr.i[16] / 512,
                    lfoFreq = Math.pow(2, instr.i[17] - 9) / rowLen,
                    fxLFO = instr.i[18],
                    fxFilter = instr.i[19],
                    fxFreq = instr.i[20] * 43.23529 * 3.141592 / 44100,
                    q = 1 - instr.i[21] / 255,
                    dist = instr.i[22] * 1e-5,
                    drive = instr.i[23] / 32,
                    panAmt = instr.i[24] / 512,
                    panFreq = 6.283184 * Math.pow(2, instr.i[25] - 9) / rowLen,
                    dlyAmt = instr.i[26] / 255,
                    dly = instr.i[27] * rowLen & ~1; // Must be an even number

                // Calculate start sample number for this row in the pattern
                rowStartSample = (p * patternLen + row) * rowLen;

                // Generate notes for this pattern row
                for (col = 0; col < 4; ++col) {
                    n = cp ? instr.c[cp - 1].n[row + col * patternLen] : 0;
                    if (n) {
                        if (!noteCache[n]) {
                            noteCache[n] = createNote(instr, n, rowLen);
                        }

                        // Copy note from the note cache
                        var noteBuf = noteCache[n];
                        for (j = 0, i = rowStartSample * 2; j < noteBuf.length; j++, i += 2) {
                            chnBuf[i] += noteBuf[j];
                        }
                    }
                }

                // Perform effects for this pattern row
                for (j = 0; j < rowLen; j++) {
                    // Dry mono-sample
                    k = (rowStartSample + j) * 2;
                    rsample = chnBuf[k];

                    // We only do effects if we have some sound input
                    if (rsample || filterActive) {
                        // State variable filter
                        f = fxFreq;
                        if (fxLFO) {
                            f *= oscLFO(lfoFreq * k) * lfoAmt + 0.5;
                        }
                        f = 1.5 * Math.sin(f);
                        low += f * band;
                        high = q * (rsample - band) - low;
                        band += f * high;
                        rsample = fxFilter == 3 ? band : fxFilter == 1 ? high : low;

                        // Distortion
                        if (dist) {
                            rsample *= dist;
                            rsample = rsample < 1 ? rsample > -1 ? osc_sin(rsample * .25) : -1 : 1;
                            rsample /= dist;
                        }

                        // Drive
                        rsample *= drive;

                        // Is the filter active (i.e. still audiable)?
                        filterActive = rsample * rsample > 1e-5;

                        // Panning
                        t = Math.sin(panFreq * k) * panAmt + 0.5;
                        lsample = rsample * (1 - t);
                        rsample *= t;
                    } else {
                        lsample = 0;
                    }

                    // Delay is always done, since it does not need sound input
                    if (k >= dly) {
                        // Left channel = left + right[-p] * t
                        lsample += chnBuf[k - dly + 1] * dlyAmt;

                        // Right channel = right + left[-p] * t
                        rsample += chnBuf[k - dly] * dlyAmt;
                    }

                    // Store in stereo channel buffer (needed for the delay effect)
                    chnBuf[k] = lsample | 0;
                    chnBuf[k + 1] = rsample | 0;

                    // ...and add to stereo mix buffer
                    mMixBuf[k] += lsample | 0;
                    mMixBuf[k + 1] += rsample | 0;
                }
            }
        }

        // Next iteration. Return progress (1.0 == done!).
        mCurrentCol++;
        return mCurrentCol / mSong.numChannels;
    };

    // Copy the generated stereo mix directly into a Web Audio buffer.
    this.createAudioBuffer = function(audioContext) {
        var buffer = audioContext.createBuffer(2, mNumWords / 2, 44100);
        var left = buffer.getChannelData(0);
        var right = buffer.getChannelData(1);
        for (var i = 0, frame = 0; i < mNumWords; i += 2, frame++) {
            left[frame] = Math.max(-1, Math.min(1, mMixBuf[i] / 32768));
            right[frame] = Math.max(-1, Math.min(1, mMixBuf[i + 1] / 32768));
        }
        return buffer;
    };

    // Get n samples of wave data at time t [s]. Wave data in range [-2,2].
    this.getData = function(t, n) {
        var i = 2 * Math.floor(t * 44100);
        var d = new Array(n);
        for (var j = 0; j < 2 * n; j += 1) {
            var k = i + j;
            d[j] = t > 0 && k < mMixBuf.length ? mMixBuf[k] / 32768 : 0;
        }
        return d;
    };
};

function genAudio() {
    songPlayer = new CPlayer();
    songPlayer.init(song);

    var generationTimer = setInterval(function() {
        songLoaded = songPlayer.generate() >= 1;
        if (songLoaded) {
            clearInterval(generationTimer);
            if (musicRequested) prepareMusic();
        }
    }, 0);
}

function startMusic() {
    musicRequested = true;
    if (musicStarted) return;
    if (!songBuffer) {
        prepareMusic();
        return;
    }

    musicSource = Sound.context.createBufferSource();
    musicGain = Sound.context.createGain();
    musicSource.buffer = songBuffer;
    musicSource.loop = true;
    // The six-layer reference-style mix is intentionally dense.
    musicGain.gain.value = 0.35;
    musicSource.connect(musicGain);
    musicGain.connect(Sound.context.destination);
    musicSource.start();
    musicStarted = true;
}

function prepareMusic() {
    if (!songLoaded || !songPlayer || !Sound.context || songBuffer) return;
    songBuffer = songPlayer.createAudioBuffer(Sound.context);
    songPlayer = null;
    if (musicRequested) startMusic();
}
