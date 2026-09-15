import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { apiService } from '@/services/api'

export default function DetectionFeed() {
  const [detections, setDetections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDetections = async () => {
      try {
        const data = await apiService.getDetections()
        setDetections(data)
      } catch (error) {
        console.error('Failed to fetch detections:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDetections()

    const interval = setInterval(fetchDetections, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Live Detection Feed</h2>
        <p className="text-gray-600 dark:text-gray-400">Real-time object detection from drone cameras</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Camera Feed */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl overflow-hidden aspect-video relative"
          >
            {/* Simulated camera feed */}
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black relative">
              <svg viewBox="0 0 800 600" className="w-full h-full">
                {/* Grid pattern */}
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(100, 150, 200, 0.1)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="800" height="600" fill="url(#grid)" />

                {/* Detection bounding boxes */}
                {detections.map((det, i) => (
                  <motion.g
                    key={det.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <rect
                      x={det.bbox.x}
                      y={det.bbox.y}
                      width={det.bbox.width}
                      height={det.bbox.height}
                      fill="none"
                      stroke={det.color}
                      strokeWidth="2"
                    />
                    <text
                      x={det.bbox.x + 5}
                      y={det.bbox.y - 5}
                      fill={det.color}
                      fontSize="14"
                      fontFamily="monospace"
                    >
                      {det.class} {(det.confidence * 100).toFixed(0)}%
                    </text>
                  </motion.g>
                ))}
              </svg>

              {/* Overlay stats */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white bg-black/50 px-3 py-2 rounded">
                <span>FPS: 30</span>
                <span>Resolution: 1920x1440</span>
                <span>Objects: {detections.length}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Detection List */}
        <div className="glass rounded-2xl p-6 h-fit">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Recent Detections</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading...</div>
            ) : detections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No detections</div>
            ) : (
              detections.map((det, i) => (
                <motion.div
                  key={det.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-4"
                  style={{ borderColor: det.color }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">
                        {det.class}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Confidence: {(det.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div
                      className="w-8 h-8 rounded-lg"
                      style={{ backgroundColor: det.color }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(det.timestamp).toLocaleTimeString()}
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
