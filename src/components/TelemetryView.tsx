import React, { useState, useMemo, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { generateLapTelemetry, getCircuitIdFromRace } from '../lib/telemetry'
import {
  findOpenF1Session,
  fetchOpenF1Drivers,
  fetchOpenF1Laps,
  mapDriverToNumber,
  type OpenF1Lap,
} from '../lib/openf1'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface Props {
  laps: any[]
  drivers: string[]
  raceName: string
  season: string
  round: string
}

function timeToSeconds(t: string) {
  if (!t) return NaN
  const parts = t.split(':')
  if (parts.length === 1) return parseFloat(parts[0])
  const m = parseFloat(parts[0])
  const s = parseFloat(parts[1])
  return m * 60 + s
}

export default function TelemetryView({ laps, drivers, raceName, season, round }: Props) {
  const [selectedLap, setSelectedLap] = useState(10)
  const [driver1, setDriver1] = useState(drivers[0] || '')
  const [driver2, setDriver2] = useState(drivers[1] || '')
  const [openF1SessionKey, setOpenF1SessionKey] = useState<number | null>(null)
  const [openF1Data, setOpenF1Data] = useState<{ laps1?: OpenF1Lap[]; laps2?: OpenF1Lap[] } | null>(null)
  const [dataSource, setDataSource] = useState<'simulated' | 'openf1'>('simulated')

  // Try to find OpenF1 session on mount or when race changes
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const sessionKey = await findOpenF1Session(season, round, raceName)
      if (!mounted) return
      
      if (sessionKey) {
        setOpenF1SessionKey(sessionKey)
        console.log('Found OpenF1 session:', sessionKey)
      } else {
        console.log('No OpenF1 session found, using simulated data')
        setOpenF1SessionKey(null)
        setDataSource('simulated')
      }
    })()
    return () => {
      mounted = false
    }
  }, [season, round, raceName])

  // Fetch OpenF1 lap data when drivers or lap changes
  useEffect(() => {
    if (!openF1SessionKey || !driver1 || !driver2) return
    
    let mounted = true
    ;(async () => {
      try {
        const openF1Drivers = await fetchOpenF1Drivers(openF1SessionKey)
        const driverNum1 = mapDriverToNumber(driver1, openF1Drivers)
        const driverNum2 = mapDriverToNumber(driver2, openF1Drivers)
        
        if (!driverNum1 || !driverNum2) {
          console.log('Could not map drivers to OpenF1 numbers, using simulated data')
          setDataSource('simulated')
          return
        }
        
        const [laps1, laps2] = await Promise.all([
          fetchOpenF1Laps(openF1SessionKey, driverNum1),
          fetchOpenF1Laps(openF1SessionKey, driverNum2),
        ])
        
        if (!mounted) return
        
        if (laps1.length > 0 && laps2.length > 0) {
          setOpenF1Data({ laps1, laps2 })
          setDataSource('openf1')
          console.log('Using real OpenF1 lap data!')
        } else {
          setDataSource('simulated')
        }
      } catch (e) {
        console.error('Error fetching OpenF1 data:', e)
        if (mounted) setDataSource('simulated')
      }
    })()
    return () => {
      mounted = false
    }
  }, [openF1SessionKey, driver1, driver2])

  // Update drivers when selection changes
  React.useEffect(() => {
    if (drivers.length > 0 && !driver1) setDriver1(drivers[0])
    if (drivers.length > 1 && !driver2) setDriver2(drivers[1])
  }, [drivers, driver1, driver2])

  const telemetryData = useMemo(() => {
    if (!laps || laps.length === 0 || !driver1 || !driver2) return null

    // Try to use real OpenF1 data first
    if (dataSource === 'openf1' && openF1Data?.laps1 && openF1Data?.laps2) {
      const lap1 = openF1Data.laps1.find(l => l.lap_number === selectedLap)
      const lap2 = openF1Data.laps2.find(l => l.lap_number === selectedLap)
      
      if (lap1 && lap2 && lap1.lap_duration && lap2.lap_duration) {
        // Generate realistic telemetry based on real sector speeds
        const circuitId = getCircuitIdFromRace(raceName)
        const telemetry1 = generateLapTelemetry(circuitId, lap1.lap_duration, 1.0)
        const telemetry2 = generateLapTelemetry(circuitId, lap2.lap_duration, 0.98)
        
        // Enhance with real intermediate speeds
        // Adjust speed peaks based on actual recorded speeds
        const speedMultiplier1 = Math.max(lap1.i1_speed, lap1.i2_speed, lap1.st_speed) / 320
        const speedMultiplier2 = Math.max(lap2.i1_speed, lap2.i2_speed, lap2.st_speed) / 320
        
        telemetry1.forEach(p => p.speed = Math.round(p.speed * speedMultiplier1))
        telemetry2.forEach(p => p.speed = Math.round(p.speed * speedMultiplier2))
        
        return {
          telemetry1,
          telemetry2,
          lapTime1: lap1.lap_duration,
          lapTime2: lap2.lap_duration,
          isRealData: true,
        }
      }
    }

    // Fallback to Ergast lap times (simulated telemetry)
    const lap = laps.find((l: any) => parseInt(l.number) === selectedLap)
    if (!lap) return null

    const timing1 = lap.Timings.find((t: any) => t.driverId === driver1)
    const timing2 = lap.Timings.find((t: any) => t.driverId === driver2)

    if (!timing1 || !timing2) return null

    const lapTime1 = timeToSeconds(timing1.time)
    const lapTime2 = timeToSeconds(timing2.time)

    if (isNaN(lapTime1) || isNaN(lapTime2)) return null

    const circuitId = getCircuitIdFromRace(raceName)
    const telemetry1 = generateLapTelemetry(circuitId, lapTime1, 1.0)
    const telemetry2 = generateLapTelemetry(circuitId, lapTime2, 0.98)

    return {
      telemetry1,
      telemetry2,
      lapTime1,
      lapTime2,
      isRealData: false,
    }
  }, [laps, selectedLap, driver1, driver2, raceName, dataSource, openF1Data])

  if (!drivers || drivers.length < 2) {
    return <div className="placeholder">Select at least 2 drivers for telemetry comparison</div>
  }

  if (!telemetryData) {
    return <div className="placeholder">No telemetry data available for selected lap</div>
  }

  const { telemetry1, telemetry2, lapTime1, lapTime2, isRealData } = telemetryData

  // Prepare chart data
  const distances = telemetry1.map((p) => p.distance)

  // Speed chart
  const speedData = {
    labels: distances,
    datasets: [
      {
        label: `${driver1} Speed`,
        data: telemetry1.map((p) => p.speed),
        borderColor: '#e6194b',
        backgroundColor: '#e6194b',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
      },
      {
        label: `${driver2} Speed`,
        data: telemetry2.map((p) => p.speed),
        borderColor: '#3cb44b',
        backgroundColor: '#3cb44b',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
      },
    ],
  }

  // Throttle & Brake chart
  const throttleBrakeData = {
    labels: distances,
    datasets: [
      {
        label: `${driver1} Throttle`,
        data: telemetry1.map((p) => p.throttle),
        borderColor: '#4363d8',
        backgroundColor: 'rgba(67, 99, 216, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.3,
      },
      {
        label: `${driver1} Brake`,
        data: telemetry1.map((p) => -p.brake), // negative for visual separation
        borderColor: '#f58231',
        backgroundColor: 'rgba(245, 130, 49, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.3,
      },
      {
        label: `${driver2} Throttle`,
        data: telemetry2.map((p) => p.throttle),
        borderColor: '#4363d8',
        backgroundColor: 'rgba(67, 99, 216, 0.05)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: true,
        tension: 0.3,
      },
      {
        label: `${driver2} Brake`,
        data: telemetry2.map((p) => -p.brake),
        borderColor: '#f58231',
        backgroundColor: 'rgba(245, 130, 49, 0.05)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: true,
        tension: 0.3,
      },
    ],
  }

  // Gear chart
  const gearData = {
    labels: distances,
    datasets: [
      {
        label: `${driver1} Gear`,
        data: telemetry1.map((p) => p.gear),
        borderColor: '#911eb4',
        backgroundColor: '#911eb4',
        borderWidth: 2,
        pointRadius: 0,
        stepped: true,
      },
      {
        label: `${driver2} Gear`,
        data: telemetry2.map((p) => p.gear),
        borderColor: '#46f0f0',
        backgroundColor: '#46f0f0',
        borderWidth: 2,
        pointRadius: 0,
        stepped: true,
      },
    ],
  }

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
    },
    scales: {
      x: {
        title: { display: true, text: 'Distance (m)' },
        ticks: { maxTicksLimit: 10 },
      },
    },
  }

  return (
    <div className="telemetry-view">
      <h3>Head-to-Head Telemetry</h3>
      <div className={`telemetry-note ${isRealData ? 'telemetry-note-success' : ''}`}>
        {isRealData ? (
          <small>✅ Using real lap data from OpenF1 API! Telemetry patterns are simulated based on actual lap times and sector speeds.</small>
        ) : (
          <small>⚠️ Telemetry data is fully simulated based on lap times and circuit characteristics. Real telemetry requires FastF1 or official F1 data.</small>
        )}
      </div>

      <div className="telemetry-controls">
        <div className="control-group">
          <label>Lap:</label>
          <input
            type="number"
            min="1"
            max={laps.length}
            value={selectedLap}
            onChange={(e) => setSelectedLap(parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="control-group">
          <label>Driver 1:</label>
          <select value={driver1} onChange={(e) => setDriver1(e.target.value)}>
            {drivers.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label>Driver 2:</label>
          <select value={driver2} onChange={(e) => setDriver2(e.target.value)}>
            {drivers.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="lap-time-comparison">
        <div className="lap-time-item">
          <span className="driver-name" style={{ color: '#e6194b' }}>{driver1}</span>
          <span className="lap-time">{lapTime1.toFixed(3)}s</span>
        </div>
        <div className="lap-time-item">
          <span className="driver-name" style={{ color: '#3cb44b' }}>{driver2}</span>
          <span className="lap-time">{lapTime2.toFixed(3)}s</span>
        </div>
        <div className="lap-time-delta">
          Δ {Math.abs(lapTime1 - lapTime2).toFixed(3)}s
        </div>
      </div>

      <div className="telemetry-charts">
        <div className="telemetry-chart-container">
          <h4>Speed (km/h)</h4>
          <div style={{ height: '250px' }}>
            <Line
              data={speedData}
              options={{
                ...commonOptions,
                scales: {
                  ...commonOptions.scales,
                  y: { title: { display: true, text: 'Speed (km/h)' }, min: 0 },
                },
              }}
            />
          </div>
        </div>

        <div className="telemetry-chart-container">
          <h4>Throttle & Brake (%)</h4>
          <div style={{ height: '250px' }}>
            <Line
              data={throttleBrakeData}
              options={{
                ...commonOptions,
                scales: {
                  ...commonOptions.scales,
                  y: {
                    title: { display: true, text: 'Throttle (+) / Brake (-)' },
                    min: -100,
                    max: 100,
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="telemetry-chart-container">
          <h4>Gear Selection</h4>
          <div style={{ height: '200px' }}>
            <Line
              data={gearData}
              options={{
                ...commonOptions,
                scales: {
                  ...commonOptions.scales,
                  y: { title: { display: true, text: 'Gear' }, min: 1, max: 8, ticks: { stepSize: 1 } },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
