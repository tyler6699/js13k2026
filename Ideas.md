Rainbow color mechanics are a great fit for a platformer, and they play nicely with the wall-jump/double-jump system you've already got. A few directions, roughly ordered by how much they'd cost you in that 13kb budget:

1. Color-matched platforms (cleanest for js13k)
Your unicorn's horn cycles through the 7 spectrum colors (tap a key, or it auto-cycles on a timer). Platforms are tinted one of the 7 colors and are only solid when your current color matches — everything else you fall straight through. This is basically a reskin of your existing isSolidTileId check (swap it for tile.color === hero.currentColor), so it's cheap to build and instantly reads as "rainbow game." Levels become color-sequencing puzzles: time your color cycle to catch the right platform mid-jump.

2. Rainbow trail as platform
The unicorn leaves a solid rainbow trail behind it that only lasts a few seconds — so you can double back over your own path, or use it to build a bridge across a gap by looping around. Visually gorgeous (a trailing rainbow ribbon is basically free art via a gradient stroke), and it turns your existing double-jump/wall-jump moveset into trail-drawing tools rather than just traversal.

3. Color-drain hazards
Grey "storm cloud" enemies suck the color out of the world (and out of you) on contact — briefly disabling your double jump or wall jump until you touch a color orb to refill. Good tension/reward loop, reuses your airJumpsLeft system almost as-is (just add a "disabled" state), and gives you an obvious visual language: colorful = powered up, grey = weakened.

4. Restore color to a greyscale world
Level starts desaturated; running through color orbs (or standing on colored platforms) permanently repaints nearby tiles/background from grey to full color. Great "wow" progression moment (think Kirby's Epic Yarn/Mario Odyssey color reveals) but is the most art/rendering work of the bunch — probably not worth it at 13kb unless color is just a CSS filter you crossfade.

5. Horn charge = pick your power
Collect colored gems to "load" a color into your horn, then spend it for a themed ability tied to that color — red for a dash, blue for a water-breath/swim state, yellow to light up hidden platforms, etc. Thematically rich (full ROYGBIV kit) but is real scope: 7 distinct abilities is a lot of code and balancing for a jam.

My pick for you: #1 (color-matched platforms), optionally layered with #3 (color-drain hazards) once the core loop feels good — both are cheap in code, reuse systems you've already built, and the "which color am I right now" readout is exactly what your debug overlay pattern already does well.

Want me to prototype #1 into the current build — add a color field to tiles, a horn-color cycle on the hero, and update the level data/collision to match?
