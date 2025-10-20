export async function fetchLatestRace() {
  // Ergast.com is shutdown; using Jolpica F1 API (Ergast replacement)
  // Fetch this season's results to find the last completed race
  const res = await fetch('https://api.jolpi.ca/ergast/f1/current/results.json')
  if (!res.ok) throw new Error('Failed to fetch latest race')
  const data = await res.json()
  // Find most recent round from MRData.RaceTable.Races
  const races = data.MRData?.RaceTable?.Races || []
  const last = races[races.length - 1]
  // Minimal shape: season and round
  return { season: last?.season || 'current', round: last?.round || '1', raceName: last?.raceName || 'Unknown' }
}

export async function fetchRaceDrivers(season: string, round: string) {
  // Fetch drivers from race results using Jolpica API
  const resultsRes = await fetch(`https://api.jolpi.ca/ergast/f1/${season}/${round}/results.json`)
  if (!resultsRes.ok) throw new Error('Failed to fetch race data')
  const results = await resultsRes.json()
  const driverList = (results.MRData?.RaceTable?.Races?.[0]?.Results || []).map((r: any) => ({ driverId: r.Driver.driverId, givenName: r.Driver.givenName, familyName: r.Driver.familyName, code: r.Driver.code }))
  return driverList
}

export async function fetchLapTimes(season: string, round: string) {
  // Fetch laps for race using Jolpica API (max 2000 entries default, but use paging if needed)
  const url = `https://api.jolpi.ca/ergast/f1/${season}/${round}/laps.json?limit=2000`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch lap times')
  const data = await res.json()
  // data.MRData.RaceTable.Races[0].Laps -> array of laps; each lap has Timings array per driver
  const laps = data.MRData?.RaceTable?.Races?.[0]?.Laps || []
  return laps
}

export async function fetchPitStops(season: string, round: string) {
  // Fetch pit stop data to determine tyre stints
  const url = `https://api.jolpi.ca/ergast/f1/${season}/${round}/pitstops.json`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch pit stops')
  const data = await res.json()
  // data.MRData.RaceTable.Races[0].PitStops -> array of pit stops
  const pitStops = data.MRData?.RaceTable?.Races?.[0]?.PitStops || []
  return pitStops
}
