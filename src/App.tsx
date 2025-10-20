import React from 'react'
import RaceSelector from './components/RaceSelector'
import DriverSelector from './components/DriverSelector'
import LapTimesChart from './components/LapTimesChart'
import useSWR from 'swr'
import { fetchLatestRace } from './lib/ergast'

export default function App() {
  const { data: latestRace, error } = useSWR('latestRace', fetchLatestRace)

  if (error) return <div>Failed to load latest race</div>
  if (!latestRace) return <div>Loading latest race...</div>

  return (
    <div className="app">
      <header>
        <h1>🏎️ F1 Telemetry Dashboard</h1>
        <p className="subtitle">Explore race data, tyre strategies, and performance analysis</p>
      </header>
      <main>
        <RaceSelector defaultRace={latestRace} />
      </main>
    </div>
  )
}
