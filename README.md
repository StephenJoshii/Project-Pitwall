

## Run locally

```bash
# from project root
npm install
npm run dev
```

Open http://localhost:5173 (or the port shown in terminal) in your browser.

## Usage

### Navigation
- **Race Analysis**: Click the 📊 Race Analysis button in the sidebar to view detailed race data
  - Use tabs to switch between Race Pace, Tyre Strategy, and Telemetry views
- **Season Overview**: Click the 🏆 Season Overview button to view championship standings
  - Toggle between Driver and Constructor standings

### Race Analysis
- **Season Selector**: Choose from 2021-2024 seasons (default: 2024, which has complete race data)
- **Race Dropdown**: Select any race from the season (labeled by round number and race name)
- **Driver Selection**: Click driver buttons to select/deselect (multiple selection supported)
- **Charts**: All visualizations update automatically when you change drivers or races

### Understanding "Round"
- **Round** = Race number in the season (e.g., Round 1 = Australian GP, Round 5 = Miami GP)
- A typical F1 season has 20-24 rounds (races)

## API Note

The original Ergast API (ergast.com) was shut down in early 2024. This app uses:
- **Jolpica F1 API** (https://api.jolpi.ca/ergast/f1/) - Drop-in Ergast replacement for race results, standings, and pit stops
- **OpenF1 API** (https://openf1.org/) - Real telemetry and timing data for recent races (2023+)

**Data Availability**: 
- 2024 season has complete data in both APIs
- OpenF1 provides real lap times, sector times, and speed trap data
- 2025 data is incomplete/test data (only 2 races available)

## Next steps

Future enhancements could include:
- Integration with FastF1 Python library for real telemetry data (per-meter throttle/brake)
- Weather data visualization (temperature, rain, wind)
- Sector time comparisons and mini-sectors analysis
- Team radio transcripts integration
- Race calendar with upcoming events
- Historical season comparisons
- Live timing during race weekends
