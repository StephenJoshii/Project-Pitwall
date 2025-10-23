import React, { useEffect, useState } from 'react'
import { fetchDriverStandings, fetchConstructorStandings } from '../lib/ergast'

interface Props {
  season: string
}

export default function SeasonOverview({ season }: Props) {
  const [driverStandings, setDriverStandings] = useState<any[]>([])
  const [constructorStandings, setConstructorStandings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'drivers' | 'constructors'>('drivers')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    
    ;(async () => {
      try {
        const [drivers, constructors] = await Promise.all([
          fetchDriverStandings(season),
          fetchConstructorStandings(season),
        ])
        
        if (!mounted) return
        
        setDriverStandings(drivers)
        setConstructorStandings(constructors)
      } catch (e) {
        console.error('Failed to fetch standings:', e)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    
    return () => {
      mounted = false
    }
  }, [season])

  if (loading) {
    return (
      <div className="season-overview">
        <h2>Season Overview</h2>
        <div className="loading">Loading championship standings...</div>
      </div>
    )
  }

  return (
    <div className="season-overview">
      <div className="overview-header">
        <h2>{season} F1 World Championship</h2>
        <div className="overview-tabs">
          <button
            className={`overview-tab ${activeView === 'drivers' ? 'active' : ''}`}
            onClick={() => setActiveView('drivers')}
          >
            🏆 Drivers
          </button>
          <button
            className={`overview-tab ${activeView === 'constructors' ? 'active' : ''}`}
            onClick={() => setActiveView('constructors')}
          >
            🏁 Constructors
          </button>
        </div>
      </div>

      {activeView === 'drivers' && (
        <div className="standings-container">
          <table className="standings-table">
            <thead>
              <tr>
                <th>Pos</th>
                <th>Driver</th>
                <th>Nationality</th>
                <th>Team</th>
                <th>Points</th>
                <th>Wins</th>
              </tr>
            </thead>
            <tbody>
              {driverStandings.map((standing: any) => (
                <tr key={standing.Driver.driverId} className={standing.position === '1' ? 'leader' : ''}>
                  <td className="position">{standing.position}</td>
                  <td className="driver-name">
                    <span className="driver-code">{standing.Driver.code || standing.Driver.driverId.slice(0, 3).toUpperCase()}</span>
                    <span className="driver-full-name">{standing.Driver.givenName} {standing.Driver.familyName}</span>
                  </td>
                  <td className="nationality">{standing.Driver.nationality}</td>
                  <td className="team">{standing.Constructors?.[0]?.name || 'N/A'}</td>
                  <td className="points">{standing.points}</td>
                  <td className="wins">{standing.wins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeView === 'constructors' && (
        <div className="standings-container">
          <table className="standings-table">
            <thead>
              <tr>
                <th>Pos</th>
                <th>Constructor</th>
                <th>Nationality</th>
                <th>Points</th>
                <th>Wins</th>
              </tr>
            </thead>
            <tbody>
              {constructorStandings.map((standing: any) => (
                <tr key={standing.Constructor.constructorId} className={standing.position === '1' ? 'leader' : ''}>
                  <td className="position">{standing.position}</td>
                  <td className="constructor-name">{standing.Constructor.name}</td>
                  <td className="nationality">{standing.Constructor.nationality}</td>
                  <td className="points">{standing.points}</td>
                  <td className="wins">{standing.wins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
