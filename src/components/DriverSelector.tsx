import React from 'react'

export default function DriverSelector({ drivers, selected, onChange }: any) {
  if (!drivers) return <div>Loading drivers...</div>

  function toggle(id: string) {
    if (selected.includes(id)) onChange(selected.filter((s: string) => s !== id))
    else onChange([...selected, id])
  }

  return (
    <div className="driver-selector">
      <h3>Drivers</h3>
      <div className="driver-list">
        {drivers.map((d: any) => (
          <button key={d.driverId} className={selected.includes(d.driverId) ? 'sel' : ''} onClick={() => toggle(d.driverId)}>
            {d.code || d.givenName}
          </button>
        ))}
      </div>
    </div>
  )
}
