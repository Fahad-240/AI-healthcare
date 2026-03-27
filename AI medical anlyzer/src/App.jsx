import { useState, useEffect } from 'react'
import './App.css'
import { VIEWS } from './constants/views'
import { BASE_URL } from './config'
import Sidebar from './components/Sidebar'
import HeaderBar from './components/HeaderBar'
import DashboardView from './components/DashboardView'
import LabReportsView from './components/LabReportsView'
import HistoryView from './components/HistoryView'
import LoginSignupView from './components/LoginSignupView'
import PrescriptionsView from './components/PrescriptionsView'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [view, setView] = useState(VIEWS.DASHBOARD)
  const [labReportFile, setLabReportFile] = useState(null)
  const [labReportStatus, setLabReportStatus] = useState('idle') // idle | processing | ready
  const [labReportSummary, setLabReportSummary] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Prescription side state can be internal to PrescriptionsView now
  // as per the user's request for "separate pages"

  // Check if user is already logged in
  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLabReportChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLabReportFile(file)
    setLabReportStatus('processing')
    setLabReportSummary(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'lab_report')

    // Add user email if authenticated
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      if (user.email) formData.append('email', user.email)
    }

    try {
      const response = await fetch(`${BASE_URL}/api/analyze-document`, {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()

      if (result.status === 'success') {
        setLabReportStatus('ready')
        setLabReportSummary(result.data)
      } else {
        console.error('API Error:', result.message)
        setLabReportStatus('idle')
        alert('Analysis Failed: ' + (result.message || 'Unknown error'))
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setLabReportStatus('idle')
      alert('Network Error: Could not connect to the AI Backend.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setView(VIEWS.DASHBOARD)
  }

  // If not authenticated, show login/signup page
  if (!isAuthenticated) {
    return <LoginSignupView onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <div className={`app-shell ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar 
        currentView={view} 
        onChangeView={(v) => {
          setView(v)
          setIsSidebarOpen(false)
        }} 
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="main">
        <HeaderBar
          currentView={view}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onGoDashboard={() => {
            setView(VIEWS.DASHBOARD)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onNewUpload={() => {
            if (view === VIEWS.LAB_REPORTS) {
              setView(VIEWS.LAB_REPORTS)
            } else if (view === VIEWS.PRESCRIPTIONS) {
              setView(VIEWS.PRESCRIPTIONS)
            } else {
              setView(VIEWS.DASHBOARD)
            }
          }}
          onLogout={handleLogout}
        />

        <main>
          {view === VIEWS.DASHBOARD && <DashboardView />}

          {view === VIEWS.LAB_REPORTS && (
            <LabReportsView
              labReportFile={labReportFile}
              labReportStatus={labReportStatus}
              labReportSummary={labReportSummary}
              onFileChange={handleLabReportChange}
            />
          )}

          {view === VIEWS.PRESCRIPTIONS && <PrescriptionsView />}

          {view === VIEWS.HISTORY && <HistoryView />}
        </main>
      </div>
    </div>
  )
}

export default App