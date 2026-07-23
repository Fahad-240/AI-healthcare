import { useState, useEffect } from 'react'
import {
  MdOutlineDescription,
  MdLocalHospital,
  MdArrowForwardIos,
} from 'react-icons/md'
import { FaFlask, FaNotesMedical } from 'react-icons/fa'
import { BASE_URL } from '../config'

function HistoryView() {
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
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ margin: '0 auto 15px', borderTopColor: 'var(--blue-accent)' }}></div>
        <p>Loading your medical history...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="view-header" style={{ textAlign: 'center' }}>
        <h1>Document History</h1>
        <p>View all your previously analyzed lab reports and prescriptions.</p>
      </div>

      <div className="bento-grid">
        {/* Stats */}
        <div className="bento-card" style={{ gridColumn: 'span 6', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-accent)' }}>
            <FaNotesMedical size={32} />
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: '800' }}>{prescriptions.length}</div>
            <div style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Prescriptions Analyzed</div>
          </div>
        </div>

        <div className="bento-card" style={{ gridColumn: 'span 6', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green-accent)' }}>
            <FaFlask size={32} />
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: '800' }}>{reports.length}</div>
            <div style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Lab Reports Analyzed</div>
          </div>
        </div>

        {/* History Lists */}
        <div className="bento-card" style={{ gridColumn: 'span 6' }}>
          <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Prescriptions</h2>
          {prescriptions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No prescriptions analyzed yet.</p>
          ) : (
            <div>
              {prescriptions.map((item) => (
                <div className="history-item-mini" key={item._id}>
                  <div className="item-icon" style={{ background: '#eff6ff', color: 'var(--blue-accent)' }}>
                    <MdLocalHospital size={24} />
                  </div>
                  <div className="item-info">
                    <div className="item-title">Prescription Analysis</div>
                    <div className="item-date">{new Date(item.createdAt).toLocaleDateString()}</div>
                  </div>
                  <button className="btn-outline btn-compact" onClick={() => window.open(item.fileUrl, '_blank')}>View</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bento-card" style={{ gridColumn: 'span 6' }}>
          <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Lab Reports</h2>
          {reports.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No lab reports analyzed yet.</p>
          ) : (
            <div>
              {reports.map((item) => (
                <div className="history-item-mini" key={item._id}>
                  <div className="item-icon" style={{ background: '#dcfce7', color: 'var(--green-accent)' }}>
                    <FaFlask size={24} />
                  </div>
                  <div className="item-info">
                    <div className="item-title">Lab Report Analysis</div>
                    <div className="item-date">{new Date(item.createdAt).toLocaleDateString()}</div>
                  </div>
                  <button className="btn-outline btn-compact" onClick={() => window.open(item.fileUrl, '_blank')}>View</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HistoryView
