# F1 Telemetry Dashboard — First slice

This is the first slice of an Interactive Formula 1 Race Telemetry Dashboard.

What this implements:
- Automatically loads the most recently completed race (using the Jolpica F1 API - Ergast replacement).
- Allows changing season and round manually.
- Displays drivers for the selected race and allows multi-select.
- Renders a lap-by-lap lap times chart for selected drivers.

## Run locally

```bash
# from project root
npm install
npm run dev
```

Open http://localhost:5173 (or the port shown in terminal) in your browser.

## API Note

The original Ergast API (ergast.com) was shut down in early 2024. This app uses the **Jolpica F1 API** (https://api.jolpi.ca/ergast/f1/) which is a drop-in replacement that maintains the same JSON structure and endpoints.

## Next steps

After you check this: implement tyre stint visualization and head-to-head telemetry view.
