import React from 'react'

export interface FilterOptions {
  excludePitLaps: boolean
  excludeOutliers: boolean
  lapRangeStart: number | null
  lapRangeEnd: number | null
  minLapTime: number | null
  maxLapTime: number | null
  showOnlyRacePace: boolean // Excludes lap 1 and last 3 laps
}

interface Props {
  filters: FilterOptions
  onChange: (filters: FilterOptions) => void
  totalLaps: number
}

export default function LapFilters({ filters, onChange, totalLaps }: Props) {
  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onChange({ ...filters, [key]: value })
  }

  const resetFilters = () => {
    onChange({
      excludePitLaps: false,
      excludeOutliers: false,
      lapRangeStart: null,
      lapRangeEnd: null,
      minLapTime: null,
      maxLapTime: null,
      showOnlyRacePace: false,
    })
  }

  const hasActiveFilters = 
    filters.excludePitLaps ||
    filters.excludeOutliers ||
    filters.lapRangeStart !== null ||
    filters.lapRangeEnd !== null ||
    filters.minLapTime !== null ||
    filters.maxLapTime !== null ||
    filters.showOnlyRacePace

  return (
    <div className="lap-filters">
      <div className="filters-header">
        <h4>🔍 Data Filters</h4>
        {hasActiveFilters && (
          <button className="reset-filters-btn" onClick={resetFilters}>
            ↻ Reset All
          </button>
        )}
      </div>
      
      <div className="filters-grid">
        {/* Quick Filters */}
        <div className="filter-section">
          <label className="filter-label">Quick Filters</label>
          <div className="filter-checkboxes">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.excludePitLaps}
                onChange={(e) => updateFilter('excludePitLaps', e.target.checked)}
              />
              <span>Exclude Pit Laps</span>
              <small className="filter-hint">Remove laps with pit stops (slow lap times)</small>
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.excludeOutliers}
                onChange={(e) => updateFilter('excludeOutliers', e.target.checked)}
              />
              <span>Exclude Outliers</span>
              <small className="filter-hint">Remove abnormal lap times (likely safety car/issues)</small>
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.showOnlyRacePace}
                onChange={(e) => updateFilter('showOnlyRacePace', e.target.checked)}
              />
              <span>Race Pace Only</span>
              <small className="filter-hint">Excludes lap 1 and final 3 laps (fuel-adjusted pace)</small>
            </label>
          </div>
        </div>

        {/* Lap Range */}
        <div className="filter-section">
          <label className="filter-label">Lap Range</label>
          <div className="filter-range">
            <div className="range-input-group">
              <label>From Lap</label>
              <input
                type="number"
                min="1"
                max={totalLaps}
                value={filters.lapRangeStart || ''}
                placeholder="1"
                onChange={(e) => updateFilter('lapRangeStart', e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>
            <span className="range-separator">to</span>
            <div className="range-input-group">
              <label>To Lap</label>
              <input
                type="number"
                min="1"
                max={totalLaps}
                value={filters.lapRangeEnd || ''}
                placeholder={totalLaps.toString()}
                onChange={(e) => updateFilter('lapRangeEnd', e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>
          </div>
        </div>

        {/* Lap Time Range */}
        <div className="filter-section">
          <label className="filter-label">Lap Time Range (seconds)</label>
          <div className="filter-range">
            <div className="range-input-group">
              <label>Min Time</label>
              <input
                type="number"
                step="0.1"
                value={filters.minLapTime || ''}
                placeholder="80.0"
                onChange={(e) => updateFilter('minLapTime', e.target.value ? parseFloat(e.target.value) : null)}
              />
            </div>
            <span className="range-separator">to</span>
            <div className="range-input-group">
              <label>Max Time</label>
              <input
                type="number"
                step="0.1"
                value={filters.maxLapTime || ''}
                placeholder="120.0"
                onChange={(e) => updateFilter('maxLapTime', e.target.value ? parseFloat(e.target.value) : null)}
              />
            </div>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="active-filters-info">
          <small>
            ✓ Filters active: 
            {filters.excludePitLaps && ' No pit laps'}
            {filters.excludeOutliers && ' No outliers'}
            {filters.showOnlyRacePace && ' Race pace only'}
            {filters.lapRangeStart && ` From lap ${filters.lapRangeStart}`}
            {filters.lapRangeEnd && ` To lap ${filters.lapRangeEnd}`}
            {filters.minLapTime && ` Min ${filters.minLapTime}s`}
            {filters.maxLapTime && ` Max ${filters.maxLapTime}s`}
          </small>
        </div>
      )}
    </div>
  )
}

// Utility function to apply filters to lap data
export function applyLapFilters(
  laps: any[],
  filters: FilterOptions,
  pitStops: any[]
): any[] {
  if (!laps || laps.length === 0) return laps

  return laps.filter((lap: any) => {
    const lapNum = parseInt(lap.number)

    // Lap range filter
    if (filters.lapRangeStart && lapNum < filters.lapRangeStart) return false
    if (filters.lapRangeEnd && lapNum > filters.lapRangeEnd) return false

    // Race pace only filter (exclude first and last laps)
    if (filters.showOnlyRacePace) {
      if (lapNum === 1) return false
      if (lapNum > laps.length - 3) return false
    }

    // Pit lap filter
    if (filters.excludePitLaps) {
      const hasPitStop = pitStops.some((ps: any) => parseInt(ps.lap) === lapNum)
      if (hasPitStop) return false
    }

    return true
  })
}

// Utility to filter individual lap times with outlier detection
export function filterLapTime(
  lapTime: number,
  filters: FilterOptions,
  allLapTimes: number[]
): boolean {
  // Time range filter
  if (filters.minLapTime && lapTime < filters.minLapTime) return false
  if (filters.maxLapTime && lapTime > filters.maxLapTime) return false

  // Outlier filter (using IQR method)
  if (filters.excludeOutliers && allLapTimes.length > 4) {
    const sorted = [...allLapTimes].sort((a, b) => a - b)
    const q1 = sorted[Math.floor(sorted.length * 0.25)]
    const q3 = sorted[Math.floor(sorted.length * 0.75)]
    const iqr = q3 - q1
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr
    
    if (lapTime < lowerBound || lapTime > upperBound) return false
  }

  return true
}
