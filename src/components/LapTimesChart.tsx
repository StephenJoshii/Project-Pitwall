import React, { useMemo } from 'react'
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
import type { FilterOptions } from './LapFilters'
import { filterLapTime } from './LapFilters'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

function timeToSeconds(t: string) {
  // format mm:ss.xxx or ss.xxx
  if (!t) return NaN
  const parts = t.split(':')
  if (parts.length === 1) return parseFloat(parts[0])
  const m = parseFloat(parts[0])
  const s = parseFloat(parts[1])
  return m * 60 + s
}

interface Props {
  laps: any[]
  drivers: string[]
  filters?: FilterOptions
  pitStops?: any[]
}

export default function LapTimesChart({ laps, drivers, filters, pitStops = [] }: Props) {
  const datasets = useMemo(() => {
    if (!laps || laps.length === 0 || !drivers || drivers.length === 0) return []

    // Build per-driver lap times array indexed by lap number
    const perDriver: Record<string, number[]> = {}
    const perDriverRaw: Record<string, number[]> = {} // For outlier detection
    
    // First pass: collect all lap times for outlier detection
    for (const lap of laps) {
      for (const timing of lap.Timings) {
        const id = timing.driverId
        if (!perDriverRaw[id]) perDriverRaw[id] = []
        const lapTime = timeToSeconds(timing.time)
        if (!isNaN(lapTime) && lapTime > 0) {
          perDriverRaw[id].push(lapTime)
        }
      }
    }
    
    // Second pass: build filtered data
    for (const lap of laps) {
      const lapNum = parseInt(lap.number)
      
      // Only apply filters if they exist
      // Apply lap range filters
      if (filters?.lapRangeStart && lapNum < filters.lapRangeStart) continue
      if (filters?.lapRangeEnd && lapNum > filters.lapRangeEnd) continue
      
      // Apply race pace filter
      if (filters?.showOnlyRacePace) {
        if (lapNum === 1 || lapNum > laps.length - 3) continue
      }
      
      // Check for pit stops on this lap
      const isPitLap = filters?.excludePitLaps && pitStops.some((ps: any) => parseInt(ps.lap) === lapNum)
      if (isPitLap) continue
      
      for (const timing of lap.Timings) {
        const id = timing.driverId
        if (!perDriver[id]) perDriver[id] = []
        
        const lapTime = timeToSeconds(timing.time)
        
        // Apply time-based filters only if filters exist
        if (filters && !filterLapTime(lapTime, filters, perDriverRaw[id] || [])) {
          perDriver[id].push(NaN) // Keep array aligned but exclude this data point
        } else {
          perDriver[id].push(lapTime)
        }
      }
    }

    const colors = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4']

    return drivers.map((d: string, i: number) => ({
      label: d,
      data: perDriver[d] || [],
      borderColor: colors[i % colors.length],
      backgroundColor: colors[i % colors.length],
      tension: 0.2,
      pointRadius: 2,
      spanGaps: true, // Connect lines even with NaN gaps
    }))
  }, [laps, drivers, filters, pitStops])

  if (!datasets || datasets.length === 0) return <div className="placeholder">Select drivers to see lap times</div>

  // Build labels from filtered laps
  const labels: string[] = []
  for (const lap of laps) {
    const lapNum = parseInt(lap.number)
    
    if (filters?.lapRangeStart && lapNum < filters.lapRangeStart) continue
    if (filters?.lapRangeEnd && lapNum > filters.lapRangeEnd) continue
    if (filters?.showOnlyRacePace && (lapNum === 1 || lapNum > laps.length - 3)) continue
    
    const isPitLap = filters?.excludePitLaps && pitStops.some((ps: any) => parseInt(ps.lap) === lapNum)
    if (isPitLap) continue
    
    labels.push(`Lap ${lap.number}`)
  }

  const data = { labels, datasets }
  
  const totalLapsInRace = laps.length
  const visibleLaps = labels.length

  return (
    <div className="chart">
      <h3>Lap-by-lap Lap Times</h3>
      {visibleLaps < totalLapsInRace && (
        <p className="chart-description" style={{ color: '#f59e0b', fontWeight: 500 }}>
          ⚠️ Showing {visibleLaps} of {totalLapsInRace} laps (filters active). Use "Reset All" to see all laps.
        </p>
      )}
      <Line data={data} options={{
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { title: { display: true, text: 'Seconds' } } }
      }} />
    </div>
  )
}
