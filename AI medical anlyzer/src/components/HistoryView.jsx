import { useState, useEffect } from 'react'
import {
  MdMoreHoriz,
  MdOutlineDescription,
  MdLocalHospital,
  MdFavorite,
  MdBloodtype,
  MdWarningAmber,
} from 'react-icons/md'
import { FaFlask, FaPills, FaNotesMedical } from 'react-icons/fa'

function HistoryView() {
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
        console.error('Failed to fetch history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const prescriptions = historyData.filter(item => item.type === 'prescription');
  const reports = historyData.filter(item => item.type === 'lab_report');

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <div className="spinner" style={{ margin: '0 auto 15px' }}></div>
        <p>Loading your medical history...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="stats-row" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">
            <FaNotesMedical size={22} color="#2563eb" />
          </div>
          <div>
            <div className="stat-label">Total Prescriptions</div>
            <div className="stat-value">{prescriptions.length}</div>
            <div className="stat-sub">Analyzed by AI</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green">
            <FaFlask size={20} color="#16a34a" />
          </div>
          <div>
            <div className="stat-label">Lab Reports</div>
            <div className="stat-value">{reports.length}</div>
            <div className="stat-sub">Analyzed by AI</div>
          </div>
        </div>
      </div>

      <div className="content-grid">
        {/* Left: Prescription History */}
        <section className="panel">
          <div className="panel-header-row">
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
              Recent Prescriptions
            </h2>
            <button className="panel-menu-btn"><MdMoreHoriz size={20} /></button>
          </div>
          <ul className="history-list" style={{ marginTop: '12px' }}>
            {prescriptions.map((item) => (
              <li key={item._id} className="history-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="history-item-icon"><MdLocalHospital size={20} color="#2563eb" /></div>
                  <div>
                    <div className="history-title">Prescription Analysis</div>
                    <div className="history-meta">{new Date(item.createdAt).toLocaleDateString()} · AI Analyzed</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" className="btn-outline btn-compact" onClick={() => window.open(item.fileUrl, '_blank')}>
                    View File
                  </button>
                </div>
              </li>
            ))}
            {prescriptions.length === 0 && <p style={{ color: '#64748b', fontSize: '14px', padding: '10px 0' }}>No prescription history found.</p>}
          </ul>
        </section>

        {/* Right: Lab Report History */}
        <section className="panel">
          <div className="panel-header-row">
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
              Recent Lab Reports
            </h2>
            <button className="panel-menu-btn"><MdMoreHoriz size={20} /></button>
          </div>
          <ul className="history-list" style={{ marginTop: '12px' }}>
            {reports.map((item) => (
              <li key={item._id} className="history-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="history-item-icon"><FaFlask size={18} color="#2563eb" /></div>
                  <div>
                    <div className="history-title">Lab Report Analysis</div>
                    <div className="history-meta">{new Date(item.createdAt).toLocaleDateString()} · AI Analyzed</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" className="btn-outline btn-compact" onClick={() => window.open(item.fileUrl, '_blank')}>
                    View File
                  </button>
                </div>
              </li>
            ))}
            {reports.length === 0 && <p style={{ color: '#64748b', fontSize: '14px', padding: '10px 0' }}>No lab report history found.</p>}
          </ul>
        </section>
      </div>

      {/* Timeline */}
      <section className="panel" style={{ marginTop: '20px' }}>
        <div className="panel-header-row">
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
            Activity Timeline
          </h2>
        </div>
        <ul className="timeline" style={{ marginTop: '16px' }}>
          {historyData.slice(0, 5).map(item => (
            <li key={item._id} className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-title">{item.type === 'prescription' ? 'Prescription Uploaded & Analyzed' : 'Lab Report Uploaded & Analyzed'}</div>
                <p className="timeline-text">{new Date(item.createdAt).toLocaleString()} · Data extracted successfully</p>
              </div>
            </li>
          ))}
          {historyData.length === 0 && <p style={{ color: '#64748b', fontSize: '14px' }}>No timeline activity.</p>}
        </ul>
      </section>
    </div>
  )
}

export default HistoryView
