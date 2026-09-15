interface Detection {
  id: string;
  label: string;
  confidence: number;
  geometry: any;
  hazard_score?: number;
  hazard_level?: string;
  timestamp: string;
  image_url?: string;
}

interface DetectionPanelProps {
  detection: Detection;
}

export default function DetectionPanel({ detection }: DetectionPanelProps) {
  const hazardColor = {
    HIGH: 'text-red-600 bg-red-50',
    MEDIUM: 'text-yellow-600 bg-yellow-50',
    LOW: 'text-blue-600 bg-blue-50',
  }[detection.hazard_level || 'LOW'];

  return (
    <div className="bg-white border-t border-gray-200 p-4 max-h-48 overflow-y-auto">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold">{detection.label.toUpperCase()}</h3>
          <p className="text-sm text-gray-500">{new Date(detection.timestamp).toLocaleString()}</p>
        </div>
        <div className={`px-3 py-1 rounded-full font-semibold ${hazardColor}`}>
          {detection.hazard_level || 'UNKNOWN'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Confidence</p>
          <p className="text-lg font-semibold">{(detection.confidence * 100).toFixed(1)}%</p>
        </div>
        {detection.hazard_score !== undefined && (
          <div>
            <p className="text-sm text-gray-500">Hazard Score</p>
            <p className="text-lg font-semibold">{detection.hazard_score.toFixed(3)}</p>
          </div>
        )}
        <div>
          <p className="text-sm text-gray-500">Location</p>
          <p className="text-lg font-semibold">{detection.geometry.coordinates[1].toFixed(4)}, {detection.geometry.coordinates[0].toFixed(4)}</p>
        </div>
      </div>

      {detection.image_url && (
        <div>
          <p className="text-sm text-gray-500 mb-2">Detection Image</p>
          <img
            src={detection.image_url}
            alt="Detection"
            className="w-full max-h-32 object-cover rounded"
          />
        </div>
      )}
    </div>
  );
}
