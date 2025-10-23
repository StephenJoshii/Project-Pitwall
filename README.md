# F1 Telemetry Dashboard

Interactive Formula 1 Race Telemetry Dashboard for exploring and analyzing race performance data.

## Features Implemented

### 🎯 Navigation
- **Tabbed Interface**: Clean navigation between Race Pace, Tyre Strategy, and Telemetry views
- **Smooth Transitions**: Animated tab switching for better UX
- **Organized Layout**: Each analysis type in its own focused view

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

### ✅ Part 3: Head-to-Head Telemetry
- **Lap Selector**: Choose any lap from the race for detailed analysis
- **Driver Comparison**: Pick two drivers to compare side-by-side
- **Speed Chart**: Visual comparison of speed throughout the lap
- **Throttle & Brake Chart**: See throttle application and braking points for both drivers
- **Gear Selection Chart**: Compare gear changes and racing lines
- **Lap Time Delta**: Shows the time difference between the two drivers
- **Real Data Integration**: Automatically uses OpenF1 API for real lap times and sector speeds when available!

**Data Sources**:
- **Lap Times**: Real data from OpenF1 API for 2024 season (when available)
- **Sector Speeds**: Real intermediate and speed trap data from OpenF1
- **Telemetry Patterns**: Simulated based on real lap times and sector speeds
- **Note**: Per-sample telemetry (throttle/brake at each meter) would require downloading very large datasets or using FastF1 library

## Run locally

```bash
# from project root
npm install
npm run dev
```

Open http://localhost:5173 (or the port shown in terminal) in your browser.

## Usage

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
- Integration with FastF1 Python library for real telemetry data
- Weather data visualization
- Sector time comparisons
- Team radio transcripts
- Driver championship standings
