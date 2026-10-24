
import { useEffect, useState } from 'react'
import './App.css'

const API = 'http://localhost:8081/api'
const SERVER = 'http://localhost:8081'

const categoryIcons = {
  Wallet: '▰',
  Electronics: '⌁',
  Books: '▤',
  Keys: '⚿',
  'ID Card': '▣',
  Bag: '▱',
  Clothing: '◇',
  Other: '✦',
}

function App() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [mode, setMode] = useState('login')
  const [token, setToken] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState('')
  const [activeView, setActiveView] = useState('dashboard')
  const [selectedItem, setSelectedItem] = useState(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [role, setRole] = useState('STUDENT')

  const [type, setType] = useState('LOST')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Other')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  const [searchType, setSearchType] = useState('ALL')
  const [searchCategory, setSearchCategory] = useState('')
  const [searchLocation, setSearchLocation] = useState('')

  const [claimReason, setClaimReason] = useState('')
  const [pendingClaims, setPendingClaims] = useState([])
  const [myItemClaims, setMyItemClaims] = useState([])
  const [myClaims, setMyClaims] = useState([])
  const [claimsLoading, setClaimsLoading] = useState(false)

  async function loadItems() {
    try {
      setLoading(true)
      const response = await fetch(`${API}/items`)

      if (!response.ok) throw new Error('Failed to load items.')

      const data = await response.json()
      setItems(Array.isArray(data) ? data : [])
      setError('')
    } catch (err) {
      console.error(err)
      setError('Could not load items. Check whether the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  function openReport(reportType) {
    setType(reportType)
    setActiveView('report')
    setError('')
    setMessage('')

    if (!token) {
      setMode('login')
      setMessage('Please log in with your college account to report an item.')
      return
    }

    setTimeout(() => {
      document.getElementById('report-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 100)
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('The image must be 5 MB or smaller.')
      event.target.value = ''
      return
    }

    setError('')
    setImageFile(file)

    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearSelectedImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview('')

    const input = document.getElementById('item-image')
    if (input) input.value = ''
  }

  function resetReportForm() {
    setTitle('')
    setDescription('')
    setCategory('Other')
    setLocation('')
    setDate(new Date().toISOString().slice(0, 10))
    clearSelectedImage()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setPasswordError('Passwords do not match.')
          return
        }

        setPasswordError('')

        const response = await fetch(`${API}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email: email.trim().toLowerCase(),
            password,
            role,
          }),
        })

        const text = await response.text()
        let data = {}

        try {
          data = JSON.parse(text)
        } catch {
          data = { message: text }
        }

        if (!response.ok) {
          throw new Error(
            data.message || data.error || 'Registration failed.'
          )
        }

        setMessage('Registration successful! Please log in.')
        setMode('login')
        setPassword('')
        setConfirmPassword('')
        setName('')
        return
      }

      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Check your details.')
      }

      if (!data.token) throw new Error('Login token was not returned.')

      setToken(data.token)
      setUserEmail(data.email || email)
      setUserRole(String(data.role || '').toUpperCase())
      setPassword('')
      setActiveView('dashboard')
      setMessage(`Welcome, ${data.name || email}!`)

      await loadItems()
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    }
  }

  function handleLogout() {
    setToken('')
    setUserEmail('')
    setUserRole('')
    setPendingClaims([])
    setMyItemClaims([])
    setMyClaims([])
    setSelectedItem(null)
    setClaimReason('')
    setMessage('You have logged out. See you again soon!')
    setError('')
    setMode('login')
    setActiveView('dashboard')
  }

  function showLogin() {
    setMode('login')
    setError('')
    setMessage('')
    document.getElementById('auth-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  async function handleReport(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!token) {
      setMessage('Please log in before reporting an item.')
      return
    }

    try {
      const itemData = {
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        date,
        type,
        status: 'ACTIVE',
      }

      const formData = new FormData()

      formData.append(
        'item',
        new Blob([JSON.stringify(itemData)], {
          type: 'application/json',
        })
      )

      if (imageFile) formData.append('image', imageFile)

      const response = await fetch(`${API}/items`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Could not report item (${response.status}).`
        )
      }

      setMessage(
        `${type === 'LOST' ? 'Lost' : 'Found'} item reported successfully!`
      )

      resetReportForm()
      setActiveView('dashboard')
      await loadItems()
    } catch (err) {
      setError(err.message || 'Could not submit the item.')
    }
  }

  async function handleSearch(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${API}/items`)
      if (!response.ok) throw new Error('Could not load items.')

      let results = await response.json()

      if (searchType !== 'ALL') {
        results = results.filter(item => item.type === searchType)
      }

      if (searchCategory.trim()) {
        results = results.filter(item =>
          (item.category || '').toLowerCase().includes(
            searchCategory.trim().toLowerCase()
          )
        )
      }

      if (searchLocation.trim()) {
        results = results.filter(item =>
          (item.location || '').toLowerCase().includes(
            searchLocation.trim().toLowerCase()
          )
        )
      }

      setItems(results)
      setActiveView('dashboard')
    } catch (err) {
      setError(err.message || 'Search failed.')
    }
  }

  function resetSearch() {
    setSearchType('ALL')
    setSearchCategory('')
    setSearchLocation('')
    loadItems()
    setActiveView('dashboard')
  }

  async function handleClaim(item) {
    if (!token) {
      setSelectedItem(null)
      setMode('login')
      setMessage('Please log in to claim an item.')
      return
    }

    if (item.type !== 'FOUND') {
      setError('You can claim only found items.')
      return
    }

    if (!claimReason.trim()) {
      setError('Please enter a reason before submitting your claim.')
      return
    }

    if (claimReason.trim().length > 1000) {
      setError('Your explanation must be under 1000 characters.')
      return
    }

    try {
      setError('')
      setMessage('')

      const response = await fetch(`${API}/claims/item/${item.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: claimReason.trim() }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `Claim failed (${response.status}).`
        )
      }

      setMessage('Claim submitted successfully! Waiting for admin approval.')
      setSelectedItem(null)
      setClaimReason('')
    } catch (err) {
      setError(err.message || 'Could not submit the claim.')
    }
  }

  async function loadPendingClaims() {
    if (!token || userRole !== 'ADMIN') {
      setError('Only admins can view pending claims.')
      return
    }

    try {
      setClaimsLoading(true)
      setError('')
      setMessage('')

      const response = await fetch(`${API}/claims/admin/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json().catch(() => [])

      if (!response.ok) {
        throw new Error(
          data.message || `Could not load claims (${response.status}).`
        )
      }

      setPendingClaims(Array.isArray(data) ? data : [])
      setActiveView('admin')
    } catch (err) {
      setError(err.message || 'Could not load pending claims.')
    } finally {
      setClaimsLoading(false)
    }
  }

  async function loadMyItemClaims() {
    if (!token) {
      setError('Please log in to view claims on your items.')
      return
    }

    try {
      setClaimsLoading(true)
      setError('')
      setMessage('')

      const response = await fetch(`${API}/claims/my-posted-items`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json().catch(() => [])

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Could not load your item claims (${response.status}).`
        )
      }

      setMyItemClaims(Array.isArray(data) ? data : [])
      setActiveView('myClaims')
    } catch (err) {
      setError(err.message || 'Could not load claims on your items.')
    } finally {
      setClaimsLoading(false)
    }
  }

  // Claims submitted by the currently logged-in user.
  async function loadMyClaims() {
    if (!token) {
      setError('Please log in to view your claims.')
      return
    }

    try {
      setClaimsLoading(true)
      setError('')
      setMessage('')

      const response = await fetch(`${API}/claims/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json().catch(() => [])

      if (!response.ok) {
        throw new Error(
          data.message || `Could not load your claims (${response.status}).`
        )
      }

      setMyClaims(Array.isArray(data) ? data : [])
      setActiveView('mySubmittedClaims')
    } catch (err) {
      setError(err.message || 'Could not load your claims.')
    } finally {
      setClaimsLoading(false)
    }
  }

  async function updateClaim(claimId, action) {
    if (!token || userRole !== 'ADMIN') {
      setError('Only admins can update claims.')
      return
    }

    try {
      setError('')
      setMessage('')

      const response = await fetch(
        `${API}/claims/admin/${claimId}/${action}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.message || `Could not ${action} claim (${response.status}).`
        )
      }

      setMessage(
        `Claim #${claimId} ${
          action === 'approve' ? 'approved' : 'rejected'
        } successfully.`
      )

      await loadPendingClaims()
    } catch (err) {
      setError(err.message || 'Could not update the claim.')
    }
  }

  function imageUrl(item) {
    if (!item?.imagePath) return ''
    if (item.imagePath.startsWith('http')) return item.imagePath

    return `${SERVER}${
      item.imagePath.startsWith('/') ? '' : '/'
    }${item.imagePath}`
  }

  function ItemPhoto({ item, details = false }) {
    const [failed, setFailed] = useState(false)
    const src = imageUrl(item)

    return (
      <div className={details ? 'details-photo' : 'item-card-art'}>
        {src && !failed ? (
          <img
            className="uploaded-item-image"
            src={src}
            alt={item.title || 'Reported item'}
            onError={() => setFailed(true)}
          />
        ) : (
          <div
            className={`photo-placeholder ${
              item.type === 'LOST' ? 'art-lost' : 'art-found'
            }`}
          >
            <span className="item-illustration">
              {categoryIcons[item.category] || '✦'}
            </span>
            <span className="art-category">{item.category || 'Other'}</span>
            <small>
              {item.imagePath ? 'Photo unavailable' : 'No photo added'}
            </small>
          </div>
        )}

        <span
          className={`item-badge ${
            item.type === 'LOST' ? 'lost' : 'found'
          }`}
        >
          {item.type}
        </span>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="topbar">
        <a
          className="brand"
          href="#home"
          onClick={() => setActiveView('dashboard')}
        >
          <span className="brand-icon">C</span>
          <span>
            <strong>Campus Connect</strong>
            <small>ANURAG UNIVERSITY</small>
          </span>
        </a>

        <nav className="top-nav">
          <a href="#home">Home</a>
          <a href="#items" onClick={() => setActiveView('dashboard')}>
            Lost &amp; Found
          </a>
          <a href="#features">About</a>
          {!token ? (
            <button className="nav-login" onClick={showLogin}>
              Login
            </button>
          ) : (
            <button className="nav-login" onClick={handleLogout}>
              Logout
            </button>
          )}
        </nav>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow">YOUR CAMPUS. YOUR COMMUNITY.</span>
            <h1>
              Lost Something?
              <br />
              Found Something?
            </h1>
            <p>
              Help your fellow students. Keep our campus connected.
              Together, we can make sure every lost item finds its way home.
            </p>
            <div className="hero-actions">
              <button
                className="btn btn-teal"
                onClick={() => openReport('LOST')}
              >
                Report Lost <span>↗</span>
              </button>
              <button
                className="btn btn-outline"
                onClick={() => openReport('FOUND')}
              >
                Report Found <span>↗</span>
              </button>
            </div>
            <div className="hero-note">
              <span className="online-dot" /> A little lost? Let's get it found.
            </div>
          </div>

          <div className="hero-art" aria-label="Campus illustration">
            <div className="art-sun" />
            <div className="art-building building-back">
              <span />
              <span />
              <span />
            </div>
            <div className="art-building building-front">
              <div className="building-roof" />
              <div className="building-columns">
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="building-door" />
            </div>
            <div className="art-tree tree-one"><i /></div>
            <div className="art-tree tree-two"><i /></div>
            <div className="art-path" />
            <div className="art-caption">
              <span>01 / CAMPUS COMMUNITY</span>
              <strong>
                Good things find
                <br />
                their way back.
              </strong>
            </div>
          </div>
        </section>

        <section className="features" id="features">
          <article className="feature">
            <span className="feature-icon">♧</span>
            <div>
              <h3>Safe &amp; Secure</h3>
              <p>Made for our college community</p>
            </div>
          </article>
          <article className="feature">
            <span className="feature-icon">↗</span>
            <div>
              <h3>Easy Reporting</h3>
              <p>Share details in just a few steps</p>
            </div>
          </article>
          <article className="feature">
            <span className="feature-icon">♡</span>
            <div>
              <h3>Community Driven</h3>
              <p>Together, we help things get home</p>
            </div>
          </article>
        </section>

        <section className="welcome-strip">
          <div>
            <span className="section-kicker">A CAMPUS THAT CARES</span>
            <h2>Every find can make someone's day.</h2>
            <p>
              One small post can reunite someone with something important.
            </p>
          </div>
          <div className="welcome-mark">
            CC<span>+</span>
          </div>
        </section>

        <section className="workspace">
          <aside className="sidebar">
            <div className="sidebar-heading">
              <span className="sidebar-logo">C</span>
              <span>
                <strong>Campus Connect</strong>
                <small>STUDENT PORTAL</small>
              </span>
            </div>

            {token && (
              <div className="signed-in">
                <span className="avatar">
                  {userEmail.charAt(0).toUpperCase()}
                </span>
                <span>
                  <strong>Welcome back!</strong>
                  <small>{userEmail}</small>
                </span>
              </div>
            )}

            <p className="side-label">WORKSPACE</p>

            <button
              className={`side-link ${
                activeView === 'dashboard' ? 'active' : ''
              }`}
              onClick={() => setActiveView('dashboard')}
            >
              ▦ <span>Dashboard</span>
            </button>

            <button
              className={`side-link ${
                activeView === 'report' && type === 'LOST' ? 'active' : ''
              }`}
              onClick={() => openReport('LOST')}
            >
              ↗ <span>Report Lost</span>
            </button>

            <button
              className={`side-link ${
                activeView === 'report' && type === 'FOUND' ? 'active' : ''
              }`}
              onClick={() => openReport('FOUND')}
            >
              ⌕ <span>Report Found</span>
            </button>

            <button className="side-link" onClick={resetSearch}>
              ▤ <span>All Items</span>
            </button>

            {token && (
              <>
                <button
                  className={`side-link ${
                    activeView === 'mySubmittedClaims' ? 'active' : ''
                  }`}
                  onClick={loadMyClaims}
                >
                  ♡ <span>My Claims</span>
                </button>

                <button
                  className={`side-link ${
                    activeView === 'myClaims' ? 'active' : ''
                  }`}
                  onClick={loadMyItemClaims}
                >
                  ♡ <span>Claims on My Items</span>
                </button>
              </>
            )}

            {token && userRole === 'ADMIN' && (
              <button
                className={`side-link ${
                  activeView === 'admin' ? 'active' : ''
                }`}
                onClick={loadPendingClaims}
              >
                ✓ <span>Admin Dashboard</span>
              </button>
            )}

            <div className="sidebar-tip">
              <span>✦ A KIND REMINDER</span>
              <p>
                Found something? A quick report could make someone's day.
              </p>
            </div>

            {token && (
              <button className="side-logout" onClick={handleLogout}>
                ↪ Log out
              </button>
            )}
          </aside>

          <div className="workspace-main">
            <div className="workspace-heading">
              <div>
                <span className="section-kicker">
                  YOUR CAMPUS COMMUNITY
                </span>
                <h2>
                  {activeView === 'report'
                    ? 'Report an Item'
                    : activeView === 'admin'
                      ? 'Admin Dashboard'
                      : activeView === 'myClaims'
                        ? 'Claims on My Items'
                        : activeView === 'mySubmittedClaims'
                          ? 'My Claims'
                          : 'Find what matters.'}
                </h2>
                <p>
                  {activeView === 'report'
                    ? 'Share a few details and help reconnect an item with its owner.'
                    : activeView === 'admin'
                      ? 'Review and manage claims submitted by campus members.'
                      : activeView === 'myClaims'
                        ? 'See who has claimed items you reported as found.'
                        : activeView === 'mySubmittedClaims'
                          ? 'Track the items you have claimed and their approval status.'
                          : 'Search recent reports or help a lost item find its way home.'}
                </p>
              </div>

              {!token && (
                <button className="btn btn-dark" onClick={showLogin}>
                  Student Login ↗
                </button>
              )}
            </div>

            {!token && (
              <section className="auth-card" id="auth-section">
                <div className="auth-intro">
                  <span className="auth-symbol">✳</span>
                  <span className="section-kicker">
                    WELCOME TO CAMPUS CONNECT
                  </span>
                  <h3>
                    {mode === 'register'
                      ? 'Join your campus community.'
                      : 'Good to see you again.'}
                  </h3>
                  <p>
                    {mode === 'register'
                      ? 'Create your account using your Anurag University email.'
                      : 'Sign in to report lost items and help others find what they need.'}
                  </p>
                  <div className="auth-promise">
                    ✓ College community &nbsp; ✓ Simple &amp; secure
                  </div>
                </div>

                <div className="auth-form-wrap">
                  <div className="auth-tabs">
                    <button
                      className={mode === 'login' ? 'selected' : ''}
                      type="button"
                      onClick={() => {
                        setMode('login')
                        setError('')
                        setMessage('')
                        setConfirmPassword('')
                        setPasswordError('')
                      }}
                    >
                      Login
                    </button>
                    <button
                      className={mode === 'register' ? 'selected' : ''}
                      type="button"
                      onClick={() => {
                        setMode('register')
                        setError('')
                        setMessage('')
                        setConfirmPassword('')
                        setPasswordError('')
                      }}
                    >
                      Register
                    </button>
                  </div>

                  <form className="auth-form" onSubmit={handleSubmit}>
                    {mode === 'register' && (
                      <label>
                        Full name
                        <input
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Enter your full name"
                          required
                        />
                      </label>
                    )}

                    {mode === 'register' && (
                      <label>
                        Register as
                        <select
                          value={role}
                          onChange={e => setRole(e.target.value)}
                          required
                        >
                          <option value="STUDENT">Student</option>
                          <option value="FACULTY">Faculty</option>
                        </select>
                      </label>
                    )}

                    <label>
                      College email
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@anurag.edu.in"
                        required
                        pattern=".+@anurag\.edu\.in"
                        title="Use your Anurag University email address."
                      />
                    </label>

                    <label>
                      Password
                      <input
                        type="password"
                        value={password}
                        onChange={e => {
                          setPassword(e.target.value)
                          setPasswordError('')
                        }}
                        placeholder="Enter your password"
                        minLength="6"
                        required
                      />
                    </label>

                    {mode === 'register' && (
                      <label>
                        Confirm Password
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={e => {
                            setConfirmPassword(e.target.value)
                            setPasswordError('')
                          }}
                          placeholder="Re-enter your password"
                          minLength="6"
                          required
                        />
                        {passwordError && (
                          <span className="field-error" role="alert">
                            {passwordError}
                          </span>
                        )}
                      </label>
                    )}

                    <button
                      className="btn btn-dark auth-submit"
                      type="submit"
                    >
                      {mode === 'register'
                        ? `Create ${
                            role === 'STUDENT' ? 'Student' : 'Faculty'
                          } Account`
                        : 'Login to Campus Connect'}{' '}
                      <span>→</span>
                    </button>
                  </form>

                  <p className="auth-switch">
                    {mode === 'register'
                      ? 'Already have an account?'
                      : "Don't have an account?"}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === 'register' ? 'login' : 'register')
                        setError('')
                        setMessage('')
                        setConfirmPassword('')
                        setPasswordError('')
                      }}
                    >
                      {mode === 'register' ? 'Login' : 'Register here'}
                    </button>
                  </p>
                </div>
              </section>
            )}

            {token && (
              <div className="logged-banner">
                <span className="online-dot" /> Signed in as{' '}
                <strong>{userEmail}</strong>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}

            {message && (
              <p className="notice success-notice" role="status">
                {message}
              </p>
            )}
            {error && (
              <p className="notice error-notice" role="alert">
                {error}
              </p>
            )}

            {/* Claims submitted by the logged-in user */}
            {token && activeView === 'mySubmittedClaims' && (
              <section className="admin-panel">
                <span className="section-kicker">YOUR CLAIM HISTORY</span>
                <h3>My Claims</h3>
                <p className="admin-description">
                  View FOUND items you have claimed and check their status.
                </p>

                <button
                  className="btn btn-light"
                  onClick={loadMyClaims}
                  disabled={claimsLoading}
                >
                  {claimsLoading ? 'Refreshing...' : 'Refresh My Claims'}
                </button>

                {claimsLoading && <p>Loading your claims...</p>}

                {!claimsLoading && myClaims.length === 0 && (
                  <div className="admin-empty">
                    You have not submitted any claims yet.
                  </div>
                )}

                {myClaims.map(claim => (
                  <div className="admin-claim" key={claim.id}>
                    <h4>{claim.item?.title || `Claim #${claim.id}`}</h4>

                    {claim.item?.imagePath && (
                      <img
                        src={imageUrl(claim.item)}
                        alt={claim.item?.title || 'Claimed item'}
                        style={{
                          width: '150px',
                          maxHeight: '150px',
                          objectFit: 'cover',
                          borderRadius: '10px',
                        }}
                      />
                    )}

                    <p><strong>Claim ID:</strong> {claim.id}</p>
                    <p><strong>Category:</strong> {claim.item?.category || 'Not available'}</p>
                    <p><strong>Location:</strong> {claim.item?.location || 'Not available'}</p>
                    <p><strong>Reason:</strong> {claim.reason || 'No reason provided'}</p>
                    <p><strong>Status:</strong> {claim.status || 'PENDING'}</p>
                    <p><strong>Submitted:</strong> {claim.createdAt || 'Not available'}</p>
                  </div>
                ))}
              </section>
            )}

            {/* Claims submitted on items posted by the logged-in user */}
            {token && activeView === 'myClaims' && (
              <section className="admin-panel">
                <span className="section-kicker">YOUR REPORTED ITEMS</span>
                <h3>Claims on My Items</h3>
                <p className="admin-description">
                  Review claimant details and the status of each claim.
                </p>

                <button
                  className="btn btn-light"
                  onClick={loadMyItemClaims}
                  disabled={claimsLoading}
                >
                  {claimsLoading ? 'Refreshing...' : 'Refresh Claims'}
                </button>

                {claimsLoading && <p>Loading claims on your items...</p>}

                {!claimsLoading && myItemClaims.length === 0 && (
                  <div className="admin-empty">
                    No claims have been submitted on your items yet.
                  </div>
                )}

                {myItemClaims.map(claim => (
                  <div className="admin-claim" key={claim.id}>
                    <h4>{claim.item?.title || `Claim #${claim.id}`}</h4>

                    {claim.item?.imagePath && (
                      <img
                        src={imageUrl(claim.item)}
                        alt={claim.item?.title || 'Found item'}
                        style={{
                          width: '150px',
                          maxHeight: '150px',
                          objectFit: 'cover',
                          borderRadius: '10px',
                        }}
                      />
                    )}

                    <p><strong>Claim ID:</strong> {claim.id}</p>
                    <p><strong>Claimant:</strong> {claim.student?.name || 'Not available'}</p>
                    <p><strong>Email:</strong> {claim.student?.email || 'Not available'}</p>
                    <p><strong>Reason:</strong> {claim.reason || 'No reason provided'}</p>
                    <p><strong>Status:</strong> {claim.status || 'PENDING'}</p>
                    <p><strong>Submitted:</strong> {claim.createdAt || 'Not available'}</p>
                  </div>
                ))}
              </section>
            )}

            {token && userRole === 'ADMIN' && activeView === 'admin' && (
              <section className="admin-panel">
                <span className="section-kicker">ADMINISTRATION</span>
                <h3>Pending Claims</h3>
                <p className="admin-description">
                  Review student claims and approve or reject them.
                </p>

                <button
                  className="btn btn-light"
                  onClick={loadPendingClaims}
                  disabled={claimsLoading}
                >
                  {claimsLoading ? 'Refreshing...' : 'Refresh Claims'}
                </button>

                {claimsLoading && <p>Loading pending claims...</p>}

                {!claimsLoading && pendingClaims.length === 0 && (
                  <div className="admin-empty">
                    No pending claims right now.
                  </div>
                )}

                {pendingClaims.map(claim => (
                  <div className="admin-claim" key={claim.id}>
                    <h4>{claim.item?.title || `Claim #${claim.id}`}</h4>
                    <p><strong>Claim ID:</strong> {claim.id}</p>
                    <p><strong>Student:</strong> {claim.student?.name || claim.student?.email || 'Student'}</p>
                    <p><strong>Email:</strong> {claim.student?.email || 'Not available'}</p>
                    <p><strong>Reason:</strong> {claim.reason || 'No reason provided'}</p>
                    <p><strong>Status:</strong> {claim.status || 'PENDING'}</p>
                    <p><strong>Submitted:</strong> {claim.createdAt || 'Not available'}</p>

                    {claim.status === 'PENDING' && (
                      <div className="admin-actions">
                        <button
                          className="btn btn-approve"
                          onClick={() => updateClaim(claim.id, 'approve')}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-reject"
                          onClick={() => updateClaim(claim.id, 'reject')}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </section>
            )}

            {token && activeView === 'report' && (
              <section className="report-card" id="report-section">
                <div className="report-card-heading">
                  <div>
                    <span className="section-kicker">
                      HELP AN ITEM FIND ITS WAY
                    </span>
                    <h3>
                      {type === 'LOST'
                        ? 'Report a lost item'
                        : 'Report a found item'}
                    </h3>
                  </div>
                  <span className={`item-badge ${type.toLowerCase()}`}>
                    {type}
                  </span>
                </div>

                <form className="report-form" onSubmit={handleReport}>
                  <label>
                    Report type
                    <select
                      value={type}
                      onChange={e => setType(e.target.value)}
                    >
                      <option value="LOST">I lost something</option>
                      <option value="FOUND">I found something</option>
                    </select>
                  </label>

                  <label>
                    Item title
                    <input
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Black wallet"
                      required
                      maxLength={150}
                    />
                  </label>

                  <label className="wide-field">
                    Description
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Describe the item and any details that may help identify it."
                      required
                      maxLength={2000}
                    />
                  </label>

                  <label>
                    Category
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                    >
                      <option>Other</option>
                      <option>Wallet</option>
                      <option>Electronics</option>
                      <option>Books</option>
                      <option>Keys</option>
                      <option>ID Card</option>
                      <option>Bag</option>
                      <option>Clothing</option>
                    </select>
                  </label>

                  <label>
                    Campus location
                    <input
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="e.g. College library"
                      required
                    />
                  </label>

                  <label>
                    Date
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      required
                    />
                  </label>

                  <div className="wide-field photo-upload">
                    <label htmlFor="item-image">
                      Item photo{' '}
                      <span className="optional-label">
                        (optional, max 5 MB)
                      </span>
                    </label>
                    <input
                      id="item-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />

                    {imagePreview && (
                      <div className="image-preview-wrap">
                        <img
                          className="image-preview"
                          src={imagePreview}
                          alt="Selected item preview"
                        />
                        <button
                          type="button"
                          className="btn btn-light"
                          onClick={clearSelectedImage}
                        >
                          Remove photo
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="wide-field form-actions">
                    <button className="btn btn-teal" type="submit">
                      Submit Report ↗
                    </button>
                    <button
                      className="btn btn-light"
                      type="button"
                      onClick={() => {
                        resetReportForm()
                        setActiveView('dashboard')
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </section>
            )}

            {activeView !== 'admin' &&
              activeView !== 'myClaims' &&
              activeView !== 'mySubmittedClaims' && (
                <section className="items-section" id="items">
                  <div className="items-heading">
                    <div>
                      <span className="section-kicker">
                        THE LATEST FROM CAMPUS
                      </span>
                      <h3>Recently reported items</h3>
                      <p>
                        Help these belongings find their way back to their
                        owners.
                      </p>
                    </div>
                    <span className="item-count">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <form className="search-bar" onSubmit={handleSearch}>
                    <span className="search-symbol">⌕</span>
                    <input
                      aria-label="Search category"
                      value={searchCategory}
                      onChange={e => setSearchCategory(e.target.value)}
                      placeholder="Search by category..."
                    />
                    <input
                      aria-label="Search location"
                      value={searchLocation}
                      onChange={e => setSearchLocation(e.target.value)}
                      placeholder="Campus location..."
                    />
                    <select
                      aria-label="Item type"
                      value={searchType}
                      onChange={e => setSearchType(e.target.value)}
                    >
                      <option value="ALL">All items</option>
                      <option value="LOST">Lost</option>
                      <option value="FOUND">Found</option>
                    </select>
                    <button
                      className="btn btn-dark search-submit"
                      type="submit"
                    >
                      Search
                    </button>
                    <button
                      className="btn btn-light"
                      type="button"
                      onClick={resetSearch}
                    >
                      Reset
                    </button>
                  </form>

                  {loading && (
                    <p className="empty-state">Loading campus reports...</p>
                  )}

                  {!loading && items.length === 0 && (
                    <div className="empty-state">
                      <span>⌕</span>
                      <h4>No items found just yet.</h4>
                      <p>
                        Try another search, or be the first to report an item.
                      </p>
                    </div>
                  )}

                  <div className="item-list">
                    {items.map(item => (
                      <article className="item-card" key={item.id}>
                        <div className="item-card-photo-wrap">
                          <ItemPhoto item={item} />
                        </div>

                        <div className="item-card-body">
                          <div className="item-card-top">
                            <span className="item-category">
                              {item.category || 'Other'}
                            </span>
                            <span className="item-id">#{item.id}</span>
                          </div>

                          <h4>{item.title}</h4>
                          <p className="item-description">
                            {item.description}
                          </p>
                          <div className="item-meta">
                            <span>⌖</span> {item.location}
                          </div>
                          <div className="item-meta">
                            <span>◷</span> {item.date}
                          </div>

                          <div className="item-card-bottom">
                            <span
                              className={`status-dot ${
                                item.status === 'ACTIVE' ? 'status-active' : ''
                              }`}
                            />
                            <span>{item.status || 'ACTIVE'}</span>
                            <button
                              className="view-details-btn"
                              type="button"
                              onClick={() => {
                                setSelectedItem(item)
                                setClaimReason('')
                                setError('')
                                setMessage('')
                              }}
                            >
                              View Details ↗
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

            <section className="closing-note">
              <span>✦</span>
              <div>
                <h3>One campus. One community. A little more kindness.</h3>
                <p>
                  Thank you for helping make Anurag University a more caring
                  place.
                </p>
              </div>
            </section>
          </div>
        </section>
      </main>

      {selectedItem && (
        <div
          className="details-overlay"
          onClick={() => setSelectedItem(null)}
        >
          <section
            className="details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="details-title"
            onClick={event => event.stopPropagation()}
          >
            <button
              className="details-close"
              type="button"
              onClick={() => setSelectedItem(null)}
              aria-label="Close details"
            >
              ×
            </button>

            <ItemPhoto item={selectedItem} details />

            <span className="section-kicker">
              CAMPUS CONNECT · ITEM DETAILS
            </span>
            <h2 id="details-title">{selectedItem.title}</h2>
            <p className="details-description">
              {selectedItem.description || 'No additional description provided.'}
            </p>

            <div className="details-info">
              <div>
                <span>Category</span>
                <strong>{selectedItem.category || 'Other'}</strong>
              </div>
              <div>
                <span>Campus location</span>
                <strong>{selectedItem.location || 'Not specified'}</strong>
              </div>
              <div>
                <span>Date reported</span>
                <strong>{selectedItem.date || 'Not specified'}</strong>
              </div>
              <div>
                <span>Current status</span>
                <strong>{selectedItem.status || 'ACTIVE'}</strong>
              </div>
            </div>

            <p className="details-kindness">
              Every find can make someone's day. Let's help this item find its
              way home.
            </p>

            {selectedItem.type === 'FOUND' &&
              selectedItem.status === 'ACTIVE' && (
                <div className="claim-form">
                  <label htmlFor="claim-reason">
                    Why does this item belong to you?
                  </label>
                  <textarea
                    id="claim-reason"
                    value={claimReason}
                    onChange={e => {
                      setClaimReason(e.target.value)
                      setError('')
                    }}
                    placeholder="Describe unique features or details that prove this item is yours..."
                    maxLength={1000}
                    rows={4}
                    required
                  />
                  <p className="claim-hint">
                    {claimReason.length}/1000 characters
                  </p>
                  <button
                    className="btn btn-teal details-back"
                    type="button"
                    onClick={() => handleClaim(selectedItem)}
                  >
                    Submit Claim →
                  </button>
                </div>
              )}

            <button
              className="btn btn-dark details-back"
              type="button"
              onClick={() => {
                setSelectedItem(null)
                setClaimReason('')
                setError('')
              }}
            >
              ← Back to Items
            </button>
          </section>
        </div>
      )}

      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">C</span>
          <span>
            <strong>Campus Connect</strong>
            <small>ANURAG UNIVERSITY</small>
          </span>
        </a>
        <p>Made for our campus, powered by kindness.</p>
        <span>© Campus Connect</span>
      </footer>
    </div>
  )
}

export default App
