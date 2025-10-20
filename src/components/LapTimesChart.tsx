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
  // format mm:ss.xxx or ss.xxx
  if (!t) return NaN
  const parts = t.split(':')
  if (parts.length === 1) return parseFloat(parts[0])
  const m = parseFloat(parts[0])
  const s = parseFloat(parts[1])
  return m * 60 + s
}

export default function LapTimesChart({ laps, drivers }: any) {
  const datasets = useMemo(() => {
    if (!laps || laps.length === 0 || !drivers || drivers.length === 0) return []

    // Build per-driver lap times array indexed by lap number
    const perDriver: Record<string, number[]> = {}
    const labels: string[] = []
    for (const lap of laps) {
      labels.push(lap.number)
      for (const timing of lap.Timings) {
        const id = timing.driverId
        if (!perDriver[id]) perDriver[id] = []
        perDriver[id].push(timeToSeconds(timing.time))
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
    }))
  }, [laps, drivers])

  if (!datasets || datasets.length === 0) return <div className="placeholder">Select drivers to see lap times</div>

  const labels = laps.map((l: any) => `Lap ${l.number}`)

  const data = { labels, datasets }

  return (
    <div className="chart">
      <h3>Lap-by-lap Lap Times</h3>
      <Line data={data} options={{
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { title: { display: true, text: 'Seconds' } } }
      }} />
    </div>
  )
}
