import React, { useState } from 'react'
import RaceSelector from './components/RaceSelector'
import SeasonOverview from './components/SeasonOverview'
import Sidebar from './components/Sidebar'
import useSWR from 'swr'
import { fetchLatestRace } from './lib/ergast'

export default function App() {
  const { data: latestRace, error } = useSWR('latestRace', fetchLatestRace)
  const [activePage, setActivePage] = useState<'race' | 'season'>('race')

  if (error) return <div>Failed to load latest race</div>
  if (!latestRace) return <div>Loading latest race...</div>

  const currentSeason = latestRace.season

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="main-content">
        {activePage === 'race' && <RaceSelector defaultRace={latestRace} />}
        {activePage === 'season' && <SeasonOverview season={currentSeason} />}
      </div>
    </div>
  )
}
