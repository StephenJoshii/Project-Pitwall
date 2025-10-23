# F1 Telemetry Dashboard

Interactive Formula 1 Race Telemetry Dashboard for exploring and analyzing race performance data.

## Features Implemented

### 🧭 Navigation & Layout
- **Sidebar Navigation**: Persistent sidebar with navigation between Race Analysis and Season Overview pages
- **Tabbed Interface**: Clean navigation within Race Analysis between Race Pace, Tyre Strategy, and Telemetry views
- **Smooth Transitions**: Animated transitions for better UX
- **Modern Design**: Dark sidebar with gradient, professional table layouts

### 🏆 Season Overview
- **Driver Standings**: Complete championship standings table with positions, points, wins, and team information
- **Constructor Standings**: Team championship with points and victories
- **Real-Time Data**: Automatically fetches latest standings for the current season
- **Interactive Tables**: Clean, sortable tables with leader highlighting

### ✅ Part 1: Race Pace Analysis
- Automatically loads the most recently completed race (using the Jolpica F1 API - Ergast replacement)
- Allows changing season and round manually
- Displays drivers for the selected race and allows multi-select
- Renders a lap-by-lap lap times chart for selected drivers
- **NEW: Sector Time Analysis** 🏁
  - Real sector times (S1, S2, S3) from OpenF1 API for 2023+ races
  - Three view modes: Best Sectors, Sector Progression, Lap Comparison
  - Color-coded personal bests (purple) and overall best sectors (⭐ stars)
  - Theoretical best lap time calculation (sum of best sectors)
  - Identify car strengths: which drivers/teams excel in which sectors
- **NEW: Gap & Interval Analysis** 📊
  - Real-time gap to race leader throughout the race
  - Interval to car ahead (essential for understanding battles and overtakes)
  - Dashed lines indicate pit stop laps
  - Battle statistics: positions held, laps led, biggest gains/losses
  - Visualize undercuts, overcuts, and strategic plays
  - See when drivers are catching up or falling behind

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
