import React, { useEffect, useState } from 'react'
import { fetchRaceDrivers, fetchLapTimes, fetchPitStops, fetchSeasonRaces } from '../lib/ergast'
import DriverSelector from './DriverSelector'
import LapTimesChart from './LapTimesChart'
import TyreStrategyChart from './TyreStrategyChart'
import TyreDegradationChart from './TyreDegradationChart'
import TelemetryView from './TelemetryView'

type Props = { defaultRace: { season: string; round: string; raceName: string } }

export default function RaceSelector({ defaultRace }: Props) {
  const [race, setRace] = useState(defaultRace)
  const [season, setSeason] = useState(defaultRace.season)
  const [availableRaces, setAvailableRaces] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([])
  const [laps, setLaps] = useState<any[]>([])
  const [pitStops, setPitStops] = useState<any[]>([])

  // Fetch available races when season changes
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const races = await fetchSeasonRaces(season)
        if (!mounted) return
        setAvailableRaces(races)
      } catch (e) {
        console.error(e)
      }
    })()
    return () => {
      mounted = false
    }
  }, [season])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const ds = await fetchRaceDrivers(race.season, race.round)
        if (!mounted) return
        setDrivers(ds)
      } catch (e) {
        console.error(e)
      }
    })()
    return () => {
      mounted = false
    }
  }, [race])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const lapsData = await fetchLapTimes(race.season, race.round)
        if (!mounted) return
        setLaps(lapsData)
      } catch (e) {
        console.error(e)
      }
    })()
    return () => {
      mounted = false
    }
  }, [race])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const pitStopsData = await fetchPitStops(race.season, race.round)
        if (!mounted) return
        setPitStops(pitStopsData)
      } catch (e) {
        console.error(e)
      }
    })()
    return () => {
      mounted = false
    }
  }, [race])

  return (
    <div>
      <div className="race-card">
        <h2>{race.raceName}</h2>
        <div className="race-info">
          <span className="season-badge">{race.season} Season</span>
          <span className="round-badge">Round {race.round}</span>
        </div>
        <div className="controls">
          <div className="control-group">
            <label>Season:</label>
            <select value={season} onChange={(e: any) => {
              setSeason(e.target.value)
              // Reset to first race when season changes
              setRace({ season: e.target.value, round: '1', raceName: 'Loading...' })
            }}>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>
          </div>
          <div className="control-group">
            <label>Race:</label>
            <select 
              value={race.round} 
              onChange={(e: any) => {
                const selectedRace = availableRaces.find(r => r.round === e.target.value)
                if (selectedRace) {
                  setRace(selectedRace)
                }
              }}
            >
              {availableRaces.map((r: any) => (
                <option key={r.round} value={r.round}>
                  R{r.round}: {r.raceName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DriverSelector drivers={drivers} selected={selectedDrivers} onChange={setSelectedDrivers} />

      <LapTimesChart laps={laps} drivers={selectedDrivers} />

      <TyreStrategyChart pitStops={pitStops} laps={laps} drivers={selectedDrivers} />

      <TyreDegradationChart pitStops={pitStops} laps={laps} drivers={selectedDrivers} />

      <TelemetryView laps={laps} drivers={selectedDrivers} raceName={race.raceName} season={race.season} round={race.round} />
    </div>
  )
}
