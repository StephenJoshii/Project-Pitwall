import React, { useEffect, useState } from 'react'
import { fetchRaceDrivers, fetchLapTimes, fetchPitStops } from '../lib/ergast'
import DriverSelector from './DriverSelector'
import LapTimesChart from './LapTimesChart'
import TyreStrategyChart from './TyreStrategyChart'
import TyreDegradationChart from './TyreDegradationChart'

type Props = { defaultRace: { season: string; round: string; raceName: string } }

export default function RaceSelector({ defaultRace }: Props) {
  const [race, setRace] = useState(defaultRace)
  const [drivers, setDrivers] = useState<any[]>([])
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([])
  const [laps, setLaps] = useState<any[]>([])
  const [pitStops, setPitStops] = useState<any[]>([])

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
        <h2>{race.raceName} — {race.season} R{race.round}</h2>
        <div className="controls">
          <label>Season:</label>
          <input value={race.season} onChange={(e: any) => setRace({ ...race, season: e.target.value })} />
          <label>Round:</label>
          <input value={race.round} onChange={(e: any) => setRace({ ...race, round: e.target.value })} />
        </div>
      </div>

      <DriverSelector drivers={drivers} selected={selectedDrivers} onChange={setSelectedDrivers} />

      <LapTimesChart laps={laps} drivers={selectedDrivers} />

      <TyreStrategyChart pitStops={pitStops} laps={laps} drivers={selectedDrivers} />

      <TyreDegradationChart pitStops={pitStops} laps={laps} drivers={selectedDrivers} />
    </div>
  )
}
