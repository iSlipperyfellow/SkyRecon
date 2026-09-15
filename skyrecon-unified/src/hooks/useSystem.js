import { useContext } from 'react'
import { SystemContext } from '@/context/SystemContext'

export function useSystem() {
  const context = useContext(SystemContext)
  if (!context) {
    throw new Error('useSystem must be used within SystemProvider')
  }
  return context
}
