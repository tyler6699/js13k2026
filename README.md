# JS13K 2026 Rainbow Platformer

A fast, momentum-focused browser platformer about restoring the colours of the rainbow. Collect each level's crystals to activate its colour mechanics, then reach the door.

The game is written in plain JavaScript and renders to a fixed `800 × 480` canvas. It includes keyboard and touch controls, responsive scaling, wall jumps, a double jump, moving platforms, hazards, particles, camera effects, fullscreen support, and six hand-authored levels.

## Playing the game

Collect the crystals in the order shown by the HUD. The exit door opens after every colour listed for the current level has been collected.

Falling onto spikes restarts the level. Completed levels advance automatically after a short delay.

### Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | `←` / `→` or `A` / `D` | Direction pad |
| Jump | `Space`, `↑`, or `W` | **JUMP** button |
| Double jump | Press jump again while airborne | Press **JUMP** again |
| Wall jump | Press jump while sliding against a wall | Press **JUMP** while against a wall |
| Toggle fullscreen | `F` | **FULL** button |
| Next level | `+` or numpad `+` | — |
| Previous level | `-` or numpad `-` | — |
| Toggle debug display | `F1` | — |

On iPhone versions that do not allow page fullscreen, the **FULL** button explains how to launch the game in standalone mode using **Share → Add to Home Screen**.

## Colour mechanics

| Colour | Crystal | Map block | Behavior |
| --- | --- | --- | --- |
| Red | `C` | `r` | Red blocks begin ghosted and non-solid, then become solid. |
| Orange | `O` | `o` / `M` | Orange blocks become solid and orange moving platforms begin moving. |
| Yellow | `Y` | `y` | Yellow blocks begin solid, then disappear and become non-solid—the inverse of red. |
| Green | `G` | `g` | Green launch pads become solid. Landing from above produces an automatic `850 px/s` super-bounce and refreshes the double jump. |
| Blue | `B` | `u`, `v`, `<`, `>` | Linked portals activate. Entering one preserves speed and redirects it through its partner. |
| Indigo | `I` | `i` | Indigo blocks become solid. Stepping on one warns for `0.3s`, hides it for `1.5s`, then safely restores it. |

The player, trail, particles, HUD, and exit door gain each restored colour as the level progresses.

## Running locally

There is no build step. Serve the repository over HTTP and open it in a browser:

```sh
python -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

Opening `index.html` directly may work for basic play, but a local server more closely matches deployment behavior and is required by some browser APIs.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Loads the game scripts and defines the canvas and mobile controls. |
| `game.js` | Creates the canvas, runs the update/draw loop, and handles fullscreen. |
| `level.js` | Defines level maps, crystals, colour state, platforms, portals, hazards, doors, and HUD text. |
| `tile.js` | Defines tile size and dynamic solid-tile rules. |
| `entity.js` | Provides tile collision and movement resolution. |
| `hero.js` | Implements player movement, jumps, green bouncing, animation, and drawing. |
| `particles.js` | Implements movement, crystal, bounce, and portal effects. |
| `camera.js` | Follows the player and applies zoom and shake. |
| `keys.js` | Handles keyboard and touch input. |
| `debug.js` | Draws the optional `F1` state display. |
| `game.css` | Scales the fixed game canvas and lays out touch controls. |

## Creating levels

Levels are objects in the `Level.levels` array near the top of `level.js`:

```js
{
  colors: ["red", "orange"],
  rows: [
    "",
    "",
    "                         D",
    "                  O",
    "             C   ooooo",
    "          111 rrrrr",
    "1111111111111^^^^^^^^^^^^^",
  ],
},
```

### Level properties

#### `colors`

The ordered list of crystals required to open the door. It also controls the HUD's crystal prompts.

```js
colors: ["red", "orange", "yellow", "green", "blue", "indigo"]
```

Every listed colour must have its corresponding crystal in `rows`; otherwise the door can never open. Colours may be omitted when a level is intended to focus on a smaller set of mechanics.

#### Moving-platform settings

Levels containing an `M` can configure all of their moving platforms with these properties:

```js
platformRange: 4,   // travel distance in tiles
platformSpeed: 80,  // pixels per second
platformAxis: "x", // "x" for horizontal or "y" for vertical
```

If a property is omitted, it defaults to a four-tile horizontal movement at 80 pixels per second.

#### `rows`

An array of strings containing the map. Each character represents one `32 × 32` tile cell.

- Row index increases downward.
- Column index increases to the right.
- Short rows are automatically padded with empty space to match the longest row.
- Leading spaces are significant and determine horizontal placement.
- Avoid relying on trailing spaces; use a visible floor or hazard character to establish the intended width.
- The player always spawns at pixel position `(64, 64)`, corresponding to tile column `2`, row `2` before gravity is applied.
- Areas outside the map are treated as solid walls.

### Map legend

#### World and hazards

| Character | Meaning |
| --- | --- |
| ` ` | Empty space |
| `1` | Permanent solid ground |
| `^` | Spikes; touching them restarts the level |
| `D` | Exit door; place it two cells above its supporting platform |

#### Colour blocks and crystals

| Character | Meaning |
| --- | --- |
| `C` | Red crystal |
| `r` | Red block |
| `O` | Orange crystal |
| `o` | Static orange block |
| `M` | Two-tile-wide horizontal orange moving platform; stationary until orange is restored |
| `Y` | Yellow crystal |
| `y` | Disappearing yellow block |
| `G` | Green crystal |
| `g` | Green super-bounce block |
| `B` | Blue crystal |
| `I` | Indigo crystal |
| `i` | Indigo crumble block; after restoration it vanishes briefly when stepped on |

Crystal cells and the door are entities placed in otherwise empty cells; they do not create solid tiles themselves.

Each indigo block has its own crumble timer, so a run of `i` characters collapses progressively. A hidden block waits to restore while the player overlaps its cell.

### Blue portal markup

| Character | Portal exit direction |
| --- | --- |
| `u` | Up |
| `v` | Down |
| `<` | Left |
| `>` | Right |

Portal characters occupy non-solid cells. They remain faint and inactive until the blue crystal is collected.

Portals are paired in row-major scan order—from the top row to the bottom row, and from left to right within each row:

1. The first and second portal markers form pair 1.
2. The third and fourth form pair 2.
3. Additional markers continue in pairs.

Both ends are entrances. When the player enters a portal, the partner marker determines the exit direction. Incoming speed is preserved, with a minimum exit speed of `360 px/s`, and a short cooldown prevents immediate return through the destination.

For example:

```js
rows: [
  "                         >       D",
  "                              1111",
  "",
  "             u",
  "            111",
]
```

Entering the lower `u` portal exits through `>` and launches the player right. Entering `>` exits through `u` and launches the player upward.

### Complete example

This small level introduces red blocks:

```js
{
  colors: ["red"],
  rows: [
    "",
    "",
    "",
    "                    D",
    "            C",
    "          111rrrrrrrrrr",
    "1111111111111^^^^^^^^^^",
  ],
},
```

The player starts near the upper-left and falls to the permanent ground. The red crystal is supported by `111`; collecting it makes the `r` bridge solid and opens the route to the door.

### Level design checklist

Before considering a map finished, verify that:

- The spawn has a safe landing surface.
- Every colour in `colors` has exactly one reachable crystal.
- The crystals can be collected in the HUD order.
- Blocks required to reach a crystal are active at that point in the sequence.
- Yellow blocks do not strand the player when they disappear.
- Green pads have enough unobstructed space for an eight-tile bounce.
- Portal markers occur in complete pairs and their scan order creates the intended links.
- Portal exits leave enough clearance for the player hitbox.
- Indigo runs give the player time to react before the first block crumbles.
- The door has a supporting platform and is reachable after all required colors are restored.
- Gaps contain spikes or another intentional recovery/failure route.
- The longest row gives the camera the intended level width.

Use `+` and `-` to move quickly between levels during testing, and press `F1` to inspect the player and colour state.

## Adding a level

1. Open `level.js`.
2. Add a new object to the end of `Level.levels`.
3. List the required colours in collection order.
4. Build the map from the legend above.
5. Ensure the map contains one door and every required crystal.
6. Reload the browser and use the level-skip keys to reach the new map.
7. Test the intended route as well as falls, backtracking, and collecting crystals in an unexpected order.

Because levels are read directly from source, no registration or build command is required.
