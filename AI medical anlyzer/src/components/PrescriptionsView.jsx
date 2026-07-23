import { useState } from 'react'
import { MdMedicalServices, MdCheckCircle } from 'react-icons/md'
import { BASE_URL } from '../config'

function PrescriptionsView() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle | processing | ready
  const [analysis, setAnalysis] = useState(null)

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setStatus('processing')
    setAnalysis(null)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('type', 'prescription')

    const deviceId = localStorage.getItem('deviceId')
    if (deviceId) {
      formData.append('deviceId', deviceId)
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
      <div className="view-header" style={{ textAlign: 'center' }}>
        <h1>Prescription Decoder</h1>
        <p>Extract medicines, dosages, and doctor instructions from handwritten prescriptions.</p>
      </div>

      {status === 'idle' && (
        <div className="focus-upload">
          <label className="upload-area">
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*,.pdf"
              className="file-input"
            />
            <div className="upload-icon">
              <MdMedicalServices size={48} />
            </div>
            <p className="upload-title">
              {file ? file.name : 'Click to Upload Prescription'}
            </p>
            <p className="upload-subtitle">
              Clear photos of handwritten parchment work best.
            </p>
            <span className="btn-primary">Select Photo</span>
          </label>
        </div>
      )}

      {status === 'processing' && (
        <div className="bento-card text-center" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="spinner" style={{ margin: '0 auto 20px', borderTopColor: 'var(--blue-accent)' }}></div>
          <h2>Decoding doctor handwriting...</h2>
          <p style={{ color: 'var(--text-muted)' }}>Our AI is extracting medication details. This may take a few seconds.</p>
        </div>
      )}

      {status === 'ready' && analysis && (
        <div className="results-panel">
          <div className="bento-grid">
            <div className="bento-card" style={{ gridColumn: 'span 12' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <MdCheckCircle size={28} color="var(--green-accent)" />
                <h2 style={{ margin: 0 }}>Doctor's Advice</h2>
              </div>
              <p style={{ fontSize: '18px' }}>{analysis.advice}</p>
              {analysis.followUp && (
                <div style={{ marginTop: '16px', display: 'inline-block', background: '#eff6ff', color: 'var(--blue-accent)', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold' }}>
                  Next Visit: {analysis.followUp}
                </div>
              )}
            </div>

            <div className="bento-card" style={{ gridColumn: 'span 12' }}>
              <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Medications Prescribed</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {analysis.medications.map((med, idx) => (
                  <div key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ margin: 0, color: 'var(--blue-accent)' }}>{med.name}</h3>
                      <span style={{ background: '#dbeafe', color: 'var(--blue-accent)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{med.dosage}</span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                      <div style={{ marginBottom: '4px' }}><strong>Duration:</strong> {med.duration}</div>
                      <div><strong>Instructions:</strong> {med.instructions}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PrescriptionsView
