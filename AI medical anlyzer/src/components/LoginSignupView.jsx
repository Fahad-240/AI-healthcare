import { useState } from 'react'
import { MdEmail, MdLock, MdPerson, MdPhone, MdVisibility, MdVisibilityOff, MdMedicalServices } from 'react-icons/md'
import { VIEWS } from '../constants/views'
import illustration from '../assets/auth-illustration.png'

function LoginSignupView({ onLogin, initialMode = VIEWS.LOGIN }) {
  const [mode, setMode] = useState(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState({})

  // Handle login form change
  const handleLoginChange = (e) => {
    const { name, value } = e.target
    setLoginForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  // Handle signup form change
  const handleSignupChange = (e) => {
    const { name, value } = e.target
    setSignupForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  // Validate login form
  const validateLogin = () => {
    const newErrors = {}
    if (!loginForm.email) newErrors.email = 'Email required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.email)) newErrors.email = 'Invalid email'
    if (!loginForm.password) newErrors.password = 'Password required'
    else if (loginForm.password.length < 6) newErrors.password = 'Min 6 characters'
    return newErrors
  }

  // Validate signup form
  const validateSignup = () => {
    const newErrors = {}
    if (!signupForm.firstName.trim()) newErrors.firstName = 'First name required'
    if (!signupForm.lastName.trim()) newErrors.lastName = 'Last name required'
    if (!signupForm.email) newErrors.email = 'Email required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email)) newErrors.email = 'Invalid email'
    if (!signupForm.phone) newErrors.phone = 'Phone required'
    else if (!/^\d{10,12}$/.test(signupForm.phone.replace(/\D/g, ''))) newErrors.phone = 'Invalid phone number'
    if (!signupForm.password) newErrors.password = 'Password required'
    else if (signupForm.password.length < 6) newErrors.password = 'Min 6 characters'
    return newErrors
  }

  // Handle login submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateLogin()

    if (Object.keys(newErrors).length === 0) {
      setLoading(true)
      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginForm),
        })
        const result = await response.json()

        if (result.status === 'success') {
          // Store user info & token in localStorage
          localStorage.setItem('user', JSON.stringify(result.user))
          if (result.token) localStorage.setItem('token', result.token)
          onLogin()
        } else {
          setErrors({ form: result.message || 'Login failed' })
        }
      } catch (err) {
        setErrors({ form: 'Network error: Cannot reach server' })
      } finally {
        setLoading(false)
      }
    } else {
      setErrors(newErrors)
    }
  }

  // Handle signup submit
  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateSignup()

    if (Object.keys(newErrors).length === 0) {
      setLoading(true)
      try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(signupForm),
        })
        const result = await response.json()

        if (result.status === 'success') {
          // After successful signup, log them in automatically
          const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: signupForm.email, password: signupForm.password }),
          })
          const loginData = await loginRes.json()

          if (loginData.status === 'success') {
            localStorage.setItem('user', JSON.stringify(loginData.user))
            if (loginData.token) localStorage.setItem('token', loginData.token)
            onLogin()
          } else {
            setMode(VIEWS.LOGIN)
            setErrors({ form: 'Registration successful! Please login.' })
          }
        } else {
          setErrors({ form: result.message || 'Registration failed' })
        }
      } catch (err) {
        setErrors({ form: 'Network error: Cannot reach server' })
      } finally {
        setLoading(false)
      }
    } else {
      setErrors(newErrors)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-wrapper reference-layout">
        {/* Left Side - Illustration Banner */}
        <div className="auth-banner-ref">
          <div className="auth-banner-inner">
            <img src={illustration} alt="Medical Professional" className="banner-illustration" />
            <div className="banner-text-content">
              <h2 className="banner-title">AI Health Care Powered</h2>
              <p className="banner-desc">Efficient, Organized, Reliable</p>
            </div>
            <div className="banner-pagination">
              <span className="dot active"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="form-brand-header">
              <div className="brand-logo-ref">
                <MdMedicalServices />
              </div>
              <h1 className="brand-name-ref">AI Health Care</h1>
              <p className="brand-tagline-ref">Efficient, Organized, Reliable</p>
            </div>

            {errors.form && (
              <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px', textAlign: 'center', border: '1px solid #fee2e2' }}>
                {errors.form}
              </div>
            )}

            {mode === VIEWS.LOGIN ? (
              <form onSubmit={handleLoginSubmit} className="ref-auth-form">
                <div className="ref-form-group">
                  <div className="ref-input-wrapper">
                    <MdEmail className="ref-input-icon" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      className={errors.email ? 'ref-input error' : 'ref-input'}
                    />
                  </div>
                </div>

                <div className="ref-form-group">
                  <div className="ref-input-wrapper">
                    <MdLock className="ref-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      className={errors.password ? 'ref-input error' : 'ref-input'}
                    />
                    <button
                      type="button"
                      className="ref-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-extra-controls">
                  <label className="remember-me">
                    <div className={`ref-toggle ${rememberMe ? 'active' : ''}`}
                      onClick={() => setRememberMe(!rememberMe)}>
                      <div className="toggle-dot"></div>
                    </div>
                    <span>Remember Me</span>
                  </label>
                  <button type="button" className="forgot-password">Forgot Password</button>
                </div>

                <button type="submit" className="btn-ref-primary" disabled={loading}>
                  {loading ? 'Logging in...' : 'Log In'}
                </button>

                <div className="ref-auth-footer">
                  <p>Don't have an account? <button type="button" className="ref-link-btn" onClick={() => setMode(VIEWS.SIGNUP)}>Sign up</button></p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignupSubmit} className="ref-auth-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="ref-form-group">
                    <div className="ref-input-wrapper">
                      <MdPerson className="ref-input-icon" />
                      <input
                        type="text"
                        name="firstName"
                        placeholder="First name"
                        value={signupForm.firstName}
                        onChange={handleSignupChange}
                        className={errors.firstName ? 'ref-input error' : 'ref-input'}
                      />
                    </div>
                  </div>
                  <div className="ref-form-group">
                    <div className="ref-input-wrapper">
                      <MdPerson className="ref-input-icon" />
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Last name"
                        value={signupForm.lastName}
                        onChange={handleSignupChange}
                        className={errors.lastName ? 'ref-input error' : 'ref-input'}
                      />
                    </div>
                  </div>
                </div>

                <div className="ref-form-group">
                  <div className="ref-input-wrapper">
                    <MdEmail className="ref-input-icon" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      value={signupForm.email}
                      onChange={handleSignupChange}
                      className={errors.email ? 'ref-input error' : 'ref-input'}
                    />
                  </div>
                </div>

                <div className="ref-form-group">
                  <div className="ref-input-wrapper">
                    <MdPhone className="ref-input-icon" />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number"
                      value={signupForm.phone}
                      onChange={handleSignupChange}
                      className={errors.phone ? 'ref-input error' : 'ref-input'}
                    />
                  </div>
                </div>

                <div className="ref-form-group">
                  <div className="ref-input-wrapper">
                    <MdLock className="ref-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Password"
                      value={signupForm.password}
                      onChange={handleSignupChange}
                      className={errors.password ? 'ref-input error' : 'ref-input'}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-ref-primary" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </button>

                <div className="ref-auth-footer">
                  <p>Already have an account? <button type="button" className="ref-link-btn" onClick={() => setMode(VIEWS.LOGIN)}>Log In</button></p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginSignupView
