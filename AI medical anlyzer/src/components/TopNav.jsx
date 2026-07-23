import PropTypes from 'prop-types'
import { VIEWS } from '../constants/views'
import { MdMedicalServices, MdHistory, MdSpaceDashboard, MdScience, MdCloudUpload } from 'react-icons/md'

function TopNav({ currentView, onChangeView }) {
  return (
    <nav className="top-nav">
      <div className="top-nav-container">
        {/* Brand */}
        <div className="nav-brand" onClick={() => onChangeView(VIEWS.DASHBOARD)}>
          <div className="nav-brand-icon">
            <MdMedicalServices size={24} />
          </div>
          <div className="nav-brand-text">AI Analyzer</div>
        </div>

        {/* Links */}
        <div className="nav-links">
          <button
            className={`nav-btn ${currentView === VIEWS.DASHBOARD ? 'active' : ''}`}
            onClick={() => onChangeView(VIEWS.DASHBOARD)}
          >
            <MdSpaceDashboard size={20} /> Dashboard
          </button>
          
          <button
            className={`nav-btn ${currentView === VIEWS.PRESCRIPTIONS ? 'active' : ''}`}
            onClick={() => onChangeView(VIEWS.PRESCRIPTIONS)}
          >
            <MdMedicalServices size={20} /> Prescriptions
          </button>
          
          <button
            className={`nav-btn ${currentView === VIEWS.LAB_REPORTS ? 'active' : ''}`}
            onClick={() => onChangeView(VIEWS.LAB_REPORTS)}
          >
            <MdScience size={20} /> Lab Reports
          </button>
          
          <button
            className={`nav-btn ${currentView === VIEWS.HISTORY ? 'active' : ''}`}
            onClick={() => onChangeView(VIEWS.HISTORY)}
          >
            <MdHistory size={20} /> History
          </button>
        </div>

        {/* CTA */}
        <div className="nav-actions">
          <div className="nav-avatar">G</div>
        </div>
      </div>
    </nav>
  )
}

TopNav.propTypes = {
  currentView: PropTypes.string.isRequired,
  onChangeView: PropTypes.func.isRequired,
}

export default TopNav
