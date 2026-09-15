import { useState, useEffect, useCallback } from 'react'

export function useWebSocket(url) {
  const [data, setData] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const ws = new WebSocket(url)

    ws.onopen = () => setIsConnected(true)
    ws.onmessage = (event) => {
      try {
        setData(JSON.parse(event.data))
      } catch (e) {
        console.error('WebSocket parse error:', e)
      }
    }
    ws.onerror = (event) => setError(event)
    ws.onclose = () => setIsConnected(false)

    return () => ws.close()
  }, [url])

  return { data, isConnected, error }
}
