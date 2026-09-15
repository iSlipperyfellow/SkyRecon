import { useState, useEffect } from 'react'
import { AuthProvider, AuthContext } from '@/context/AuthContext'
import { SystemProvider } from '@/context/SystemContext'
import { useContext } from 'react'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import TestComponent from '@/components/common/TestComponent'
import Login from '@/components/auth/Login'
import Dashboard from '@/components/tabs/Dashboard'
import Alerts from '@/components/tabs/Alerts'
import Missions from '@/components/tabs/Missions'
import DetectionFeed from '@/components/tabs/DetectionFeed'
import HazardMap from '@/components/tabs/HazardMap'
import Analytics from '@/components/tabs/Analytics'
import ModelManagement from '@/components/tabs/ModelManagement'
import AdminPanel from '@/components/tabs/AdminPanel'
import Settings from '@/components/tabs/Settings'
import { Toaster } from 'sonner'

function AppContent() {
  return <TestComponent />
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SystemProvider>
          <AppContent />
          <Toaster position="bottom-right" />
        </SystemProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
