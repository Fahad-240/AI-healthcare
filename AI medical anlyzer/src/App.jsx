import { useState, useEffect } from 'react'
import './App.css'
import { VIEWS } from './constants/views'
import { BASE_URL } from './config'
import TopNav from './components/TopNav'
import DashboardView from './components/DashboardView'
import LabReportsView from './components/LabReportsView'
import HistoryView from './components/HistoryView'
import PrescriptionsView from './components/PrescriptionsView'

function App() {
  const [view, setView] = useState(VIEWS.DASHBOARD)
  const [labReportFile, setLabReportFile] = useState(null)
  const [labReportStatus, setLabReportStatus] = useState('idle') // idle | processing | ready
  const [labReportSummary, setLabReportSummary] = useState(null)

  // Initialize Guest Mode (Device ID)
  useEffect(() => {
    let deviceId = localStorage.getItem('deviceId')
    if (!deviceId) {
      deviceId = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('deviceId', deviceId)
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

    // Add deviceId for anonymous session tracking
    const deviceId = localStorage.getItem('deviceId')
    if (deviceId) {
      formData.append('deviceId', deviceId)
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

  return (
    <div className="modern-app">
      <TopNav currentView={view} onChangeView={setView} />

      <main className="main-content">
        <div className="content-container">
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
        </div>
      </main>
    </div>
  )
}

export default App