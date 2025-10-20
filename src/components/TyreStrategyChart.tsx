import React, { useMemo } from 'react'

// Tyre compound colors (approximate F1 colors)
const COMPOUND_COLORS: Record<string, string> = {
  SOFT: '#FF3333',
  MEDIUM: '#FFD700',
  HARD: '#EFEFEF',
  INTERMEDIATE: '#00AA00',
  WET: '#0066FF',
}

interface Stint {
  compound: string
  startLap: number
  endLap: number
}

interface Props {
  pitStops: any[]
  laps: any[]
  drivers: string[]
}

// Build stint information from pit stops
function buildStints(driverId: string, pitStops: any[], totalLaps: number): Stint[] {
  const driverPitStops = pitStops
    .filter((ps: any) => ps.driverId === driverId)
    .sort((a: any, b: any) => parseInt(a.lap) - parseInt(b.lap))

  const stints: Stint[] = []
  let currentLap = 1

  // Note: Ergast API doesn't provide tyre compound data in pit stops
  // We'll use a simplified simulation based on typical strategies
  // In a real app, you'd need FastF1 or another source for compound data
  const compounds = ['SOFT', 'MEDIUM', 'HARD']
  
  driverPitStops.forEach((ps: any, index: number) => {
    const pitLap = parseInt(ps.lap)
    stints.push({
      compound: compounds[index % 3], // Simulate compound rotation
      startLap: currentLap,
      endLap: pitLap,
    })
    currentLap = pitLap + 1
  })

  // Final stint to end of race
  stints.push({
    compound: compounds[driverPitStops.length % 3],
    startLap: currentLap,
    endLap: totalLaps,
  })

  return stints
}

export default function TyreStrategyChart({ pitStops, laps, drivers }: Props) {
  const totalLaps = laps.length

  const driverStints = useMemo(() => {
    return drivers.map((driverId) => ({
      driverId,
      stints: buildStints(driverId, pitStops, totalLaps),
    }))
  }, [drivers, pitStops, totalLaps])

  if (!drivers || drivers.length === 0) {
    return <div className="placeholder">Select drivers to see tyre strategy</div>
  }

  if (!pitStops || pitStops.length === 0) {
    return <div className="placeholder">No pit stop data available for this race</div>
  }

  return (
    <div className="tyre-strategy">
      <h3>Tyre Strategy</h3>
      <div className="strategy-note">
        <small>⚠️ Note: Tyre compound data is simulated (Ergast API doesn't provide compound info). For real compound data, FastF1 integration needed.</small>
      </div>
      <div className="strategy-timeline">
        {driverStints.map(({ driverId, stints }) => (
          <div key={driverId} className="driver-timeline">
            <div className="driver-label">{driverId}</div>
            <div className="stints-container">
              {stints.map((stint, index) => {
                const width = ((stint.endLap - stint.startLap + 1) / totalLaps) * 100
                return (
                  <div
                    key={index}
                    className="stint"
                    style={{
                      width: `${width}%`,
                      backgroundColor: COMPOUND_COLORS[stint.compound] || '#999',
                    }}
                    title={`${stint.compound}: Lap ${stint.startLap}-${stint.endLap}`}
                  >
                    <span className="stint-label">
                      {stint.compound.charAt(0)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="legend">
        {Object.entries(COMPOUND_COLORS).map(([compound, color]) => (
          <div key={compound} className="legend-item">
            <div className="legend-color" style={{ backgroundColor: color }} />
            <span>{compound}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
