import { createContext, useState, useCallback } from 'react'

const SystemContext = createContext()

export function SystemProvider({ children }) {
  const [currentAirport, setCurrentAirport] = useState('kia-karachi')
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notifications, setNotifications] = useState([])

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev)
    document.documentElement.classList.toggle('dark')
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  const addNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now()
    setNotifications((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, duration)
  }, [])

  const value = {
    currentAirport,
    setCurrentAirport,
    darkMode,
    toggleDarkMode,
    sidebarOpen,
    toggleSidebar,
    notifications,
    addNotification,
  }

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>
}

export { SystemContext }
