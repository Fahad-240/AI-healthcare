import PropTypes from 'prop-types'
import { VIEWS } from '../constants/views'
import {
  MdNotificationsNone,
  MdDashboard,
  MdCloudUpload,
  MdLogout,
  MdMenu,
} from 'react-icons/md'

function HeaderBar({ currentView, onGoDashboard, onNewUpload, onLogout, onOpenSidebar }) {
  const titles = {
    [VIEWS.DASHBOARD]: {
      title: 'AI Health Care Prescription & Medical Report Analyzer',
      subtitle: 'Smart Analysis of Prescriptions & Health Reports',
    },
    [VIEWS.LAB_REPORTS]: {
      title: 'Scan & Analyze Lab Reports',
      subtitle: 'Upload blood work and diagnostic reports to highlight abnormal values.',
    },
    [VIEWS.HISTORY]: {
      title: 'Prescription & Report History',
      subtitle: 'Review previous prescriptions and reports anytime.',
    },
  }

  const current = titles[currentView] || titles[VIEWS.DASHBOARD]

  // Get user name from localStorage
  const user = localStorage.getItem('user')
  let userName = 'User'
  if (user) {
    try {
      const userData = JSON.parse(user)
      userName = userData?.name?.split(' ')[0] || 'User'
    } catch (e) {
      userName = 'User'
    }
  }

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          type="button" 
          className="menu-toggle-btn" 
          onClick={onOpenSidebar}
          aria-label="Open Menu"
        >
          <MdMenu size={24} />
        </button>
        <div>
          <h1 className="page-title">{current.title}</h1>
          <p className="page-subtitle">{current.subtitle}</p>
        </div>
      </div>

      <div className="topbar-actions">

        <button
          type="button"
          className="btn-secondary btn-compact"
          onClick={onGoDashboard}
        >
          <MdDashboard size={14} />
          Dashboard
        </button>

        <div className="topbar-avatar" title={userName}>
          {userName.charAt(0).toUpperCase()}
        </div>
        <button
          type="button"
          className="topbar-logout"
          onClick={onLogout}
          title="Logout"
        >
          <MdLogout size={18} />
        </button>
      </div>
    </header>
  )
}

HeaderBar.propTypes = {
  currentView: PropTypes.string.isRequired,
  onGoDashboard: PropTypes.func.isRequired,
  onNewUpload: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  onOpenSidebar: PropTypes.func.isRequired,
}

export default HeaderBar
