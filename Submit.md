## Building for a Roadroller submission

Keep the JavaScript files separate while developing. For submission, use [Terser](https://github.com/terser/terser) to combine and minify them in one global scope, then pass that result to [Roadroller](https://github.com/lifthrasiir/roadroller).

### Install the build tools

```powershell
npm install --save-dev terser roadroller
```

### Combine and minify the JavaScript

The input order must match the order in `index.html` because the game uses shared globals:

```powershell
npx terser `
  keys.js utility.js tile.js song.js sound.js level.js entity.js `
  particles.js hero.js camera.js game.js`
  --compress passes=3 `
  --mangle `
  --output build/game.min.js
```

Terser reads these files sequentially and produces one minified file at `build/game.min.js`.

### Run Roadroller

Use the normal optimizer for quick test builds:

```powershell
npx roadroller build/game.min.js -o build/game.js
```

For the final submission, try the more thorough level-two optimization:

```powershell
npx roadroller -O2 build/game.min.js -o build/game.js
```

Roadroller can take noticeably longer at `-O2`, but may produce a smaller result. Always test the generated `build/game.js`; successful minification does not guarantee that the packed build behaves correctly.

### Use the packed file

In the submission copy of `index.html`, replace the dynamic block that loads the eleven source files with one script:

```html
<script src="build/game.js"></script>
```

The existing `body onload="startGame()"` can remain because `startGame` is deliberately left as a global function.

Do not enable Terser top-level mangling without reserving `startGame`, or the name used by the HTML may be changed. Avoid property mangling until the result has been tested carefully because the game uses browser and canvas API properties.

Do not use Roadroller's `--dirty` option with the current HTML. The canvas has the single-letter ID `c`, which can collide with the free variables used by dirty-mode decoder code.

### Submission pipeline

```text
Source JavaScript files
        ↓ Terser
build/game.min.js
        ↓ Roadroller
build/game.js
        ↓ ZIP with the submission HTML and CSS
submission.zip
```

Measure the final ZIP rather than only the raw JavaScript. The HTML, CSS, filenames, directory entries, and archive compression all contribute to the submitted size.

Before packaging the final build:

- Play every level using the Roadrolled file.
- Test keyboard and mobile controls.
- Verify green bounce and blue portal momentum.
- Check that `+`, `-`, and `F1` still work in the packed build.
- Open the browser console and confirm there are no runtime errors.
