import React, { useMemo, useState, useEffect } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import {
  findOpenF1Session,
  fetchOpenF1Drivers,
  fetchOpenF1Laps,
  mapDriverToNumber,
  type OpenF1Lap,
} from '../lib/openf1'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

interface Props {
  drivers: string[]
  raceName: string
  season: string
  round: string
}

interface SectorData {
  driverId: string
  lapNumber: number
  sector1: number
  sector2: number
  sector3: number
  isPB1?: boolean // personal best
  isPB2?: boolean
  isPB3?: boolean
  isOB1?: boolean // overall best
  isOB2?: boolean
  isOB3?: boolean
}

export default function SectorAnalysis({ drivers, raceName, season, round }: Props) {
  const [openF1SessionKey, setOpenF1SessionKey] = useState<number | null>(null)
  const [sectorData, setSectorData] = useState<Map<string, SectorData[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'progression' | 'best' | 'comparison'>('best')
  const [selectedLap, setSelectedLap] = useState<number>(1)

  // Try to find OpenF1 session
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const sessionKey = await findOpenF1Session(season, round, raceName)
      if (!mounted) return
      
      if (sessionKey) {
        setOpenF1SessionKey(sessionKey)
      } else {
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [season, round, raceName])

  // Fetch sector data for selected drivers
  useEffect(() => {
    if (!openF1SessionKey || !drivers || drivers.length === 0) {
      setLoading(false)
      return
    }
    
    let mounted = true
    setLoading(true)
    
    ;(async () => {
      try {
        const openF1Drivers = await fetchOpenF1Drivers(openF1SessionKey)
        const dataMap = new Map<string, SectorData[]>()
        
        for (const driverId of drivers) {
          const driverNum = mapDriverToNumber(driverId, openF1Drivers)
          if (!driverNum) continue
          
          const laps = await fetchOpenF1Laps(openF1SessionKey, driverNum)
          
          // Filter out invalid laps and extract sector data
          const sectorLaps: SectorData[] = laps
            .filter((lap: OpenF1Lap) => 
              lap.duration_sector_1 && 
              lap.duration_sector_2 && 
              lap.duration_sector_3 &&
              !lap.is_pit_out_lap
            )
            .map((lap: OpenF1Lap) => ({
              driverId,
              lapNumber: lap.lap_number,
              sector1: lap.duration_sector_1,
              sector2: lap.duration_sector_2,
              sector3: lap.duration_sector_3,
            }))
          
          // Calculate personal bests
          if (sectorLaps.length > 0) {
            const pb1 = Math.min(...sectorLaps.map(l => l.sector1))
            const pb2 = Math.min(...sectorLaps.map(l => l.sector2))
            const pb3 = Math.min(...sectorLaps.map(l => l.sector3))
            
            sectorLaps.forEach(lap => {
              lap.isPB1 = Math.abs(lap.sector1 - pb1) < 0.001
              lap.isPB2 = Math.abs(lap.sector2 - pb2) < 0.001
              lap.isPB3 = Math.abs(lap.sector3 - pb3) < 0.001
            })
          }
          
          dataMap.set(driverId, sectorLaps)
        }
        
        // Calculate overall bests across all drivers
        const allLaps = Array.from(dataMap.values()).flat()
        if (allLaps.length > 0) {
          const ob1 = Math.min(...allLaps.map(l => l.sector1))
          const ob2 = Math.min(...allLaps.map(l => l.sector2))
          const ob3 = Math.min(...allLaps.map(l => l.sector3))
          
          dataMap.forEach(laps => {
            laps.forEach(lap => {
              lap.isOB1 = Math.abs(lap.sector1 - ob1) < 0.001
              lap.isOB2 = Math.abs(lap.sector2 - ob2) < 0.001
              lap.isOB3 = Math.abs(lap.sector3 - ob3) < 0.001
            })
          })
        }
        
        if (!mounted) return
        setSectorData(dataMap)
      } catch (e) {
        console.error('Failed to fetch sector data:', e)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    
    return () => {
      mounted = false
    }
  }, [openF1SessionKey, drivers])

  const colors = useMemo(() => ({
    '#e6194b': drivers[0],
    '#3cb44b': drivers[1],
    '#ffe119': drivers[2],
    '#4363d8': drivers[3],
    '#f58231': drivers[4],
    '#911eb4': drivers[5],
  }), [drivers])

  const bestSectorChart = useMemo(() => {
    if (sectorData.size === 0) return null
    
    const datasets: any[] = []
    const colorEntries = Object.entries(colors)
    
    sectorData.forEach((laps, driverId) => {
      const colorIndex = drivers.indexOf(driverId)
      const color = colorEntries[colorIndex]?.[0] || '#999'
      
      const pb1 = Math.min(...laps.map(l => l.sector1))
      const pb2 = Math.min(...laps.map(l => l.sector2))
      const pb3 = Math.min(...laps.map(l => l.sector3))
      
      datasets.push({
        label: driverId,
        data: [pb1, pb2, pb3],
        backgroundColor: color,
        borderColor: color,
        borderWidth: 2,
      })
    })
    
    return {
      labels: ['Sector 1', 'Sector 2', 'Sector 3'],
      datasets,
    }
  }, [sectorData, drivers, colors])

  const progressionChart = useMemo(() => {
    if (sectorData.size === 0) return null
    
    const sector1Datasets: any[] = []
    const sector2Datasets: any[] = []
    const sector3Datasets: any[] = []
    const colorEntries = Object.entries(colors)
    
    sectorData.forEach((laps, driverId) => {
      const colorIndex = drivers.indexOf(driverId)
      const color = colorEntries[colorIndex]?.[0] || '#999'
      
      const lapNumbers = laps.map(l => l.lapNumber)
      
      sector1Datasets.push({
        label: `${driverId} S1`,
        data: laps.map((l, i) => ({ x: l.lapNumber, y: l.sector1 })),
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        pointRadius: (context: any) => {
          const lap = laps[context.dataIndex]
          return lap?.isPB1 ? 5 : lap?.isOB1 ? 6 : 2
        },
        pointStyle: (context: any) => {
          const lap = laps[context.dataIndex]
          return lap?.isOB1 ? 'star' : 'circle'
        },
        tension: 0.3,
      })
      
      sector2Datasets.push({
        label: `${driverId} S2`,
        data: laps.map(l => ({ x: l.lapNumber, y: l.sector2 })),
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        pointRadius: (context: any) => {
          const lap = laps[context.dataIndex]
          return lap?.isPB2 ? 5 : lap?.isOB2 ? 6 : 2
        },
        pointStyle: (context: any) => {
          const lap = laps[context.dataIndex]
          return lap?.isOB2 ? 'star' : 'circle'
        },
        tension: 0.3,
      })
      
      sector3Datasets.push({
        label: `${driverId} S3`,
        data: laps.map(l => ({ x: l.lapNumber, y: l.sector3 })),
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        pointRadius: (context: any) => {
          const lap = laps[context.dataIndex]
          return lap?.isPB3 ? 5 : lap?.isOB3 ? 6 : 2
        },
        pointStyle: (context: any) => {
          const lap = laps[context.dataIndex]
          return lap?.isOB3 ? 'star' : 'circle'
        },
        tension: 0.3,
      })
    })
    
    return { sector1Datasets, sector2Datasets, sector3Datasets }
  }, [sectorData, drivers, colors])

  const comparisonChart = useMemo(() => {
    if (sectorData.size === 0) return null
    
    // Find max lap number
    const maxLap = Math.max(...Array.from(sectorData.values()).flatMap(laps => laps.map(l => l.lapNumber)))
    if (selectedLap > maxLap) setSelectedLap(maxLap)
    
    const datasets: any[] = []
    const colorEntries = Object.entries(colors)
    
    sectorData.forEach((laps, driverId) => {
      const lap = laps.find(l => l.lapNumber === selectedLap)
      if (!lap) return
      
      const colorIndex = drivers.indexOf(driverId)
      const color = colorEntries[colorIndex]?.[0] || '#999'
      
      datasets.push({
        label: driverId,
        data: [lap.sector1, lap.sector2, lap.sector3],
        backgroundColor: color,
        borderColor: color,
        borderWidth: 2,
      })
    })
    
    return {
      labels: ['Sector 1', 'Sector 2', 'Sector 3'],
      datasets,
      maxLap,
    }
  }, [sectorData, selectedLap, drivers, colors])

  if (!drivers || drivers.length === 0) {
    return <div className="placeholder">Select drivers to analyze sector times</div>
  }

  if (loading) {
    return (
      <div className="sector-analysis">
        <h3>Sector Time Analysis</h3>
        <div className="loading">Loading sector data...</div>
      </div>
    )
  }

  if (!openF1SessionKey || sectorData.size === 0) {
    return (
      <div className="sector-analysis">
        <h3>Sector Time Analysis</h3>
        <div className="telemetry-note">
          <small>⚠️ Sector time data is only available for 2023+ races via OpenF1 API. Please select a more recent race for sector analysis.</small>
        </div>
      </div>
    )
  }

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y || context.parsed
            return `${context.dataset.label}: ${value.toFixed(3)}s`
          },
        },
      },
    },
  }

  return (
    <div className="sector-analysis">
      <h3>🏁 Sector Time Analysis</h3>
      <div className="telemetry-note telemetry-note-success">
        <small>✅ Using real sector times from OpenF1 API! Purple/larger dots = personal best, ⭐ stars = overall best in session.</small>
      </div>

      <div className="sector-view-controls">
        <button
          className={`sector-view-btn ${viewMode === 'best' ? 'active' : ''}`}
          onClick={() => setViewMode('best')}
        >
          📊 Best Sectors
        </button>
        <button
          className={`sector-view-btn ${viewMode === 'progression' ? 'active' : ''}`}
          onClick={() => setViewMode('progression')}
        >
          📈 Sector Progression
        </button>
        <button
          className={`sector-view-btn ${viewMode === 'comparison' ? 'active' : ''}`}
          onClick={() => setViewMode('comparison')}
        >
          🔄 Lap Comparison
        </button>
      </div>

      {/* Best Sectors View */}
      {viewMode === 'best' && bestSectorChart && (
        <div className="sector-chart-container">
          <h4>Personal Best Sector Times</h4>
          <p className="chart-description">
            Each driver's fastest time in each sector throughout the race
          </p>
          <div style={{ height: '350px' }}>
            <Bar
              data={bestSectorChart}
              options={{
                ...commonOptions,
                scales: {
                  y: {
                    title: { display: true, text: 'Time (seconds)' },
                    beginAtZero: false,
                  },
                },
              }}
            />
          </div>
          
          {/* Stats table */}
          <div className="sector-stats-table">
            <h4>Sector Time Summary</h4>
            <table className="standings-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Best S1</th>
                  <th>Best S2</th>
                  <th>Best S3</th>
                  <th>Best Theoretical</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(sectorData.entries()).map(([driverId, laps]) => {
                  const pb1 = Math.min(...laps.map(l => l.sector1))
                  const pb2 = Math.min(...laps.map(l => l.sector2))
                  const pb3 = Math.min(...laps.map(l => l.sector3))
                  const theoretical = pb1 + pb2 + pb3
                  
                  const hasOB1 = laps.some(l => l.isOB1)
                  const hasOB2 = laps.some(l => l.isOB2)
                  const hasOB3 = laps.some(l => l.isOB3)
                  
                  return (
                    <tr key={driverId}>
                      <td className="driver-name">{driverId}</td>
                      <td className={hasOB1 ? 'sector-best-overall' : ''}>
                        {pb1.toFixed(3)}s {hasOB1 && '🟣'}
                      </td>
                      <td className={hasOB2 ? 'sector-best-overall' : ''}>
                        {pb2.toFixed(3)}s {hasOB2 && '🟣'}
                      </td>
                      <td className={hasOB3 ? 'sector-best-overall' : ''}>
                        {pb3.toFixed(3)}s {hasOB3 && '🟣'}
                      </td>
                      <td className="sector-theoretical">{theoretical.toFixed(3)}s</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sector Progression View */}
      {viewMode === 'progression' && progressionChart && (
        <div className="sector-chart-container">
          <div className="sector-progression-charts">
            <div className="sector-chart">
              <h4>Sector 1 Progression</h4>
              <div style={{ height: '280px' }}>
                <Line
                  data={{ datasets: progressionChart.sector1Datasets }}
                  options={{
                    ...commonOptions,
                    scales: {
                      x: {
                        type: 'linear',
                        title: { display: true, text: 'Lap Number' },
                      },
                      y: {
                        title: { display: true, text: 'Time (seconds)' },
                      },
                    },
                  }}
                />
              </div>
            </div>
            
            <div className="sector-chart">
              <h4>Sector 2 Progression</h4>
              <div style={{ height: '280px' }}>
                <Line
                  data={{ datasets: progressionChart.sector2Datasets }}
                  options={{
                    ...commonOptions,
                    scales: {
                      x: {
                        type: 'linear',
                        title: { display: true, text: 'Lap Number' },
                      },
                      y: {
                        title: { display: true, text: 'Time (seconds)' },
                      },
                    },
                  }}
                />
              </div>
            </div>
            
            <div className="sector-chart">
              <h4>Sector 3 Progression</h4>
              <div style={{ height: '280px' }}>
                <Line
                  data={{ datasets: progressionChart.sector3Datasets }}
                  options={{
                    ...commonOptions,
                    scales: {
                      x: {
                        type: 'linear',
                        title: { display: true, text: 'Lap Number' },
                      },
                      y: {
                        title: { display: true, text: 'Time (seconds)' },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
          <p className="chart-description">
            ⭐ Stars indicate overall best sectors across all drivers. Larger dots show personal bests.
          </p>
        </div>
      )}

      {/* Lap Comparison View */}
      {viewMode === 'comparison' && comparisonChart && (
        <div className="sector-chart-container">
          <div className="telemetry-controls">
            <div className="control-group">
              <label>Compare Lap:</label>
              <input
                type="number"
                min="1"
                max={comparisonChart.maxLap}
                value={selectedLap}
                onChange={(e) => setSelectedLap(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <h4>Sector Comparison - Lap {selectedLap}</h4>
          <p className="chart-description">
            Direct sector time comparison for the selected lap
          </p>
          <div style={{ height: '350px' }}>
            <Bar
              data={comparisonChart}
              options={{
                ...commonOptions,
                scales: {
                  y: {
                    title: { display: true, text: 'Time (seconds)' },
                    beginAtZero: false,
                  },
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
