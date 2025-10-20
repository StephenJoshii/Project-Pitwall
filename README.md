# F1 Telemetry Dashboard

Interactive Formula 1 Race Telemetry Dashboard for exploring and analyzing race performance data.

## Features Implemented

### ✅ Part 1: Race Pace Analysis
- Automatically loads the most recently completed race (using the Jolpica F1 API - Ergast replacement)
- Allows changing season and round manually
- Displays drivers for the selected race and allows multi-select
- Renders a lap-by-lap lap times chart for selected drivers

### ✅ Part 2: Tyre Strategy and Wear
- **Tyre Strategy Timeline**: Visual representation of each driver's pit stops and tyre stints
- **Tyre Degradation Analysis**: Chart showing how lap times progress as tyres age within each stint
- Color-coded tyre compounds (Soft, Medium, Hard, Intermediate, Wet)

**Note**: Tyre compound data is simulated as the Ergast/Jolpica API doesn't provide compound information. For real compound data, FastF1 integration would be needed.

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

- Head-to-head telemetry view with speed, throttle, brake, and gear data
