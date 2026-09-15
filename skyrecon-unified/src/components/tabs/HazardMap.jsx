import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { MapPin, Navigation } from 'lucide-react'
import { apiService } from '@/services/api'
import airportsData from '@/data/airports.json'

export default function HazardMap() {
  const [hazards, setHazards] = useState([])
  const [selectedAirport, setSelectedAirport] = useState('kia-karachi')
  const [selectedHazard, setSelectedHazard] = useState(null)
  const [loading, setLoading] = useState(true)

  const airport = airportsData.airports.find((a) => a.id === selectedAirport)

  useEffect(() => {
    const fetchHazards = async () => {
      try {
        const data = await apiService.getHazardMap()
        setHazards(data)
      } catch (error) {
        console.error('Failed to fetch hazards:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchHazards()
  }, [])

  const hazardColors = {
    metal: '#ef4444',
    plastic: '#f59e0b',
    organic: '#8b5cf6',
    unknown: '#6b7280',
  }

  const severityLevels = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Hazard Map</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Geospatial debris visualization with real-time hazard tracking
        </p>
      </div>

      {/* Airport Selector */}
      <div className="flex gap-4">
        {airportsData.airports.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelectedAirport(a.id)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              selectedAirport === a.id
                ? 'bg-primary-600 text-white'
                : 'glass hover:shadow-lg'
            }`}
          >
            {a.code}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        {airport && (
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl overflow-hidden aspect-video relative"
            >
              <svg
                viewBox="0 0 1000 600"
                className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900"
              >
                {/* Grid */}
                <defs>
                  <pattern id="mapGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(100, 150, 200, 0.2)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="1000" height="600" fill="url(#mapGrid)" />

                {/* Runways */}
                {airport.runways.map((runway) => (
                  <g key={runway.id}>
                    <rect x="200" y="150" width="600" height="80" fill="rgba(100, 100, 100, 0.1)" stroke="#666" strokeWidth="2" />
                    <text x="210" y="200" fontSize="12" fill="#666" fontWeight="bold">
                      {runway.name}
                    </text>
                  </g>
                ))}

                {/* Hazard Markers */}
                {hazards.map((hazard) => (
                  <motion.g
                    key={hazard.id}
                    onClick={() => setSelectedHazard(hazard)}
                    style={{ cursor: 'pointer' }}
                    whileHover={{ scale: 1.3 }}
                  >
                    <circle
                      cx={300 + Math.random() * 400}
                      cy={150 + Math.random() * 300}
                      r="15"
                      fill={hazardColors[hazard.type]}
                      opacity="0.8"
                    />
                    <circle
                      cx={300 + Math.random() * 400}
                      cy={150 + Math.random() * 300}
                      r="15"
                      fill="none"
                      stroke={hazardColors[hazard.type]}
                      strokeWidth="2"
                      opacity="0.4"
                    >
                      <animate attributeName="r" from="15" to="25" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  </motion.g>
                ))}

                {/* Drone icon */}
                <motion.g animate={{ x: [0, 100, 0], y: [0, 50, 0] }} transition={{ duration: 10, repeat: Infinity }}>
                  <circle cx="500" cy="300" r="10" fill="#10b981" />
                  <path d="M500 290 L505 310 L500 305 L495 310 Z" fill="#10b981" />
                </motion.g>
              </svg>

              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 bg-black/50 px-4 py-3 rounded-lg text-white text-xs space-y-1">
                <p className="font-semibold mb-2">Hazard Types</p>
                {Object.entries(hazardColors).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Hazard Details */}
        <div className="glass rounded-2xl p-6 h-fit max-h-96 overflow-y-auto">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Active Hazards</h3>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading...</div>
            ) : hazards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No active hazards</div>
            ) : (
              hazards.map((hazard) => (
                <motion.button
                  key={hazard.id}
                  whileHover={{ x: 4 }}
                  onClick={() => setSelectedHazard(hazard)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedHazard?.id === hazard.id
                      ? 'bg-primary-100 dark:bg-primary-900/30 border-l-4 border-primary-600'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: hazardColors[hazard.type] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white capitalize">
                        {hazard.type}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Severity: {severityLevels[hazard.severity]}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Score: {hazard.score.toFixed(1)}/10
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
