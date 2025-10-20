// OpenF1 API integration for real F1 telemetry data
// API Docs: https://openf1.org/

const OPENF1_BASE = 'https://api.openf1.org/v1'

export interface OpenF1Session {
  session_key: number
  session_name: string
  date_start: string
  date_end: string
  location: string
  country_name: string
  circuit_short_name: string
  year: number
  meeting_key: number
}

export interface OpenF1Driver {
  driver_number: number
  full_name: string
  name_acronym: string
  team_name: string
  team_colour: string
  headshot_url?: string
}

export interface OpenF1Lap {
  driver_number: number
  lap_number: number
  lap_duration: number
  duration_sector_1: number
  duration_sector_2: number
  duration_sector_3: number
  i1_speed: number // intermediate 1 speed
  i2_speed: number // intermediate 2 speed
  st_speed: number // speed trap speed
  is_pit_out_lap: boolean
  date_start: string
}

export interface OpenF1CarData {
  date: string
  driver_number: number
  rpm: number
  speed: number
  n_gear: number // gear number
  throttle: number // 0-100
  brake: boolean
  drs: number // DRS status
}

// Map Jolpica race to OpenF1 session
export async function findOpenF1Session(season: string, round: string, raceName: string): Promise<number | null> {
  try {
    // Search for matching session by year and location
    const res = await fetch(`${OPENF1_BASE}/sessions?year=${season}&session_name=Race`)
    if (!res.ok) return null
    
    const sessions: OpenF1Session[] = await res.json()
    
    // Try to match by race name
    const nameMatch = sessions.find(s => {
      const locationMatch = raceName.toLowerCase().includes(s.location.toLowerCase())
      const countryMatch = raceName.toLowerCase().includes(s.country_name.toLowerCase())
      return locationMatch || countryMatch
    })
    
    if (nameMatch) return nameMatch.session_key
    
    // Fallback: match by round number (approximate)
    const roundNum = parseInt(round)
    if (roundNum > 0 && roundNum <= sessions.length) {
      return sessions[roundNum - 1].session_key
    }
    
    return null
  } catch (e) {
    console.error('Failed to find OpenF1 session:', e)
    return null
  }
}

// Get drivers for a session
export async function fetchOpenF1Drivers(sessionKey: number): Promise<OpenF1Driver[]> {
  try {
    const res = await fetch(`${OPENF1_BASE}/drivers?session_key=${sessionKey}`)
    if (!res.ok) return []
    return await res.json()
  } catch (e) {
    console.error('Failed to fetch OpenF1 drivers:', e)
    return []
  }
}

// Get laps for a driver
export async function fetchOpenF1Laps(sessionKey: number, driverNumber: number): Promise<OpenF1Lap[]> {
  try {
    const res = await fetch(`${OPENF1_BASE}/laps?session_key=${sessionKey}&driver_number=${driverNumber}`)
    if (!res.ok) return []
    return await res.json()
  } catch (e) {
    console.error('Failed to fetch OpenF1 laps:', e)
    return []
  }
}

// Get telemetry for a specific lap (limited to avoid overload)
// Note: OpenF1 car_data is VERY large - we sample it carefully
export async function fetchOpenF1LapTelemetry(
  sessionKey: number,
  driverNumber: number,
  lapNumber: number
): Promise<OpenF1CarData[]> {
  try {
    // First get the lap to find its time range
    const laps = await fetchOpenF1Laps(sessionKey, driverNumber)
    const lap = laps.find(l => l.lap_number === lapNumber)
    
    if (!lap) {
      console.warn(`Lap ${lapNumber} not found for driver ${driverNumber}`)
      return []
    }
    
    // OpenF1 doesn't provide easy lap-specific telemetry filtering
    // We'd need to fetch by date range which can be huge
    // For now, return empty and rely on sector speeds from lap data
    console.log('OpenF1 car telemetry requires date-based queries which can be large')
    return []
  } catch (e) {
    console.error('Failed to fetch OpenF1 telemetry:', e)
    return []
  }
}

// Map driver ID from Ergast to OpenF1 driver number
export function mapDriverToNumber(driverId: string, openf1Drivers: OpenF1Driver[]): number | null {
  // Common mappings
  const mapping: Record<string, string[]> = {
    max_verstappen: ['VER', 'VERSTAPPEN'],
    norris: ['NOR', 'NORRIS'],
    leclerc: ['LEC', 'LECLERC'],
    hamilton: ['HAM', 'HAMILTON'],
    russell: ['RUS', 'RUSSELL'],
    piastri: ['PIA', 'PIASTRI'],
    sainz: ['SAI', 'SAINZ'],
    alonso: ['ALO', 'ALONSO'],
    stroll: ['STR', 'STROLL'],
    perez: ['PER', 'PEREZ'],
  }
  
  const searchTerms = mapping[driverId] || [driverId.toUpperCase()]
  
  const driver = openf1Drivers.find(d => 
    searchTerms.some(term => 
      d.name_acronym === term || 
      d.full_name.toUpperCase().includes(term)
    )
  )
  
  return driver ? driver.driver_number : null
}
