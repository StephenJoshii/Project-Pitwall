import React, { useMemo, useState } from 'react'
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

interface Props {
  laps: any[]
  drivers: string[]
  pitStops: any[]
}

function timeToSeconds(t: string) {
  if (!t) return NaN
  const parts = t.split(':')
  if (parts.length === 1) return parseFloat(parts[0])
  const m = parseFloat(parts[0])
  const s = parseFloat(parts[1])
  return m * 60 + s
}

export default function GapAnalysis({ laps, drivers, pitStops }: Props) {
  const [viewMode, setViewMode] = useState<'leader' | 'interval'>('leader')

  // Calculate cumulative race times and gaps
  const gapData = useMemo(() => {
    if (!laps || laps.length === 0 || !drivers || drivers.length === 0) return null

    // Build cumulative times for each driver
    const cumulativeTimes: Record<string, { lap: number; time: number; position: number }[]> = {}
    
    drivers.forEach(driverId => {
      cumulativeTimes[driverId] = []
      let totalTime = 0
      
      laps.forEach((lap: any) => {
        const timing = lap.Timings.find((t: any) => t.driverId === driverId)
        if (timing) {
          const lapTime = timeToSeconds(timing.time)
          if (!isNaN(lapTime) && lapTime > 0 && lapTime < 200) {
            totalTime += lapTime
            cumulativeTimes[driverId].push({
              lap: parseInt(lap.number),
              time: totalTime,
              position: parseInt(timing.position) || 0,
            })
          }
        }
      })
    })

    // Calculate gaps to leader
    const gapsToLeader: Record<string, { lap: number; gap: number; position: number }[]> = {}
    
    laps.forEach((lap: any) => {
      const lapNum = parseInt(lap.number)
      
      // Find leader's time for this lap
      let leaderTime = Infinity
      lap.Timings.forEach((t: any) => {
        if (t.position === '1') {
          const driverData = cumulativeTimes[t.driverId]
          const lapData = driverData?.find(d => d.lap === lapNum)
          if (lapData) {
            leaderTime = lapData.time
          }
        }
      })
      
      // Calculate gap to leader for each driver
      drivers.forEach(driverId => {
        const driverData = cumulativeTimes[driverId]
        const lapData = driverData?.find(d => d.lap === lapNum)
        
        if (lapData) {
          const gap = lapData.time - leaderTime
          
          if (!gapsToLeader[driverId]) {
            gapsToLeader[driverId] = []
          }
          
          gapsToLeader[driverId].push({
            lap: lapNum,
            gap: gap,
            position: lapData.position,
          })
        }
      })
    })

    // Calculate intervals (gap to car ahead)
    const intervals: Record<string, { lap: number; interval: number; position: number }[]> = {}
    
    laps.forEach((lap: any) => {
      const lapNum = parseInt(lap.number)
      
      // Sort drivers by position for this lap
      const sortedTimings = [...lap.Timings].sort((a: any, b: any) => 
        parseInt(a.position) - parseInt(b.position)
      )
      
      sortedTimings.forEach((timing: any, index: number) => {
        const driverId = timing.driverId
        if (!drivers.includes(driverId)) return
        
        if (!intervals[driverId]) {
          intervals[driverId] = []
        }
        
        if (index === 0) {
          // Leader has no car ahead
          intervals[driverId].push({
            lap: lapNum,
            interval: 0,
            position: parseInt(timing.position),
          })
        } else {
          // Calculate gap to car ahead
          const carAheadTiming = sortedTimings[index - 1]
          const driverData = cumulativeTimes[driverId]?.find(d => d.lap === lapNum)
          const carAheadData = cumulativeTimes[carAheadTiming.driverId]?.find(d => d.lap === lapNum)
          
          if (driverData && carAheadData) {
            const interval = driverData.time - carAheadData.time
            intervals[driverId].push({
              lap: lapNum,
              interval: interval,
              position: parseInt(timing.position),
            })
          }
        }
      })
    })

    return { gapsToLeader, intervals, cumulativeTimes }
  }, [laps, drivers])

  const chartData = useMemo(() => {
    if (!gapData) return null

    const colors = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4']
    const datasets: any[] = []

    if (viewMode === 'leader') {
      drivers.forEach((driverId, index) => {
        const data = gapData.gapsToLeader[driverId]
        if (!data || data.length === 0) return

        datasets.push({
          label: driverId,
          data: data.map(d => ({ x: d.lap, y: d.gap })),
          borderColor: colors[index % colors.length],
          backgroundColor: colors[index % colors.length],
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          // Mark pit stops
          segment: {
            borderDash: (ctx: any) => {
              const currentLap = data[ctx.p0DataIndex]?.lap
              const nextLap = data[ctx.p1DataIndex]?.lap
              // Check if there's a pit stop between these laps
              const hasPitStop = pitStops.some((ps: any) => 
                ps.driverId === driverId && 
                parseInt(ps.lap) >= currentLap && 
                parseInt(ps.lap) <= nextLap
              )
              return hasPitStop ? [5, 5] : undefined
            }
          }
        })
      })
    } else {
      // Interval mode
      drivers.forEach((driverId, index) => {
        const data = gapData.intervals[driverId]
        if (!data || data.length === 0) return

        datasets.push({
          label: driverId,
          data: data.map(d => ({ x: d.lap, y: d.interval })),
          borderColor: colors[index % colors.length],
          backgroundColor: colors[index % colors.length],
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          segment: {
            borderDash: (ctx: any) => {
              const currentLap = data[ctx.p0DataIndex]?.lap
              const nextLap = data[ctx.p1DataIndex]?.lap
              const hasPitStop = pitStops.some((ps: any) => 
                ps.driverId === driverId && 
                parseInt(ps.lap) >= currentLap && 
                parseInt(ps.lap) <= nextLap
              )
              return hasPitStop ? [5, 5] : undefined
            }
          }
        })
      })
    }

    return { datasets }
  }, [gapData, viewMode, drivers, pitStops])

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!gapData) return null

    const stats: Record<string, any> = {}

    drivers.forEach(driverId => {
      const gaps = gapData.gapsToLeader[driverId]
      const intervals = gapData.intervals[driverId]
      
      if (!gaps || gaps.length === 0) return

      // Find positions held
      const positions = gaps.map(g => g.position).filter(p => p > 0)
      const bestPosition = positions.length > 0 ? Math.min(...positions) : 0
      const worstPosition = positions.length > 0 ? Math.max(...positions) : 0
      
      // Calculate average gap to leader (excluding leader laps)
      const nonLeaderGaps = gaps.filter(g => g.gap > 0.1).map(g => g.gap)
      const avgGap = nonLeaderGaps.length > 0 
        ? nonLeaderGaps.reduce((a, b) => a + b, 0) / nonLeaderGaps.length 
        : 0

      // Find biggest gain/loss
      let biggestGain = 0
      let biggestLoss = 0
      for (let i = 1; i < gaps.length; i++) {
        const change = gaps[i-1].gap - gaps[i].gap // Negative = lost time, positive = gained time
        if (change > biggestGain) biggestGain = change
        if (change < biggestLoss) biggestLoss = change
      }

      stats[driverId] = {
        bestPosition,
        worstPosition,
        avgGap: avgGap.toFixed(3),
        biggestGain: biggestGain.toFixed(3),
        biggestLoss: Math.abs(biggestLoss).toFixed(3),
        timesLed: gaps.filter(g => Math.abs(g.gap) < 0.1).length,
      }
    })

    return stats
  }, [gapData, drivers])

  if (!drivers || drivers.length === 0) {
    return <div className="placeholder">Select drivers to see gap analysis</div>
  }

  if (!chartData) {
    return <div className="placeholder">No gap data available</div>
  }

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y
            if (viewMode === 'leader') {
              return value === 0 
                ? `${context.dataset.label}: Leading`
                : `${context.dataset.label}: +${value.toFixed(3)}s`
            } else {
              return value === 0
                ? `${context.dataset.label}: Leading`
                : `${context.dataset.label}: +${value.toFixed(3)}s to car ahead`
            }
          },
        },
      },
    },
    scales: {
      x: {
        type: 'linear' as const,
        title: { display: true, text: 'Lap Number' },
      },
      y: {
        title: { 
          display: true, 
          text: viewMode === 'leader' ? 'Gap to Leader (seconds)' : 'Interval to Car Ahead (seconds)' 
        },
        min: 0,
      },
    },
  }

  return (
    <div className="gap-analysis">
      <h3>📊 Gap & Interval Analysis</h3>
      <div className="telemetry-note telemetry-note-success">
        <small>✅ Gaps calculated from cumulative lap times. Dashed lines indicate pit stop laps. Lower is better (closer to leader/car ahead).</small>
      </div>

      <div className="gap-view-controls">
        <button
          className={`gap-view-btn ${viewMode === 'leader' ? 'active' : ''}`}
          onClick={() => setViewMode('leader')}
        >
          🏆 Gap to Leader
        </button>
        <button
          className={`gap-view-btn ${viewMode === 'interval' ? 'active' : ''}`}
          onClick={() => setViewMode('interval')}
        >
          🚗 Interval (Car Ahead)
        </button>
      </div>

      <div className="gap-chart-container">
        <div style={{ height: '400px' }}>
          <Line data={chartData} options={commonOptions} />
        </div>
        <p className="chart-description">
          {viewMode === 'leader' 
            ? 'Shows each driver\'s gap to the race leader over time. Line going down = catching the leader.'
            : 'Shows gap to the car immediately ahead. Line going down = catching the car ahead (potential overtake).'
          }
        </p>
      </div>

      {statistics && (
        <div className="gap-stats-container">
          <h4>Race Battle Statistics</h4>
          <table className="standings-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Best Pos</th>
                <th>Worst Pos</th>
                <th>Laps Led</th>
                <th>Avg Gap to Leader</th>
                <th>Biggest Gain</th>
                <th>Biggest Loss</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(driverId => {
                const stat = statistics[driverId]
                if (!stat) return null
                
                return (
                  <tr key={driverId}>
                    <td className="driver-name">{driverId}</td>
                    <td className="position">{stat.bestPosition}</td>
                    <td>{stat.worstPosition}</td>
                    <td className={stat.timesLed > 0 ? 'sector-best-overall' : ''}>{stat.timesLed}</td>
                    <td>{stat.avgGap}s</td>
                    <td className="gap-positive">+{stat.biggestGain}s</td>
                    <td className="gap-negative">-{stat.biggestLoss}s</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="chart-description">
            <small>
              <strong>Biggest Gain:</strong> Largest gap reduction in a single lap (catching up).
              <strong> Biggest Loss:</strong> Largest gap increase in a single lap (falling behind).
            </small>
          </p>
        </div>
      )}
    </div>
  )
}
