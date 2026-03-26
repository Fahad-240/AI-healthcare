import PropTypes from 'prop-types'
import { VIEWS } from '../constants/views'
import {
  MdDashboard,
  MdOutlineDescription,
  MdMedication,
  MdNotificationsNone,
  MdLogout,
  MdClose,
} from 'react-icons/md'

function Sidebar({ currentView, onChangeView, onLogout, isOpen, onClose }) {
  const isActive = (view) =>
    currentView === view ? 'nav-item nav-item-active' : 'nav-item'

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
    <aside 
      className={`sidebar ${isOpen ? 'sidebar-active' : ''}`}
      style={isOpen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '280px',
        height: '100vh',
        zIndex: 9999,
        transition: 'left 0.3s ease',
        display: 'flex',
        flexDirection: 'column'
      } : {}}
    >
      <button className="sidebar-close-btn" onClick={onClose} aria-label="Close Menu">
        <MdClose size={24} />
      </button>
      <div className="brand">
        <div className="brand-icon">
          <span style={{ fontSize: '18px', color: '#1a56db' }}>＋</span>
        </div>
        <div>
          <div className="brand-title">AI Health Care</div>
          <div className="brand-subtitle">Medical Report Analyzer</div>
        </div>
      </div>

      <nav className="nav" aria-label="Main navigation">
        <button
          type="button"
          className={isActive(VIEWS.DASHBOARD)}
          onClick={() => onChangeView(VIEWS.DASHBOARD)}
        >
          <MdDashboard className="nav-icon" />
          Dashboard
        </button>
        <button
          type="button"
          className={isActive(VIEWS.LAB_REPORTS)}
          onClick={() => onChangeView(VIEWS.LAB_REPORTS)}
        >
          <MdOutlineDescription className="nav-icon" />
          Lab Reports
        </button>
        <button
          type="button"
          className={isActive(VIEWS.PRESCRIPTIONS)}
          onClick={() => onChangeView(VIEWS.PRESCRIPTIONS)}
        >
          <MdMedication className="nav-icon" />
          Prescriptions
        </button>
        <button
          type="button"
          className={isActive(VIEWS.HISTORY)}
          onClick={() => onChangeView(VIEWS.HISTORY)}
        >
          <MdNotificationsNone className="nav-icon" />
          History & Alerts
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">{userName.charAt(0).toUpperCase()}</div>
          <div>
            <div className="user-name">{userName}</div>
            <div className="user-role">Patient Workspace</div>
          </div>
        </div>
        <button
          type="button"
          className="btn-logout"
          onClick={onLogout}
          title="Logout"
        >
          <MdLogout size={18} />
        </button>
      </div>
    </aside>
  )
}

Sidebar.propTypes = {
  currentView: PropTypes.string.isRequired,
  onChangeView: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default Sidebar
