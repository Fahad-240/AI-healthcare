import PropTypes from 'prop-types'
import {
  MdWarningAmber,
  MdCheckCircle,
  MdError,
} from 'react-icons/md'
import { FaFlask } from 'react-icons/fa'

function LabReportsView({
  labReportFile,
  labReportStatus,
  labReportSummary,
  onFileChange,
}) {
  return (
    <div>
      <div className="view-header text-center" style={{ textAlign: 'center' }}>
        <h1>Lab Report Analyzer</h1>
        <p>Extract insights from your blood tests and pathology reports instantly.</p>
      </div>

      {labReportStatus === 'idle' && (
        <div className="focus-upload">
          <label className="upload-area">
            <input
              type="file"
              accept=".pdf,image/*"
              className="file-input"
              onChange={onFileChange}
              id="labReportUploadInput"
            />
            <div className="upload-icon">
              <FaFlask size={48} />
            </div>
            <p className="upload-title">
              {labReportFile ? labReportFile.name : 'Click to Upload Lab Report'}
            </p>
            <p className="upload-subtitle">
              Image or PDF with clear reference ranges works best.
            </p>
            <span className="btn-primary">Select Document</span>
          </label>
        </div>
      )}

      {labReportStatus === 'processing' && (
        <div className="bento-card text-center" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="spinner" style={{ margin: '0 auto 20px', borderTopColor: 'var(--blue-accent)' }}></div>
          <h2>Analyzing your report...</h2>
          <p style={{ color: 'var(--text-muted)' }}>Our AI is extracting medical data. This may take a few seconds.</p>
        </div>
      )}

      {labReportStatus === 'ready' && labReportSummary && (
        <div className="results-panel">
          <div className="bento-grid">
            <div className="bento-card" style={{ gridColumn: 'span 12' }}>
              <h2 style={{ marginTop: 0 }}>Overview</h2>
              <p>{labReportSummary.overview}</p>
            </div>
            
            <div className="bento-card" style={{ gridColumn: 'span 6' }}>
              <h2 style={{ marginTop: 0 }}>Key Highlights</h2>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                {labReportSummary.highlights.map((item) => (
                  <li key={item} style={{ marginBottom: '8px' }}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="bento-card" style={{ gridColumn: 'span 6' }}>
              <h2 style={{ marginTop: 0 }}>Patient Advice</h2>
              <p>{labReportSummary.advice}</p>
            </div>

            <div className="bento-card" style={{ gridColumn: 'span 12' }}>
              <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Test Results</h2>
              <table className="lab-table">
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Result</th>
                    <th>Normal Range</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {labReportSummary.results.map((item, idx) => {
                    const isNormal = item.status.toLowerCase() === 'normal' || item.status.toLowerCase() === 'ok';
                    let statusClass = isNormal ? 'status-ok' : 'status-low';
                    let StatusIcon = isNormal ? MdCheckCircle : MdError;

                    return (
                      <tr key={idx}>
                        <td><strong>{item.testName}</strong></td>
                        <td>{item.result}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{item.normalRange}</td>
                        <td>
                          <span className={statusClass}>
                            <StatusIcon size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> 
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {labReportSummary.results.some(r => r.status.toLowerCase() !== 'normal' && r.status.toLowerCase() !== 'ok') && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#fffbeb', padding: '16px', borderRadius: '12px', marginTop: '24px', color: '#b45309' }}>
                  <MdWarningAmber size={24} />
                  <span><strong>Attention:</strong> Some test results are outside the normal reference range. Please consult your doctor.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

LabReportsView.propTypes = {
  labReportFile: PropTypes.object,
  labReportStatus: PropTypes.string.isRequired,
  labReportSummary: PropTypes.object,
  onFileChange: PropTypes.func.isRequired,
}

export default LabReportsView
