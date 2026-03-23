# flip-board

Vestaboard-style split-flap animation prototype for displaying incident metrics.

## Files

- `index.html` — main page
- `flip.css` — split-flap board styling
- `flip.js` — animation logic
- `incident.json` — incident date data source

## Running locally

Because the page uses `fetch("incident.json")`, open it through a local web server rather than directly as a `file://` page.

### Option 1: VS Code Live Server
Open `index.html` with Live Server.

### Option 2: Python HTTP server
```bash
python3 -m http.server 8000
```

Then open:
http://localhost:8000/index.html

#### incident.json format

The page expects incident date keys like:
```json
{
  "incident.5.date": "2025-12-10",
  "incident.4.date": "2025-10-23",
  "incident.3.date": "2025-08-18",
  "incident.2.date": "2025-06-03",
  "incident.1.date": "2025-05-15"
}
```
Comment fields are okay too, as long as the code filters only keys ending in `.date`.

## Notes

This is an early prototype and still needs cleanup/refactoring.
