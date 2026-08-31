# JS13K 2026 Rainbow Platformer

```powershell
$env:Path = "C:\Users\tyler\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:Path"

& ".\node_modules\.bin\terser.cmd" keys.js utility.js tile.js song.js sound.js level.js entity.js particles.js hero.js camera.js game.js --compress "passes=3,top_retain=startGame" --mangle "reserved=[startGame]" --toplevel --output build/game.min.js


& ".\node_modules\.bin\roadroller.cmd" -O2 build/game.min.js -o build/game.js
```

A fast, momentum-focused browser platformer about restoring the colours of the rainbow. Collect each level's crystals to activate its colour mechanics, then reach the door.

The game is written in plain JavaScript and renders with a fixed `800 × 480` logical coordinate system at the browser's current display resolution. It includes keyboard and touch controls, responsive scaling, wall jumps, a double jump, moving platforms, hazards, generated music and Web Audio effects, camera effects, a run timer and death counter, and seven hand-authored levels.

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
| Next level | `+` or numpad `+` | — |
| Previous level | `-` or numpad `-` | — |

## Colour mechanics

| Colour | Crystal | Map block | Behavior |
| --- | --- | --- | --- |
| Red | `C` | `r` | Red blocks begin ghosted and non-solid, then become solid. |
| Orange | `O` | `o` / `M` | Orange blocks become solid and orange moving platforms begin moving. |
| Yellow | `Y` | `y` | Yellow blocks begin solid, then disappear and become non-solid—the inverse of red. |
| Green | `G` | `g` | Green launch pads become solid. Landing from above produces an automatic `850 px/s` super-bounce and refreshes the double jump. |
| Blue | `B` | `u`, `v`, `<`, `>` | Linked portals activate. Entering one preserves speed and redirects it through its partner. |
| Indigo | `I` | `i` | Indigo blocks become solid. Stepping on one warns for `0.3s`, hides it for `1.5s`, then safely restores it. |
| Violet | `V` | — | The unstable final crystal starts a five-second countdown. Reach the door before it creates a large rainbow explosion. |

The player, trail, particles, HUD, and exit door gain each restored colour as the level progresses.

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
colors: ["red", "orange", "yellow", "green", "blue", "indigo", "violet"]
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
| `V` | Violet crystal; starts a five-second explosion countdown |

Crystal cells and the door are entities placed in otherwise empty cells; they do not create solid tiles themselves.

Each indigo block has its own crumble timer, so a run of `i` characters collapses progressively. A hidden block waits to restore while the player overlaps its cell.

### Blue portal markup

| Character | Portal exit direction |
| --- | --- |
| `u` | Up |
| `v` | Down |
| `<` | Left |
| `>` | Right |
