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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

function timeToSeconds(t: string) {
  if (!t) return NaN
  const parts = t.split(':')
  if (parts.length === 1) return parseFloat(parts[0])
  const m = parseFloat(parts[0])
  const s = parseFloat(parts[1])
  return m * 60 + s
}

interface Props {
  pitStops: any[]
  laps: any[]
  drivers: string[]
}

export default function TyreDegradationChart({ pitStops, laps, drivers }: Props) {
  const datasets = useMemo(() => {
    if (!laps || laps.length === 0 || !drivers || drivers.length === 0) return []

    const colors = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4']

    return drivers.map((driverId, driverIndex) => {
      // Get pit stops for this driver
      const driverPitStops = pitStops
        .filter((ps: any) => ps.driverId === driverId)
        .map((ps: any) => parseInt(ps.lap))
        .sort((a, b) => a - b)

      // Build lap times array with stint numbering
      const lapData: { lap: number; time: number; stint: number }[] = []
      let currentStint = 1

      for (const lap of laps) {
        const lapNum = parseInt(lap.number)
        const timing = lap.Timings.find((t: any) => t.driverId === driverId)
        
        if (timing) {
          const lapTime = timeToSeconds(timing.time)
          
          // Check if this lap is after a pit stop
          if (driverPitStops.includes(lapNum)) {
            currentStint++
          }
          
          if (!isNaN(lapTime) && lapTime > 0 && lapTime < 200) { // Filter outliers
            lapData.push({ lap: lapNum, time: lapTime, stint: currentStint })
          }
        }
      }

      // Calculate stint-relative lap times (lap within stint vs lap time)
      // This shows degradation within each stint
      const stintRelativeData: { x: number; y: number }[] = []
      const stintGroups: Record<number, typeof lapData> = {}
      
      lapData.forEach((ld) => {
        if (!stintGroups[ld.stint]) stintGroups[ld.stint] = []
        stintGroups[ld.stint].push(ld)
      })

      // For each stint, plot lap times with stint-lap offset
      Object.values(stintGroups).forEach((stintLaps) => {
        stintLaps.forEach((ld, index) => {
          stintRelativeData.push({
            x: index + 1, // Lap within stint (1, 2, 3, ...)
            y: ld.time,
          })
        })
      })

      return {
        label: driverId,
        data: stintRelativeData,
        borderColor: colors[driverIndex % colors.length],
        backgroundColor: colors[driverIndex % colors.length],
        tension: 0.3,
        pointRadius: 3,
        parsing: {
          xAxisKey: 'x',
          yAxisKey: 'y',
        },
      }
    })
  }, [laps, drivers, pitStops])

  if (!drivers || drivers.length === 0) {
    return <div className="placeholder">Select drivers to see tyre degradation</div>
  }

  if (!datasets || datasets.length === 0) {
    return <div className="placeholder">No data available for tyre degradation analysis</div>
  }

  const data = { datasets }

  return (
    <div className="chart">
      <h3>Tyre Degradation Analysis</h3>
      <p className="chart-description">
        Lap times vs. laps on current tyre set (resets at pit stops)
      </p>
      <Line
        data={data}
        options={{
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            tooltip: {
              callbacks: {
                title: (items) => `Lap ${items[0].parsed.x} on tyres`,
                label: (item) => `${item.dataset.label}: ${item.parsed.y?.toFixed(3) || 'N/A'}s`,
              },
            },
          },
          scales: {
            x: {
              type: 'linear',
              title: { display: true, text: 'Laps on Tyre Set' },
            },
            y: {
              title: { display: true, text: 'Lap Time (seconds)' },
            },
          },
        }}
      />
    </div>
  )
}
