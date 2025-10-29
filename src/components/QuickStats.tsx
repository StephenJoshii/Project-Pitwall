import React from 'react'

type Props = {
  laps: any[]
  pitStops: any[]
  selectedDrivers: string[]
}

export default function QuickStats({ laps, pitStops, selectedDrivers }: Props) {
  if (laps.length === 0) return null

  // Calculate stats
  const totalLaps = Math.max(...laps.map(l => parseInt(l.lap)))
  const uniqueDrivers = new Set(laps.map(l => l.driverId)).size
  const totalPitStops = pitStops.length
  
  // Get fastest lap
  const validLaps = laps.filter(l => l.time?.time)
  let fastestLap = null
  let fastestDriver = null
  let fastestLapNumber = null
  
  if (validLaps.length > 0) {
    const fastest = validLaps.reduce((prev, curr) => {
      const prevTime = parseFloat(prev.time.time.split(':')[0]) * 60 + parseFloat(prev.time.time.split(':')[1])
      const currTime = parseFloat(curr.time.time.split(':')[0]) * 60 + parseFloat(curr.time.time.split(':')[1])
      return currTime < prevTime ? curr : prev
    })
    fastestLap = fastest.time.time
    fastestDriver = fastest.driverId
    fastestLapNumber = fastest.lap
  }

  // Average pit stop time
  let avgPitTime = null
  if (pitStops.length > 0) {
    const totalDuration = pitStops.reduce((sum, ps) => sum + parseFloat(ps.duration), 0)
    avgPitTime = (totalDuration / pitStops.length).toFixed(3)
  }

  // Get stats for selected drivers
  let selectedStats = null
  if (selectedDrivers.length > 0) {
    const selectedLaps = laps.filter(l => selectedDrivers.includes(l.driverId) && l.time?.time)
    if (selectedLaps.length > 0) {
      const times = selectedLaps.map(l => {
        const [min, sec] = l.time.time.split(':')
        return parseFloat(min) * 60 + parseFloat(sec)
      })
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      const minTime = Math.min(...times)
      const maxTime = Math.max(...times)
      selectedStats = {
        count: selectedLaps.length,
        avgTime: `${Math.floor(avgTime / 60)}:${(avgTime % 60).toFixed(3).padStart(6, '0')}`,
        bestTime: `${Math.floor(minTime / 60)}:${(minTime % 60).toFixed(3).padStart(6, '0')}`,
        variance: ((maxTime - minTime) * 1000).toFixed(0) // in milliseconds
      }
    }
  }

  return (
    <div className="quick-stats">
      <h3>📊 Quick Race Stats</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏁</div>
          <div className="stat-content">
            <div className="stat-value">{totalLaps}</div>
            <div className="stat-label">Total Laps</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🏎️</div>
          <div className="stat-content">
            <div className="stat-value">{uniqueDrivers}</div>
            <div className="stat-label">Drivers</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <div className="stat-value">{totalPitStops}</div>
            <div className="stat-label">Pit Stops</div>
          </div>
        </div>
        
        {fastestLap && (
          <div className="stat-card highlight">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <div className="stat-value">{fastestLap}</div>
              <div className="stat-label">
                Fastest Lap
                <span className="stat-detail"> • {fastestDriver} (Lap {fastestLapNumber})</span>
              </div>
            </div>
          </div>
        )}
        
        {avgPitTime && (
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-value">{avgPitTime}s</div>
              <div className="stat-label">Avg Pit Stop</div>
            </div>
          </div>
        )}
        
        {selectedStats && (
          <div className="stat-card selected">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-value">{selectedStats.count} laps</div>
              <div className="stat-label">
                Selected Drivers
                <span className="stat-detail"> • Avg: {selectedStats.avgTime}</span>
                <span className="stat-detail"> • Best: {selectedStats.bestTime}</span>
                <span className="stat-detail"> • Range: {selectedStats.variance}ms</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
