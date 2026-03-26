import { useState, useEffect } from 'react'
import {
  MdHistory,
  MdHelpOutline,
  MdPlayCircleOutline,
  MdArrowForwardIos,
  MdDescription,
  MdMedicalServices
} from 'react-icons/md'
import { FaNotesMedical, FaPills } from 'react-icons/fa'

function DashboardView() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const userStr = localStorage.getItem('user');
        let url = 'http://localhost:5000/api/history';
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.email) url += `?email=${encodeURIComponent(user.email)}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        if (result.status === 'success') {
          setHistoryData(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const totalReports = historyData.filter(item => item.type === 'lab_report').length;
  const totalPrescriptions = historyData.filter(item => item.type === 'prescription').length;
  const lastAnalysis = historyData.length > 0 ? new Date(historyData[0].createdAt).toLocaleDateString() : 'No analysis yet';

  return (
    <div className="dashboard-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h2 className="hero-title">
            Your Health, <br />
            <span style={{ color: '#60a5fa' }}>AI-Powered</span> Clarity
          </h2>
          <p className="hero-subtitle">
            Experience the future of medical document analysis. We translate complex medical jargon into simple, actionable insights.
          </p>
          <div className="hero-actions">
            <div className="usage-stat-glass">
              <MdHistory size={18} />
              <span>Last analysis: {loading ? 'Loading...' : lastAnalysis}</span>
            </div>
            <div className="usage-stat-glass">
              <MdMedicalServices size={18} />
              <span>Security: SOC2 Compliant</span>
            </div>
          </div>
        </div>
        <div className="hero-illustration">
          <img
            src="/banner-ai-clean.png"
            alt="AI Medical Illustration"
            style={{
              height: '240px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">
            <FaNotesMedical size={22} color="#2563eb" />
          </div>
          <div>
            <div className="stat-label">Total Reports</div>
            <div className="stat-value">{loading ? '-' : totalReports}</div>
            <div className="stat-sub">Analyzed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green">
            <FaPills size={22} color="#16a34a" />
          </div>
          <div>
            <div className="stat-label">Prescriptions</div>
            <div className="stat-value">{loading ? '-' : totalPrescriptions}</div>
            <div className="stat-sub">Analyzed</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* How to Use Section */}
        <section className="guide-panel">
          <div className="panel-header">
            <h3><MdHelpOutline /> How to Use AI Analyzer?</h3>
          </div>
          <div className="guide-steps">
            <div className="guide-step">
              <div className="step-num">1</div>
              <div className="step-content">
                <h4>Select View</h4>
                <p>Choose "Lab Reports" or "Prescriptions" from the sidebar depending on what you want to analyze.</p>
              </div>
            </div>
            <div className="guide-step">
              <div className="step-num">2</div>
              <div className="step-content">
                <h4>Upload Document</h4>
                <p>Upload a photo or PDF of your medical document. The AI will automatically detect the content.</p>
              </div>
            </div>
            <div className="guide-step">
              <div className="step-num">3</div>
              <div className="step-content">
                <h4>Get Interpretation</h4>
                <p>The AI will explain the test results and doctor's instructions in easy-to-understand language.</p>
              </div>
            </div>
            <div className="guide-step">
              <div className="step-num">4</div>
              <div className="step-content">
                <h4>Save to History</h4>
                <p>Your previous analyses are securely saved in the "History" section for future reference.</p>
              </div>
            </div>
          </div>
          {/* <button className="btn-tutorial">
            <MdPlayCircleOutline size={20} />
            Watch Video Tutorial
          </button> */}
        </section>

        {/* Recent History Summary */}
        <section className="history-summary-panel">
          <div className="panel-header">
            <h3><MdHistory /> Recent Activity</h3>
            <button className="btn-text">View All</button>
          </div>
          <div className="history-list-mini">
            {loading && <p style={{ color: '#94a3b8', padding: '10px 0', fontSize: '13px' }}>Loading activity...</p>}
            {!loading && historyData.length === 0 && (
              <p style={{ color: '#94a3b8', padding: '10px 0', fontSize: '13px' }}>No recent activity to show.</p>
            )}
            {!loading && historyData.slice(0, 3).map((item) => (
              <div className="history-item-mini" key={item._id} onClick={() => window.open(item.fileUrl, '_blank')} style={{ cursor: 'pointer' }}>
                <div className={`item-icon ${item.type === 'prescription' ? 'prescription' : 'report'}`}>
                  {item.type === 'prescription' ? <MdMedicalServices /> : <MdDescription />}
                </div>
                <div className="item-info">
                  <div className="item-title">
                    {item.type === 'prescription' ? 'Prescription Analysis' : 'Lab Report Analysis'}
                  </div>
                  <div className="item-date">
                    {new Date(item.createdAt).toLocaleDateString()} • {item.type === 'prescription' ? 'Prescription' : 'Lab Report'}
                  </div>
                </div>
                <MdArrowForwardIos size={12} color="#94a3b8" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default DashboardView

