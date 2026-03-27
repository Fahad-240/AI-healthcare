import { useState } from 'react'
import { MdCloudUpload, MdDescription, MdHistory, MdAutoGraph, MdWarning, MdCheckCircle } from 'react-icons/md'
import { BASE_URL } from '../config'

function PrescriptionsView() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [status, setStatus] = useState('idle') // idle | processing | ready
  const [analysis, setAnalysis] = useState(null)

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setStatus('processing')
    setAnalysis(null)

    // Generate preview URL
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
    } else if (selectedFile.type === 'application/pdf') {
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('type', 'prescription')

    // Add user email if authenticated
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      if (user.email) formData.append('email', user.email)
    }

    try {
      const response = await fetch(`${BASE_URL}/api/analyze-document`, {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()

      if (result.status === 'success') {
        setStatus('ready')
        setAnalysis(result.data)
      } else {
        console.error('API Error:', result.message)
        setStatus('idle')
        alert('Analysis Failed: ' + (result.message || 'Unknown error'))
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setStatus('idle')
      alert('Network Error: Could not connect to the AI Backend.')
    }
  }

  return (
    <div>
      <div className="view-header">
        <h1>Prescription Analyzer</h1>
        <p>Extract medicines and dosages from doctor's handwritten or printed prescriptions.</p>
      </div>

      <div className="content-grid" style={{ marginBottom: '20px' }}>
        {/* Top Row: Left - Upload | Right - Preview */}
        <section className="panel panel-primary upload-panel">
          <div className="panel-header">
            <h2>Upload Prescription</h2>
            <p>Clear image of handwritten parchment works best.</p>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label className={`upload-area upload-area-large upload-area-clickable ${status === 'processing' ? 'processing' : ''}`} style={{ flex: 1 }}>
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="file-input"
                id="prescriptionUploadInput"
              />
              <div className="upload-icon">
                <MdCloudUpload size={20} />
              </div>
              <p className="upload-title">{file ? file.name : 'Select Prescription Photo'}</p>
              <button type="button" className="btn-primary">{file ? 'Change File' : 'Select File'}</button>
              {status === 'processing' && (
                <p className="upload-status">AI is scanning prescription text...</p>
              )}
            </label>

            {file && (
              <div style={{ marginTop: '15px', textAlign: 'center' }}>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ borderColor: '#ef4444', color: '#ef4444', padding: '6px 16px', fontSize: '13px' }}
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                    setPreviewUrl(null);
                    setStatus('idle');
                    setAnalysisResult(null);
                    const fileInput = document.getElementById('prescriptionUploadInput');
                    if (fileInput) fileInput.value = '';
                  }}
                  disabled={status === 'processing'}
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>

          <div className="panel-footer">
            <span className="badge badge-soft"><MdAutoGraph /> Dosage Extraction</span>
            <span className="badge badge-soft"><MdDescription /> Med Name Registry</span>
          </div>
        </section>

        <section className="panel file-preview-panel">
          <div className="panel-header">
            <h2>Prescription Preview</h2>
            <p>Visual confirmation of uploaded document.</p>
          </div>

          <div className="preview-window">
            {!previewUrl && (
              <div className="empty-preview">
                <div className="empty-preview-icon-wrapper">
                  <MdDescription size={32} />
                </div>
                <h3 className="empty-preview-title">No Document Found</h3>
                <p className="empty-preview-text">Upload a clear photo or PDF of the prescription to view it here.</p>
              </div>
            )}
            {previewUrl && file?.type.startsWith('image/') && (
              <img src={previewUrl} alt="Prescription Preview" className="preview-img" />
            )}
            {previewUrl && file?.type === 'application/pdf' && (
              <div className="pdf-preview-box">
                <MdDescription size={48} color="#2563eb" />
                <p>PDF Loaded: {file.name}</p>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="btn-text">
                  Open PDF in New Tab
                </a>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Bottom Row: Results */}
      <section className="panel analysis-results-panel">
        <div className="panel-header">
          <h2>AI Analysis Results</h2>
          <p>Detected medications and usage instructions.</p>
        </div>

        {status === 'idle' && (
          <div className="empty-state">
            <MdAutoGraph size={40} color="#2563eb" style={{ opacity: 0.3, marginBottom: '10px' }} />
            <p>Analysis results will appear here after upload.</p>
          </div>
        )}

        {status === 'processing' && (
          <div className="empty-state">
            <div className="spinner" style={{ marginBottom: '10px' }}></div>
            <p>Extracting data... Please hold on.</p>
          </div>
        )}

        {status === 'ready' && analysis && (
          <div className="prescription-results-full">
            <div className="medication-grid">
              {analysis.medications.map((med, idx) => (
                <div key={idx} className="med-box">
                  <div className="med-header">
                    <span className="med-title">{med.name}</span>
                    <span className="med-tag">{med.dosage}</span>
                  </div>
                  <div className="med-details">
                    <div className="detail-row"><span>Duration:</span> <strong>{med.duration}</strong></div>
                    <div className="detail-row"><span>Intake:</span> <strong>{med.instructions}</strong></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ai-instructions-container">
              <div className="instruction-header">
                <MdCheckCircle color="#10b981" size={20} />
                <h3>Doctor's Advice Summary</h3>
              </div>
              <div className="instruction-body">
                <p>{analysis.advice}</p>
                <div className="follow-up-tag">
                  <strong>Next Visit:</strong> {analysis.followUp}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default PrescriptionsView
