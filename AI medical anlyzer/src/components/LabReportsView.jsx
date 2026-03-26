import PropTypes from 'prop-types'
import {
  MdCloudUpload,
  MdWarningAmber,
  MdMoreHoriz,
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
      <div className="view-header">
        <h1>Lab Report Analyzer</h1>
        <p>Extract medicines and dosages from doctor's handwritten or printed prescriptions.</p>
      </div>
      {/* Upload + Interpretation row */}
      <div className="content-grid" style={{ marginBottom: '20px' }}>
        {/* Left: Upload */}
        <section className="panel panel-primary">
          <div className="panel-header">
            <h2>Upload Lab Report</h2>
            <p>
              Upload your other lab reports to get AI-powered
              explanation in simple language.
            </p>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label className="upload-area upload-area-large upload-area-clickable" style={{ flex: 1 }}>
              <input
                type="file"
                accept=".pdf,image/*"
                className="file-input"
                onChange={onFileChange}
                id="labReportUploadInput"
              />
              <div className="upload-icon">
                <FaFlask size={20} />
              </div>
              <p className="upload-title">
                {labReportFile ? labReportFile.name : 'Drop lab report file here'}
              </p>
              <p className="upload-subtitle">
                Image or PDF with clear reference ranges works best.
              </p>
              <button type="button" className="btn-primary">
                {labReportFile ? 'Change File' : 'Select Lab Report'}
              </button>
              {labReportStatus === 'processing' && (
                <p className="upload-status">Scanning & analyzing report…</p>
              )}
            </label>

            {labReportFile && (
              <div style={{ marginTop: '15px', textAlign: 'center' }}>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ borderColor: '#ef4444', color: '#ef4444', padding: '6px 16px', fontSize: '13px' }}
                  onClick={(e) => {
                    e.preventDefault();
                    setLabReportFile(null);
                    setLabReportPreview(null);
                    setLabReportStatus('idle');
                    setLabReportSummary(null);
                    const fileInput = document.getElementById('labReportUploadInput');
                    if (fileInput) fileInput.value = '';
                  }}
                  disabled={labReportStatus === 'processing'}
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
          <div className="panel-footer">
            <span className="badge badge-soft">OCR Ready</span>
            <span className="badge badge-soft">AI Powered</span>
            <span className="badge badge-soft">Abnormal Detection</span>
          </div>
        </section>

        {/* Right: Interpretation */}
        <section className="panel">
          <div className="panel-header-row">
            <div className="panel-header" style={{ marginBottom: 0 }}>
              <h2>AI Interpretation</h2>
              <p>Report analysis results will appear here after upload.</p>
            </div>
            <button className="panel-menu-btn"><MdMoreHoriz size={20} /></button>
          </div>

          {labReportStatus === 'idle' && (
            <section className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '380px' }}>
              <div className="empty-preview">
                <div className="empty-preview-icon-wrapper" style={{ color: '#0ea5e9', boxShadow: '0 12px 25px rgba(14, 165, 233, 0.12)' }}>
                  <FaFlask size={30} />
                </div>
                <h3 className="empty-preview-title">Waiting for Report</h3>
                <p className="empty-preview-text">Upload your lab test report on the left.<br />The AI will extract and analyze the results here.</p>
              </div>
            </section>
          )}

          {labReportStatus === 'processing' && (
            <div className="empty-state">
              <p>Processing report… please wait.</p>
            </div>
          )}

          {labReportStatus === 'ready' && labReportSummary && (
            <div className="lab-summary">
              <div className="lab-summary-block">
                <h3>Overall Overview</h3>
                <p>{labReportSummary.overview}</p>
              </div>
              <div className="lab-summary-block">
                <h3>Key Highlights</h3>
                <ul>
                  {labReportSummary.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="lab-summary-block">
                <h3>Patient-Friendly Advice</h3>
                <p>{labReportSummary.advice}</p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Test Results Table */}
      {labReportStatus === 'ready' && labReportSummary && labReportSummary.results && labReportSummary.results.length > 0 && (
        <section className="panel">
          <div className="panel-header-row">
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
              Lab Test Results
            </h2>
            <button className="panel-menu-btn"><MdMoreHoriz size={20} /></button>
          </div>

          <table className="lab-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Result</th>
                <th>Normal Range</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {labReportSummary.results.map((item, idx) => {
                const isNormal = item.status.toLowerCase() === 'normal' || item.status.toLowerCase() === 'ok';
                const isHigh = item.status.toLowerCase().includes('high');
                const isLow = item.status.toLowerCase().includes('low');

                let statusClass = 'status-soft';
                let StatusIcon = MdError; // Use error icon for anything abnormal

                if (isNormal) {
                  statusClass = 'status-ok';
                  StatusIcon = MdCheckCircle;
                } else if (isHigh || isLow) {
                  statusClass = 'status-low'; // Assuming 'status-low' handles red styling internally
                }

                return (
                  <tr key={idx}>
                    <td>{item.testName}</td>
                    <td><span className={isNormal ? "result-normal" : "result-abnormal"}>{item.result}</span></td>
                    <td>{item.normalRange}</td>
                    <td>
                      <span className={statusClass}>
                        <StatusIcon size={12} /> {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Alert Row if any findings are abnormal */}
          {labReportSummary.results.some(r => r.status.toLowerCase() !== 'normal' && r.status.toLowerCase() !== 'ok') && (
            <div className="lab-alert-row">
              <MdWarningAmber size={18} color="#d97706" />
              <span>
                <strong>Attention:</strong> Some test results are outside the normal reference range. Please consult your doctor.
              </span>
            </div>
          )}
        </section>
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
