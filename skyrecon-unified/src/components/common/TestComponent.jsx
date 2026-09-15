export default function TestComponent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">SkyRecon</h1>
        <p className="text-gray-600 mb-6">Enterprise Drone Detection System</p>
        
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-6">
          <p className="text-green-800">✅ Frontend is loading correctly!</p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
          <p className="text-blue-800">🚀 React and Tailwind CSS are working</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-600"><strong>Ports:</strong></p>
          <p className="text-sm text-gray-700">Frontend: http://localhost:5174</p>
          <p className="text-sm text-gray-700">Backend: http://localhost:3001</p>
        </div>
      </div>
    </div>
  )
}
