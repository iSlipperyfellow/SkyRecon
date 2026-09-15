import { motion } from 'framer-motion'
import { Play, Pause, Square, Wifi, Battery, Gauge, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiService } from '@/services/api'

export default function Missions() {
  const [missions, setMissions] = useState([])
  const [selectedMission, setSelectedMission] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const data = await apiService.getMissions()
        setMissions(data)
        setSelectedMission(data[0])
      } catch (error) {
        console.error('Failed to fetch missions:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchMissions()
  }, [])

  const mission = selectedMission

  const signalQuality = {
    excellent: 'text-green-600',
    good: 'text-accent',
    fair: 'text-warning',
    poor: 'text-danger',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Drone Mission Control
        </h2>
        <p className="text-gray-600 dark:text-gray-400">Real-time drone operations and telemetry</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Mission List */}
        <div className="space-y-3">
          {missions.map((m) => (
            <motion.button
              key={m.id}
              whileHover={{ x: 4 }}
              onClick={() => setSelectedMission(m)}
              className={`w-full text-left p-4 rounded-lg transition-all ${
                selectedMission?.id === m.id
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                  : 'glass hover:shadow-lg'
              }`}
            >
              <p className="font-semibold">{m.name}</p>
              <p className="text-xs mt-1 opacity-75">{m.droneId}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${m.status === 'active' ? 'bg-accent' : 'bg-gray-400'}`} />
                <span className="text-xs capitalize">{m.status}</span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Right: Mission Details */}
        {mission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* Main Status */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{mission.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{mission.droneId}</p>
                </div>
                <div className={`px-4 py-2 rounded-lg font-semibold capitalize ${
                  mission.status === 'active'
                    ? 'bg-accent/20 text-accent'
                    : mission.status === 'completed'
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700'
                }`}>
                  {mission.status}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Mission Progress
                  </span>
                  <span className="text-sm font-bold text-primary-600">{mission.progress}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${mission.progress}%` }}
                    className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Speed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mission.speed}
                    <span className="text-xs text-gray-500 ml-1">m/s</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Altitude</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mission.altitude}
                    <span className="text-xs text-gray-500 ml-1">m</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Distance</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mission.coveredDistance}
                    <span className="text-xs text-gray-500 ml-1">km</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Battery</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mission.battery}
                    <span className="text-xs text-gray-500 ml-1">%</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Controls & Telemetry */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Controls */}
              <div className="glass rounded-2xl p-6">
                <h4 className="font-bold text-gray-900 dark:text-white mb-4">Flight Controls</h4>
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={mission.status === 'active'}
                    className="w-full flex items-center justify-center gap-2 bg-accent text-white px-4 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
                  >
                    <Play size={18} /> Start Mission
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={mission.status !== 'active'}
                    className="w-full flex items-center justify-center gap-2 bg-warning text-white px-4 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-warning/90 transition-colors"
                  >
                    <Pause size={18} /> Pause
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 bg-danger text-white px-4 py-3 rounded-lg font-semibold hover:bg-danger/90 transition-colors"
                  >
                    <Square size={18} /> Terminate
                  </motion.button>
                </div>
              </div>

              {/* Telemetry */}
              <div className="glass rounded-2xl p-6">
                <h4 className="font-bold text-gray-900 dark:text-white mb-4">Telemetry</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Wifi size={18} />
                      <span>Signal Quality</span>
                    </div>
                    <span className={`font-semibold capitalize ${signalQuality[mission.signal]}`}>
                      {mission.signal}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Battery size={18} />
                      <span>Battery Level</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{mission.battery}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Gauge size={18} />
                      <span>Drone Status</span>
                    </div>
                    <span className={`font-semibold capitalize ${
                      mission.droneStatus === 'active' ? 'text-accent' : 'text-gray-500'
                    }`}>
                      {mission.droneStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
