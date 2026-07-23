import { useState, useEffect } from 'react'
import {
  MdHistory,
  MdArrowForwardIos,
  MdDescription,
  MdMedicalServices,
  MdScience,
  MdUploadFile
} from 'react-icons/md'
import { BASE_URL } from '../config'

function DashboardView() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const deviceId = localStorage.getItem('deviceId');
        let url = `${BASE_URL}/api/history`;
        if (deviceId) {
          url += `?deviceId=${encodeURIComponent(deviceId)}`;
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

  return (
    <div className="bento-grid">
      {/* Hero Section */}
      <div className="bento-card bento-hero">
        <div>
          <h1>Your Health, <br/>AI-Powered Clarity</h1>
          <p>Experience the future of medical document analysis. We translate complex medical jargon into simple, actionable insights instantly.</p>
        </div>
        <MdMedicalServices size={120} style={{ opacity: 0.2, position: 'absolute', right: '40px' }} />
      </div>

      {/* Stats */}
      <div className="bento-card bento-stat">
        <MdScience size={32} color="#2563eb" />
        <div className="stat-value">{loading ? '-' : totalReports}</div>
        <div className="stat-label">Lab Reports Analyzed</div>
      </div>

      <div className="bento-card bento-stat">
        <MdMedicalServices size={32} color="#10b981" />
        <div className="stat-value">{loading ? '-' : totalPrescriptions}</div>
        <div className="stat-label">Prescriptions Decoded</div>
      </div>

      <div className="bento-card bento-stat">
        <MdHistory size={32} color="#8b5cf6" />
        <div className="stat-value">{loading ? '-' : historyData.length}</div>
        <div className="stat-label">Total Documents Saved</div>
      </div>

      {/* Actions */}
      <div className="bento-card bento-action">
        <div className="bento-action-icon">
          <MdScience size={32} />
        </div>
        <h3>Analyze Lab Report</h3>
        <p style={{ color: 'var(--text-muted)' }}>Upload blood tests or pathology reports for simple explanations.</p>
      </div>

      <div className="bento-card bento-action">
        <div className="bento-action-icon">
          <MdMedicalServices size={32} />
        </div>
        <h3>Decode Prescription</h3>
        <p style={{ color: 'var(--text-muted)' }}>Extract dosages and doctor advice from handwritten prescriptions.</p>
      </div>

      {/* Recent History */}
      <div className="bento-card bento-history">
        <h3 style={{ marginTop: 0, marginBottom: '24px' }}>Recent Activity</h3>
        <div>
          {loading && <p style={{ color: 'var(--text-muted)' }}>Loading activity...</p>}
          {!loading && historyData.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>No recent activity to show. Upload your first document!</p>
          )}
          {!loading && historyData.slice(0, 3).map((item) => (
            <div className="history-item-mini" key={item._id} onClick={() => window.open(item.fileUrl, '_blank')} style={{ cursor: 'pointer' }}>
              <div className="item-icon">
                {item.type === 'prescription' ? <MdMedicalServices color="#10b981" /> : <MdDescription color="#2563eb" />}
              </div>
              <div className="item-info">
                <div className="item-title">
                  {item.type === 'prescription' ? 'Prescription Analysis' : 'Lab Report Analysis'}
                </div>
                <div className="item-date">
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
              <MdArrowForwardIos size={12} color="var(--text-muted)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DashboardView
