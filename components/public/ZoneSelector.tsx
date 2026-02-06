'use client';

import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { ZONES_BY_STATE, STATES, getZoneByCode, DEFAULT_ZONE } from '@/lib/zones';

interface ZoneSelectorProps {
  onZoneChange: (zoneCode: string) => void;
  currentZone: string;
}

export default function ZoneSelector({ onZoneChange, currentZone }: ZoneSelectorProps) {
  const [selectedZone, setSelectedZone] = useState(currentZone);
  const currentZoneInfo = getZoneByCode(selectedZone);

  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newZone = e.target.value;
    setSelectedZone(newZone);
    onZoneChange(newZone);
  };

  return (
    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
      <MapPin className="h-5 w-5 flex-shrink-0" />
      <select
        value={selectedZone}
        onChange={handleZoneChange}
        className="bg-transparent border-none text-white font-medium focus:outline-none focus:ring-0 cursor-pointer appearance-none pr-8 w-full md:w-auto"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '1.5em 1.5em',
        }}
      >
        {STATES.map((state) => (
          <optgroup key={state} label={state} className="bg-gray-900 text-white">
            {ZONES_BY_STATE[state].map((zone) => (
              <option 
                key={zone.code} 
                value={zone.code}
                className="bg-gray-800 text-white py-2"
              >
                {zone.code} - {zone.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}