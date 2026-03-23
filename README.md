# flip-board

A browser-based split-flap / Vestaboard-style board built with HTML, CSS, and JavaScript.

The project is designed as a **generic flip-board engine**:
- `flip.js` is the reusable board renderer
- `flip_sound.js` handles optional flip sound effects
- individual HTML pages act as the **use-case layer**, deciding what data to fetch, transform, and display

This means the same board engine can be used for:
- incident counters
- weather boards
- status dashboards
- countdowns
- custom messages
- any other board-style display

---

## Project structure

- `index.html` — incident counter example page
- `weather_board.html` — weather example page using a real weather API
- `flip.css` — board styling and flip-panel visuals
- `flip.js` — reusable flip-board engine
- `flip_sound.js` — modular audio helpers for flip sounds
- `incident.json` — sample incident data source
- `flip.html` — original/reference markup experiment

---

## How it works

The project is split into two layers:

### 1. Engine layer
The engine lives in `flip.js` and exposes:

- `createFlipBoard(options)`

That function creates a board instance and returns an API you can use to:

- render lines
- add lines
- clear the board
- replay the animation
- change theme
- change perspective
- enable/disable sound
- test sound

### 2. Page/use-case layer
Each HTML page imports `createFlipBoard()` and decides:

- what board settings to use
- what data to fetch
- how to transform that data into board lines
- what colors/alignment/padding to apply

This keeps business logic out of the engine.

---

## Running locally

Because some pages use `fetch()` to load local JSON or call APIs, open the project through a local web server rather than directly as a `file://` page.

### Option 1: VS Code Live Server
Open the project folder in VS Code and launch the page with **Live Server**.

### Option 2: Python HTTP server

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/index.html
```

You can also open other pages the same way, for example:

```text
http://localhost:8000/weather_board.html
```

---

## Why `file://` does not work reliably

Opening `index.html` directly in the browser may show the page shell and background, but requests like:

```js
fetch('./incident.json')
```

are commonly blocked by browser security rules for local files.

Use Live Server or a local HTTP server instead.

---

## Reusable board API

`flip.js` exports:

```js
import { createFlipBoard } from './flip.js'
```

Basic usage:

```js
const board = createFlipBoard({
  boardSelector: '.board',
  columns: 16,
  theme: 'dark',
  perspective: 1,
  sound: true,
})

board.renderLines([
  { text: 'hello world' },
  { text: 'flip-board', color: 'hsl(44, 100%, 50%)' },
  { text: 'ready', alignment: 'right' },
])
```

### Supported board options

```js
{
  boardSelector: '.board',
  columns: 16,
  perspective: 1,
  theme: 'dark',
  sound: true,
  characters: 'abcdefghijklmnopqrstuvwxyz0123456789 .,:!?-/'
}
```

### Supported line options

```js
{
  text: 'example',
  alignment: 'left',   // or 'right'
  color: 'hsl(0,0%,90%)',
  pad: 0,
  length: 16,
  characters: 'abcdefghijklmnopqrstuvwxyz0123456789 .,:!?-/'
}
```

---

## Engine methods

A created board instance provides:

- `board.renderLines(lines)` — clears and renders a full set of lines
- `board.addLine(line)` — appends a single line
- `board.clear()` — clears the board
- `board.replay()` — replays the current lines
- `board.setTheme(theme)` — updates the theme
- `board.setPerspective(value)` — updates flip perspective
- `board.setSound(enabled)` — enables/disables sound
- `board.testSound()` — plays a sound test

---

## Example: incident board

`index.html` is an example that:
1. creates a board
2. fetches `incident.json`
3. filters incident keys ending in `.date`
4. finds the most recent incident
5. calculates days since that incident
6. renders the result as board lines

### Example `incident.json`

```json
{
  "incident.5.date": "2025-12-10",
  "_comment_incident_2025-12-10": "Example incident note",
  "incident.4.date": "2025-10-23",
  "incident.3.date": "2025-08-18",
  "incident.2.date": "2025-06-03",
  "incident.1.date": "2025-05-15"
}
```

Comment fields are fine as long as the page logic filters only keys ending in `.date`.

---

## Example: weather board

`weather_board.html` is an example that:
1. creates a board
2. geocodes a place name
3. calls a live weather API
4. transforms the weather response into board lines

This page demonstrates that `flip.js` is generic and can drive a completely different board without changing the engine itself.

---

## Audio

Flip sound support is handled by `flip_sound.js`.

Notes:
- sound is optional
- browsers typically require a user interaction before audio playback is allowed
- use `board.testSound()` if you want to verify that audio is working

---

## Styling

`flip.css` handles:
- split-flap layout
- board appearance
- tile shaping
- light/dark theme behavior
- background grid styling

The board width is determined by the number of columns created in JavaScript, not just CSS.

---

## Example use cases

This project can be adapted for many board scenarios, including:

- incident counter boards
- weather boards
- release countdown boards
- service health/status boards
- motivational message boards
- custom dashboard widgets

---

## Current status

This project has evolved from a prototype into a reusable engine, but it is still a lightweight front-end project and can be refined further.

Likely future improvements:
- additional example pages
- better theming controls
- optional control panel module
- real recorded flap audio samples
- external config/data adapters
- packaging as a reusable component

---

## Notes

- Serve the project over HTTP, not `file://`
- Keep page-specific logic in the HTML page or a page-specific module
- Keep board rendering logic in `flip.js`
- Keep audio logic in `flip_sound.js`
