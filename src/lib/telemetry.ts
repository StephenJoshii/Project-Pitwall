// Telemetry simulator - generates realistic speed/throttle/brake/gear data
// Real telemetry requires FastF1 or official F1 data sources

interface TelemetryPoint {
  distance: number // meters from lap start (0-circuit length)
  speed: number // km/h
  throttle: number // 0-100%
  brake: number // 0-100%
  gear: number // 1-8
}

// Circuit characteristics (approximate lengths and sector splits)
const CIRCUITS: Record<string, { length: number; corners: number; topSpeed: number }> = {
  default: { length: 5000, corners: 16, topSpeed: 320 },
  monaco: { length: 3337, corners: 19, topSpeed: 290 },
  monza: { length: 5793, corners: 11, topSpeed: 360 },
  spa: { length: 7004, corners: 19, topSpeed: 340 },
  silverstone: { length: 5891, corners: 18, topSpeed: 330 },
  suzuka: { length: 5807, corners: 18, topSpeed: 320 },
}

// Generate realistic telemetry for a lap
export function generateLapTelemetry(
  circuitId: string = 'default',
  lapTime: number = 90, // lap time in seconds
  driverSkill: number = 1.0 // 0.9-1.1 for variation
): TelemetryPoint[] {
  const circuit = CIRCUITS[circuitId] || CIRCUITS.default
  const points: TelemetryPoint[] = []
  const numPoints = 200 // telemetry samples per lap
  
  const avgSpeed = (circuit.length / lapTime) * 3.6 // km/h
  
  for (let i = 0; i < numPoints; i++) {
    const progress = i / numPoints // 0 to 1
    const distance = progress * circuit.length
    
    // Simulate corners and straights using sine waves
    const cornerFrequency = circuit.corners / circuit.length
    const cornerPhase = distance * cornerFrequency * Math.PI * 2
    
    // Corner detection (more corners = more braking zones)
    const inCorner = Math.sin(cornerPhase + Math.PI / 4) > 0.3
    const approachingCorner = Math.sin(cornerPhase) > 0.5 && Math.sin(cornerPhase) < 0.9
    const exitingCorner = Math.sin(cornerPhase) < -0.3 && Math.sin(cornerPhase) > -0.7
    
    // Speed calculation
    let speed: number
    if (inCorner) {
      // Slower in corners (60-80% of top speed)
      speed = circuit.topSpeed * (0.6 + Math.random() * 0.2) * driverSkill
    } else if (approachingCorner) {
      // Braking zone
      speed = circuit.topSpeed * (0.7 + Math.random() * 0.15) * driverSkill
    } else {
      // On straights
      speed = circuit.topSpeed * (0.85 + Math.random() * 0.15) * driverSkill
    }
    
    // Throttle calculation (inverse of braking)
    let throttle: number
    if (inCorner) {
      throttle = 40 + Math.random() * 30 // 40-70% in corners
    } else if (approachingCorner) {
      throttle = 20 + Math.random() * 20 // Lifting/coasting
    } else if (exitingCorner) {
      throttle = 70 + Math.random() * 25 // Accelerating out
    } else {
      throttle = 95 + Math.random() * 5 // Full throttle on straights
    }
    
    // Brake calculation
    let brake: number
    if (approachingCorner) {
      brake = 60 + Math.random() * 40 // Heavy braking
    } else if (inCorner) {
      brake = 10 + Math.random() * 20 // Trail braking
    } else {
      brake = 0
    }
    
    // Gear calculation based on speed
    let gear: number
    if (speed < 80) gear = 2
    else if (speed < 120) gear = 3
    else if (speed < 160) gear = 4
    else if (speed < 200) gear = 5
    else if (speed < 240) gear = 6
    else if (speed < 280) gear = 7
    else gear = 8
    
    points.push({
      distance: Math.round(distance),
      speed: Math.round(speed),
      throttle: Math.round(Math.min(100, Math.max(0, throttle))),
      brake: Math.round(Math.min(100, Math.max(0, brake))),
      gear,
    })
  }
  
  return points
}

// Get circuit ID from race name (simplified mapping)
export function getCircuitIdFromRace(raceName: string): string {
  const name = raceName.toLowerCase()
  if (name.includes('monaco')) return 'monaco'
  if (name.includes('monza') || name.includes('italian')) return 'monza'
  if (name.includes('spa') || name.includes('belgian')) return 'spa'
  if (name.includes('silverstone') || name.includes('british')) return 'silverstone'
  if (name.includes('suzuka') || name.includes('japanese')) return 'suzuka'
  return 'default'
}
