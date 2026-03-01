'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ══════════════════════════════════════════════════════════
// AUTH PAGE
// ══════════════════════════════════════════════════════════
function AuthPage({ onLogin }) {
  const [mode, setMode]       = useState('login')
  const [form, setForm]       = useState({ email: '', password: '', name: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const handleLogin = async () => {
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) { setError(error.message); setLoading(false); return }
    // Fetch user profile to check is_admin
    const { data: profile } = await supabase.from('users').select('*').eq('auth_id', data.user.id).single()
    onLogin(data.user, profile)
    setLoading(false)
  }

  const handleRegister = async () => {
    if (!form.name) return setError('Please enter your name')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { name: form.name } }
    })
    if (error) setError(error.message)
    else setSuccess('Account created! Please login now.')
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, flexDirection: 'column', gap: 16
    }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 52 }}>💊</div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: 'var(--teal)', marginTop: 8 }}>
          MEDICINE DOSE TRACKER
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Your personal medicine management system</div>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 36, width: 420, maxWidth: '95vw' }}>
        <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: 10, padding: 4, marginBottom: 28 }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }} style={{
              flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
              background: mode === m ? 'var(--teal)' : 'transparent',
              color: mode === m ? '#000' : 'var(--muted)',
              fontWeight: mode === m ? 700 : 400,
              fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s'
            }}>{m === 'login' ? '🔑 Login' : '📝 Register'}</button>
          ))}
        </div>

        {error && <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>❌ {error}</div>}
        {success && <div style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--teal)', marginBottom: 16 }}>✅ {success}</div>}

        {mode === 'register' && (
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="Arjun Menon" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="arjun@gmail.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())} />
        </div>

        <button className="btn btn-primary" style={{ width: '100%', padding: 12, marginTop: 8, fontSize: 14 }}
          onClick={mode === 'login' ? handleLogin : handleRegister} disabled={loading}>
          {loading ? '⏳ Please wait...' : mode === 'login' ? '🔑 Login' : '📝 Create Account'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <span style={{ color: 'var(--teal)', cursor: 'pointer' }}
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}>
            {mode === 'login' ? 'Register here' : 'Login here'}
          </span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)' }}>Secured by Supabase Authentication</div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ══════════════════════════════════════════════════════════
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 300,
      background: 'var(--card)', border: `1px solid ${type === 'success' ? 'rgba(0,212,170,0.4)' : 'rgba(255,107,107,0.4)'}`,
      borderRadius: 10, padding: '14px 18px', fontSize: 13, minWidth: 260,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {type === 'success' ? '✅' : '❌'} {message}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal"><div className="modal-title">{title}</div>{children}</div>
    </div>
  )
}

function Loader() { return <div className="loader"><div className="spinner"></div> Loading...</div> }
function Empty({ icon, text }) { return <div className="empty-state"><div className="empty-icon">{icon}</div>{text}</div> }

function Sidebar({ pages, page, setPage, user, profile, onLogout }) {
  const sections = [...new Set(pages.map(p => p.section))]
  return (
    <div className="sidebar">
      <div className="logo">
        <div className="logo-icon">💊</div>
        <div className="logo-text">DOSE TRACKER</div>
        <div className="logo-sub">{profile?.is_admin ? '👑 Admin Panel' : '👤 My Dashboard'}</div>
      </div>
      <nav className="nav">
        {sections.map(section => (
          <div key={section}>
            <div className="nav-section">{section}</div>
            {pages.filter(p => p.section === section).map(p => (
              <button key={p.id} className={`nav-item ${page === p.id ? 'active' : ''}`} onClick={() => setPage(p.id)}>
                <span className="nav-icon">{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="db-badge">
        {profile?.is_admin ? '👑 Admin' : '👤 User'} · {profile?.name || user?.email?.split('@')[0]}
        <span>{user?.email}</span>
      </div>
    </div>
  )
}

function Topbar({ title, onLogout }) {
  return (
    <div className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">
        <div className="status-dot"></div>
        <div className="status-text">Supabase Live</div>
        <button className="btn btn-ghost btn-sm" onClick={onLogout}>🚪 Logout</button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// ADMIN PAGES
// ══════════════════════════════════════════════════════════

function AdminDashboard({ showToast, user, profile }) {
  const [stats, setStats]     = useState({})
  const [scheds, setScheds]   = useState([])
  const [missed, setMissed]   = useState([])
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const [u, d, p, m] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('doctor').select('*', { count: 'exact', head: true }),
      supabase.from('prescription').select('*', { count: 'exact', head: true }),
      supabase.from('medicine').select('*', { count: 'exact', head: true }),
    ])
    setStats({ users: u.count || 0, doctors: d.count || 0, prescriptions: p.count || 0, medicines: m.count || 0 })
    const { data: sc } = await supabase.from('schedule')
      .select('schedule_id, time, start_date, end_date, dosage_id, dosage(amount, unit, frequency, medicine(name, brand))')
      .lte('start_date', today).gte('end_date', today).limit(10)
    setScheds(sc || [])
    const { data: mi } = await supabase.from('intake_log')
      .select('log_id, schedule_id, date, status').eq('status', 'Missed').order('date', { ascending: false }).limit(5)
    setMissed(mi || [])
    const { data: lg } = await supabase.from('intake_log')
      .select('log_id, schedule_id, date, time_taken, status').order('log_id', { ascending: false }).limit(8)
    setLogs(lg || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,212,170,0.15), rgba(0,184,148,0.05))',
        border: '1px solid rgba(0,212,170,0.2)', borderRadius: 14,
        padding: '20px 24px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700 }}>
            👑 Welcome, Admin {profile?.name || user?.email?.split('@')[0]}!
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Full system overview</div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{new Date().toDateString()}</div>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Users', value: stats.users, icon: '👥', accent: '#00d4aa' },
          { label: 'Doctors', value: stats.doctors, icon: '🩺', accent: '#4fa3e0' },
          { label: 'Prescriptions', value: stats.prescriptions, icon: '📋', accent: '#ffd166' },
          { label: 'Medicines', value: stats.medicines, icon: '💊', accent: '#ff6b6b' },
        ].map(c => (
          <div key={c.label} className="stat-card" style={{ '--accent': c.accent }}>
            <div className="stat-icon">{c.icon}</div>
            <div className="stat-value">{loading ? '...' : c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="section-card">
          <div className="section-header">
            <div><div className="section-title">📅 Today's Schedule</div><div className="section-subtitle">All medicines due today</div></div>
            <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
          </div>
          {loading ? <Loader /> : scheds.length === 0 ? <Empty icon="📭" text="No schedules for today" /> :
            <table>
              <thead><tr><th>Medicine</th><th>Brand</th><th>Dosage</th><th>Time</th></tr></thead>
              <tbody>{scheds.map(s => (
                <tr key={s.schedule_id}>
                  <td><strong>{s.dosage?.medicine?.name || '—'}</strong></td>
                  <td>{s.dosage?.medicine?.brand || '—'}</td>
                  <td>{s.dosage?.amount} {s.dosage?.unit} · {s.dosage?.frequency}</td>
                  <td><span className="badge badge-blue">{s.time}</span></td>
                </tr>
              ))}</tbody>
            </table>}
        </div>
        <div className="section-card">
          <div className="section-header"><div><div className="section-title">⚠️ Missed Doses</div><div className="section-subtitle">Recent missed intakes</div></div></div>
          {loading ? <Loader /> : missed.length === 0 ? <Empty icon="✅" text="No missed doses!" /> :
            <table>
              <thead><tr><th>Log ID</th><th>Schedule</th><th>Date</th></tr></thead>
              <tbody>{missed.map(m => <tr key={m.log_id}><td>#{m.log_id}</td><td>SCH-{m.schedule_id}</td><td>{m.date}</td></tr>)}</tbody>
            </table>}
        </div>
      </div>

      <div className="section-card">
        <div className="section-header"><div><div className="section-title">📝 Recent Intake Log</div><div className="section-subtitle">Latest dose records</div></div></div>
        {loading ? <Loader /> : logs.length === 0 ? <Empty icon="📭" text="No logs yet" /> :
          <table>
            <thead><tr><th>Log ID</th><th>Schedule</th><th>Date</th><th>Time Taken</th><th>Status</th></tr></thead>
            <tbody>{logs.map(l => (
              <tr key={l.log_id}>
                <td>#{l.log_id}</td><td>SCH-{l.schedule_id}</td><td>{l.date}</td><td>{l.time_taken || '—'}</td>
                <td><span className={`badge ${l.status === 'Taken' ? 'badge-green' : 'badge-red'}`}>{l.status}</span></td>
              </tr>
            ))}</tbody>
          </table>}
      </div>
    </div>
  )
}

function AdminUsers({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', age: '', gender: 'Male', email: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data: d, error } = await supabase.from('users').select('user_id, name, phone, age, gender, email, is_admin').order('user_id')
    if (error) showToast(error.message, 'error'); else setData(d)
    setLoading(false)
  }, [showToast])

  useEffect(() => { load() }, [load])

  const save = async () => {
    const payload = { name: form.name, phone: form.phone, age: parseInt(form.age), gender: form.gender, email: form.email }
    const { error } = modal === 'add' ? await supabase.from('users').insert(payload) : await supabase.from('users').update(payload).eq('user_id', form.user_id)
    if (error) return showToast(error.message, 'error')
    showToast(modal === 'add' ? 'User added!' : 'User updated!'); setModal(null); load()
  }

  const remove = async (id) => {
    if (!confirm(`Delete user #${id}?`)) return
    const { error } = await supabase.from('users').delete().eq('user_id', id)
    if (error) return showToast(error.message, 'error')
    showToast('User deleted!'); load()
  }

  return (
    <div>
      <div className="section-card">
        <div className="section-header">
          <div><div className="section-title">👥 All Users</div><div className="section-subtitle">Manage all patients</div></div>
          <button className="btn btn-primary btn-sm" onClick={() => { setForm({ name: '', phone: '', age: '', gender: 'Male', email: '' }); setModal('add') }}>+ Add User</button>
        </div>
        {loading ? <Loader /> : data.length === 0 ? <Empty icon="👥" text="No users" /> :
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Age</th><th>Gender</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
            <tbody>{data.map(u => (
              <tr key={u.user_id}>
                <td>#{u.user_id}</td><td><strong>{u.name}</strong></td><td>{u.phone}</td><td>{u.age}</td>
                <td><span className={`badge ${u.gender === 'Male' ? 'badge-blue' : 'badge-yellow'}`}>{u.gender}</span></td>
                <td>{u.email}</td>
                <td><span className={`badge ${u.is_admin ? 'badge-yellow' : 'badge-green'}`}>{u.is_admin ? '👑 Admin' : '👤 User'}</span></td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setForm(u); setModal('edit') }}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(u.user_id)}>🗑️</button>
                </td>
              </tr>
            ))}</tbody>
          </table>}
      </div>
      {modal && (
        <Modal title={modal === 'add' ? '➕ Add User' : '✏️ Edit User'} onClose={() => setModal(null)}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Arjun Menon" /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Age</label><input className="form-input" type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Gender</label>
              <select className="form-input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}><option>Male</option><option>Female</option><option>Other</option></select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>{modal === 'add' ? 'Add User' : 'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function AdminDoctors({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', specialization: '', email: '', phone: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data: d, error } = await supabase.from('doctor').select('*').order('doctor_id')
    if (error) showToast(error.message, 'error'); else setData(d)
    setLoading(false)
  }, [showToast])

  useEffect(() => { load() }, [load])

  const save = async () => {
    const { error } = await supabase.from('doctor').insert(form)
    if (error) return showToast(error.message, 'error')
    showToast('Doctor added!'); setModal(false); load()
  }

  const remove = async (id) => {
    if (!confirm(`Delete doctor #${id}?`)) return
    const { error } = await supabase.from('doctor').delete().eq('doctor_id', id)
    if (error) return showToast('🛡️ ' + error.message, 'error')
    showToast('Deleted!'); load()
  }

  return (
    <div>
      <div className="section-card">
        <div className="section-header">
          <div><div className="section-title">🩺 All Doctors</div><div className="section-subtitle">Manage all doctors</div></div>
          <button className="btn btn-primary btn-sm" onClick={() => { setForm({ name: '', specialization: '', email: '', phone: '' }); setModal(true) }}>+ Add Doctor</button>
        </div>
        {loading ? <Loader /> : data.length === 0 ? <Empty icon="🩺" text="No doctors" /> :
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Specialization</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
            <tbody>{data.map(d => (
              <tr key={d.doctor_id}>
                <td>#{d.doctor_id}</td><td><strong>{d.name}</strong></td>
                <td><span className="badge badge-blue">{d.specialization}</span></td>
                <td>{d.email}</td><td>{d.phone}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => remove(d.doctor_id)}>🗑️</button></td>
              </tr>
            ))}</tbody>
          </table>}
      </div>
      {modal && (
        <Modal title="➕ Add Doctor" onClose={() => setModal(false)}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Dr. Anil Kumar" /></div>
            <div className="form-group"><label className="form-label">Specialization</label><input className="form-input" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} placeholder="Cardiology" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Add Doctor</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function AdminPrescriptions({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ user_id: '', doctor_id: '', date_issued: today, notes: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data: d, error } = await supabase.from('prescription').select('prescription_id, user_id, doctor_id, date_issued, notes, users(name), doctor(name)').order('prescription_id')
    if (error) showToast(error.message, 'error'); else setData(d)
    setLoading(false)
  }, [showToast])

  useEffect(() => { load() }, [load])

  const save = async () => {
    const { error } = await supabase.from('prescription').insert({ ...form, user_id: parseInt(form.user_id), doctor_id: parseInt(form.doctor_id) })
    if (error) return showToast(error.message, 'error')
    showToast('Prescription added!'); setModal(false); load()
  }

  const remove = async (id) => {
    if (!confirm(`Delete prescription #${id}?`)) return
    const { error } = await supabase.from('prescription').delete().eq('prescription_id', id)
    if (error) return showToast(error.message, 'error')
    showToast('Deleted!'); load()
  }

  return (
    <div>
      <div className="section-card">
        <div className="section-header">
          <div><div className="section-title">📋 All Prescriptions</div><div className="section-subtitle">Manage all prescriptions</div></div>
          <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Add</button>
        </div>
        {loading ? <Loader /> : data.length === 0 ? <Empty icon="📋" text="No prescriptions" /> :
          <table>
            <thead><tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Notes</th><th>Actions</th></tr></thead>
            <tbody>{data.map(p => (
              <tr key={p.prescription_id}>
                <td>#{p.prescription_id}</td><td><strong>{p.users?.name || '—'}</strong></td>
                <td>{p.doctor?.name || '—'}</td><td>{p.date_issued}</td>
                <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.notes || '—'}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => remove(p.prescription_id)}>🗑️</button></td>
              </tr>
            ))}</tbody>
          </table>}
      </div>
      {modal && (
        <Modal title="➕ Add Prescription" onClose={() => setModal(false)}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">User ID</label><input className="form-input" type="number" value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} placeholder="1" /></div>
            <div className="form-group"><label className="form-label">Doctor ID</label><input className="form-input" type="number" value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })} placeholder="1" /></div>
          </div>
          <div className="form-group"><label className="form-label">Date Issued</label><input className="form-input" type="date" value={form.date_issued} onChange={e => setForm({ ...form, date_issued: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Notes</label><input className="form-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Take after food" /></div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Add</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function AdminMedicines({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', brand: '', type: 'Tablet', description: '', prescription_id: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data: d, error } = await supabase.from('medicine').select('medicine_id, name, brand, type, description, prescription_id').order('medicine_id')
    if (error) showToast(error.message, 'error'); else setData(d)
    setLoading(false)
  }, [showToast])

  useEffect(() => { load() }, [load])

  const save = async () => {
    const { error } = await supabase.from('medicine').insert({ ...form, prescription_id: parseInt(form.prescription_id) })
    if (error) return showToast(error.message, 'error')
    showToast('Medicine added!'); setModal(false); load()
  }

  const remove = async (id) => {
    if (!confirm(`Delete medicine #${id}?`)) return
    const { error } = await supabase.from('medicine').delete().eq('medicine_id', id)
    if (error) return showToast(error.message, 'error')
    showToast('Deleted!'); load()
  }

  return (
    <div>
      <div className="section-card">
        <div className="section-header">
          <div><div className="section-title">💉 All Medicines</div><div className="section-subtitle">Manage all medicines</div></div>
          <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Add</button>
        </div>
        {loading ? <Loader /> : data.length === 0 ? <Empty icon="💊" text="No medicines" /> :
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Brand</th><th>Type</th><th>Prescription</th><th>Actions</th></tr></thead>
            <tbody>{data.map(m => (
              <tr key={m.medicine_id}>
                <td>#{m.medicine_id}</td><td><strong>{m.name}</strong></td><td>{m.brand}</td>
                <td><span className="badge badge-green">{m.type}</span></td>
                <td>PRE-{m.prescription_id}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => remove(m.medicine_id)}>🗑️</button></td>
              </tr>
            ))}</tbody>
          </table>}
      </div>
      {modal && (
        <Modal title="➕ Add Medicine" onClose={() => setModal(false)}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Metformin" /></div>
            <div className="form-group"><label className="form-label">Brand</label><input className="form-input" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="Glucophage" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Type</label>
              <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {['Tablet', 'Capsule', 'Inhaler', 'Syrup', 'Injection', 'Cream', 'Eye Drop'].map(t => <option key={t}>{t}</option>)}
              </select></div>
            <div className="form-group"><label className="form-label">Prescription ID</label><input className="form-input" type="number" value={form.prescription_id} onChange={e => setForm({ ...form, prescription_id: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Add</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function AdminSchedules({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    setLoading(true)
    const { data: d, error } = await supabase.from('schedule')
      .select('schedule_id, start_date, end_date, time, dosage_id, dosage(amount, unit, frequency, medicine(name))').order('schedule_id')
    if (error) showToast(error.message, 'error'); else setData(d)
    setLoading(false)
  }, [showToast])

  useEffect(() => { load() }, [load])

  return (
    <div className="section-card">
      <div className="section-header">
        <div><div className="section-title">📅 All Schedules</div><div className="section-subtitle">All medicine schedules</div></div>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
      </div>
      {loading ? <Loader /> : data.length === 0 ? <Empty icon="📅" text="No schedules" /> :
        <table>
          <thead><tr><th>ID</th><th>Medicine</th><th>Dosage</th><th>Start</th><th>End</th><th>Time</th><th>Status</th></tr></thead>
          <tbody>{data.map(s => {
            const active = s.start_date <= today && s.end_date >= today
            return (
              <tr key={s.schedule_id}>
                <td>#{s.schedule_id}</td><td><strong>{s.dosage?.medicine?.name || '—'}</strong></td>
                <td>{s.dosage?.amount} {s.dosage?.unit} · {s.dosage?.frequency}</td>
                <td>{s.start_date}</td><td>{s.end_date}</td>
                <td><span className="badge badge-blue">{s.time}</span></td>
                <td><span className={`badge ${active ? 'badge-green' : 'badge-red'}`}>{active ? 'Active' : 'Ended'}</span></td>
              </tr>
            )
          })}</tbody>
        </table>}
    </div>
  )
}

function AdminReminders({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: d, error } = await supabase.from('reminder').select('reminder_id, schedule_id, mode, reminder_time, status').order('reminder_id')
    if (error) showToast(error.message, 'error'); else setData(d)
    setLoading(false)
  }, [showToast])

  useEffect(() => { load() }, [load])

  const toggle = async (id, status) => {
    const newStatus = status === 'Active' ? 'Inactive' : 'Active'
    const { error } = await supabase.from('reminder').update({ status: newStatus }).eq('reminder_id', id)
    if (error) return showToast(error.message, 'error')
    showToast(`Reminder ${newStatus}!`); load()
  }

  return (
    <div className="section-card">
      <div className="section-header"><div><div className="section-title">🔔 All Reminders</div><div className="section-subtitle">Manage all reminders</div></div></div>
      {loading ? <Loader /> : data.length === 0 ? <Empty icon="🔔" text="No reminders" /> :
        <table>
          <thead><tr><th>ID</th><th>Schedule</th><th>Mode</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{data.map(r => (
            <tr key={r.reminder_id}>
              <td>#{r.reminder_id}</td><td>SCH-{r.schedule_id}</td>
              <td><span className="badge badge-blue">{r.mode}</span></td><td>{r.reminder_time}</td>
              <td><span className={`badge ${r.status === 'Active' ? 'badge-green' : 'badge-red'}`}>{r.status}</span></td>
              <td><button className="btn btn-ghost btn-sm" onClick={() => toggle(r.reminder_id, r.status)}>
                {r.status === 'Active' ? '🔕 Deactivate' : '🔔 Activate'}
              </button></td>
            </tr>
          ))}</tbody>
        </table>}
    </div>
  )
}

function AdminIntakeLogs({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ schedule_id: '', date: today, time_taken: '', status: 'Taken' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data: d, error } = await supabase.from('intake_log').select('log_id, schedule_id, date, time_taken, status').order('log_id', { ascending: false }).limit(50)
    if (error) showToast(error.message, 'error'); else setData(d)
    setLoading(false)
  }, [showToast])

  useEffect(() => { load() }, [load])

  const save = async () => {
    const { error } = await supabase.from('intake_log').insert({
      schedule_id: parseInt(form.schedule_id), date: form.date,
      time_taken: form.status === 'Taken' ? (form.time_taken || null) : null, status: form.status
    })
    if (error) return showToast(error.message, 'error')
    showToast('Dose logged!'); setModal(false); load()
  }

  const remove = async (id) => {
    if (!confirm(`Delete log #${id}?`)) return
    const { error } = await supabase.from('intake_log').delete().eq('log_id', id)
    if (error) return showToast(error.message, 'error')
    showToast('Deleted!'); load()
  }

  return (
    <div>
      <div className="section-card">
        <div className="section-header">
          <div><div className="section-title">📝 All Intake Logs</div><div className="section-subtitle">All dose records</div></div>
          <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Log Dose</button>
        </div>
        {loading ? <Loader /> : data.length === 0 ? <Empty icon="📝" text="No logs" /> :
          <table>
            <thead><tr><th>Log ID</th><th>Schedule</th><th>Date</th><th>Time Taken</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{data.map(l => (
              <tr key={l.log_id}>
                <td>#{l.log_id}</td><td>SCH-{l.schedule_id}</td><td>{l.date}</td><td>{l.time_taken || '—'}</td>
                <td><span className={`badge ${l.status === 'Taken' ? 'badge-green' : 'badge-red'}`}>{l.status}</span></td>
                <td><button className="btn btn-danger btn-sm" onClick={() => remove(l.log_id)}>🗑️</button></td>
              </tr>
            ))}</tbody>
          </table>}
      </div>
      {modal && (
        <Modal title="📝 Log Dose" onClose={() => setModal(false)}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Schedule ID</label><input className="form-input" type="number" value={form.schedule_id} onChange={e => setForm({ ...form, schedule_id: e.target.value })} placeholder="1" /></div>
            <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Time Taken</label><input className="form-input" type="time" value={form.time_taken} onChange={e => setForm({ ...form, time_taken: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>Taken</option><option>Missed</option></select>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Log Dose</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// USER PAGES (Personal)
// ══════════════════════════════════════════════════════════

function UserProfile({ showToast, profile, user }) {
  const [form, setForm] = useState({ name: profile?.name || '', phone: profile?.phone || '', age: profile?.age || '', gender: profile?.gender || 'Male', email: profile?.email || '' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('users').update({
      name: form.name, phone: form.phone, age: parseInt(form.age), gender: form.gender
    }).eq('user_id', profile.user_id)
    if (error) showToast(error.message, 'error')
    else showToast('Profile updated!')
    setSaving(false)
  }

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, rgba(79,163,224,0.15), rgba(79,163,224,0.05))',
        border: '1px solid rgba(79,163,224,0.2)', borderRadius: 14,
        padding: '24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20
      }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(79,163,224,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
          👤
        </div>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700 }}>{profile?.name}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{user?.email}</div>
          <span className="badge badge-blue" style={{ marginTop: 8, display: 'inline-block' }}>Patient</span>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header"><div><div className="section-title">✏️ Edit Profile</div><div className="section-subtitle">Update your personal information</div></div></div>
        <div style={{ padding: 20 }}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Age</label><input className="form-input" type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Gender</label>
              <select className="form-input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}><option>Male</option><option>Female</option><option>Other</option></select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">Email (cannot change)</label><input className="form-input" value={form.email} disabled style={{ opacity: 0.5 }} /></div>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '⏳ Saving...' : '💾 Save Profile'}</button>
        </div>
      </div>
    </div>
  )
}

function UserDoctors({ showToast, profile }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: d, error } = await supabase.from('prescription')
      .select('doctor(doctor_id, name, specialization, email, phone)')
      .eq('user_id', profile.user_id)
    if (error) showToast(error.message, 'error')
    else {
      const doctors = d.map(p => p.doctor).filter(Boolean)
      const unique = [...new Map(doctors.map(d => [d.doctor_id, d])).values()]
      setData(unique)
    }
    setLoading(false)
  }, [showToast, profile])

  useEffect(() => { load() }, [load])

  return (
    <div className="section-card">
      <div className="section-header"><div><div className="section-title">🩺 My Doctors</div><div className="section-subtitle">Doctors who prescribed your medicines</div></div></div>
      {loading ? <Loader /> : data.length === 0 ? <Empty icon="🩺" text="No doctors assigned yet" /> :
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Specialization</th><th>Email</th><th>Phone</th></tr></thead>
          <tbody>{data.map(d => (
            <tr key={d.doctor_id}>
              <td>#{d.doctor_id}</td><td><strong>{d.name}</strong></td>
              <td><span className="badge badge-blue">{d.specialization}</span></td>
              <td>{d.email}</td><td>{d.phone}</td>
            </tr>
          ))}</tbody>
        </table>}
    </div>
  )
}

function UserMedicines({ showToast, profile }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: d, error } = await supabase.from('medicine')
      .select('medicine_id, name, brand, type, description, prescription_id, prescription!inner(user_id)')
      .eq('prescription.user_id', profile.user_id)
    if (error) showToast(error.message, 'error'); else setData(d)
    setLoading(false)
  }, [showToast, profile])

  useEffect(() => { load() }, [load])

  return (
    <div className="section-card">
      <div className="section-header"><div><div className="section-title">💊 My Medicines</div><div className="section-subtitle">Your prescribed medicines</div></div></div>
      {loading ? <Loader /> : data.length === 0 ? <Empty icon="💊" text="No medicines prescribed" /> :
        <table>
          <thead><tr><th>Name</th><th>Brand</th><th>Type</th><th>Description</th></tr></thead>
          <tbody>{data.map(m => (
            <tr key={m.medicine_id}>
              <td><strong>{m.name}</strong></td><td>{m.brand}</td>
              <td><span className="badge badge-green">{m.type}</span></td>
              <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.description || '—'}</td>
            </tr>
          ))}</tbody>
        </table>}
    </div>
  )
}

function UserSchedule({ showToast, profile }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    setLoading(true)
    const { data: d, error } = await supabase.from('schedule')
      .select('schedule_id, start_date, end_date, time, dosage(amount, unit, frequency, medicine(name, prescription(user_id)))')
      .order('schedule_id')
    if (error) showToast(error.message, 'error')
    else setData(d.filter(s => s.dosage?.medicine?.prescription?.user_id === profile.user_id))
    setLoading(false)
  }, [showToast, profile])

  useEffect(() => { load() }, [load])

  return (
    <div className="section-card">
      <div className="section-header">
        <div><div className="section-title">📅 My Schedule</div><div className="section-subtitle">Your medicine schedule</div></div>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
      </div>
      {loading ? <Loader /> : data.length === 0 ? <Empty icon="📅" text="No schedule found" /> :
        <table>
          <thead><tr><th>Medicine</th><th>Dosage</th><th>Start</th><th>End</th><th>Time</th><th>Status</th></tr></thead>
          <tbody>{data.map(s => {
            const active = s.start_date <= today && s.end_date >= today
            return (
              <tr key={s.schedule_id}>
                <td><strong>{s.dosage?.medicine?.name || '—'}</strong></td>
                <td>{s.dosage?.amount} {s.dosage?.unit} · {s.dosage?.frequency}</td>
                <td>{s.start_date}</td><td>{s.end_date}</td>
                <td><span className="badge badge-blue">{s.time}</span></td>
                <td><span className={`badge ${active ? 'badge-green' : 'badge-red'}`}>{active ? 'Active' : 'Ended'}</span></td>
              </tr>
            )
          })}</tbody>
        </table>}
    </div>
  )
}

function UserIntakeLogs({ showToast, profile }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ schedule_id: '', date: today, time_taken: '', status: 'Taken' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data: d, error } = await supabase.from('intake_log')
      .select('log_id, schedule_id, date, time_taken, status').order('log_id', { ascending: false }).limit(30)
    if (error) showToast(error.message, 'error'); else setData(d)
    setLoading(false)
  }, [showToast])

  useEffect(() => { load() }, [load])

  const save = async () => {
    const { error } = await supabase.from('intake_log').insert({
      schedule_id: parseInt(form.schedule_id), date: form.date,
      time_taken: form.status === 'Taken' ? (form.time_taken || null) : null, status: form.status
    })
    if (error) return showToast(error.message, 'error')
    showToast('Dose logged!'); setModal(false); load()
  }

  return (
    <div>
      <div className="section-card">
        <div className="section-header">
          <div><div className="section-title">📝 My Intake Log</div><div className="section-subtitle">Your dose history</div></div>
          <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Log Dose</button>
        </div>
        {loading ? <Loader /> : data.length === 0 ? <Empty icon="📝" text="No logs yet" /> :
          <table>
            <thead><tr><th>Log ID</th><th>Schedule</th><th>Date</th><th>Time Taken</th><th>Status</th></tr></thead>
            <tbody>{data.map(l => (
              <tr key={l.log_id}>
                <td>#{l.log_id}</td><td>SCH-{l.schedule_id}</td><td>{l.date}</td><td>{l.time_taken || '—'}</td>
                <td><span className={`badge ${l.status === 'Taken' ? 'badge-green' : 'badge-red'}`}>{l.status}</span></td>
              </tr>
            ))}</tbody>
          </table>}
      </div>
      {modal && (
        <Modal title="📝 Log Dose" onClose={() => setModal(false)}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Schedule ID</label><input className="form-input" type="number" value={form.schedule_id} onChange={e => setForm({ ...form, schedule_id: e.target.value })} placeholder="1" /></div>
            <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Time Taken</label><input className="form-input" type="time" value={form.time_taken} onChange={e => setForm({ ...form, time_taken: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>Taken</option><option>Missed</option></select>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Log Dose</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function UserReminders({ showToast, profile }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: d, error } = await supabase.from('reminder')
      .select('reminder_id, schedule_id, mode, reminder_time, status').order('reminder_id')
    if (error) showToast(error.message, 'error'); else setData(d)
    setLoading(false)
  }, [showToast])

  useEffect(() => { load() }, [load])

  const toggle = async (id, status) => {
    const newStatus = status === 'Active' ? 'Inactive' : 'Active'
    const { error } = await supabase.from('reminder').update({ status: newStatus }).eq('reminder_id', id)
    if (error) return showToast(error.message, 'error')
    showToast(`Reminder ${newStatus}!`); load()
  }

  return (
    <div className="section-card">
      <div className="section-header"><div><div className="section-title">🔔 My Reminders</div><div className="section-subtitle">Your medicine reminders</div></div></div>
      {loading ? <Loader /> : data.length === 0 ? <Empty icon="🔔" text="No reminders" /> :
        <table>
          <thead><tr><th>ID</th><th>Schedule</th><th>Mode</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{data.map(r => (
            <tr key={r.reminder_id}>
              <td>#{r.reminder_id}</td><td>SCH-{r.schedule_id}</td>
              <td><span className="badge badge-blue">{r.mode}</span></td><td>{r.reminder_time}</td>
              <td><span className={`badge ${r.status === 'Active' ? 'badge-green' : 'badge-red'}`}>{r.status}</span></td>
              <td><button className="btn btn-ghost btn-sm" onClick={() => toggle(r.reminder_id, r.status)}>
                {r.status === 'Active' ? '🔕 Deactivate' : '🔔 Activate'}
              </button></td>
            </tr>
          ))}</tbody>
        </table>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════
const ADMIN_PAGES = [
  { id: 'dashboard',     label: 'Dashboard',     icon: '🏠', section: 'Main'     },
  { id: 'users',         label: 'Users',         icon: '👥', section: 'Main'     },
  { id: 'doctors',       label: 'Doctors',       icon: '🩺', section: 'Main'     },
  { id: 'prescriptions', label: 'Prescriptions', icon: '📋', section: 'Medical'  },
  { id: 'medicines',     label: 'Medicines',     icon: '💉', section: 'Medical'  },
  { id: 'schedules',     label: 'Schedules',     icon: '📅', section: 'Medical'  },
  { id: 'reminders',     label: 'Reminders',     icon: '🔔', section: 'Tracking' },
  { id: 'intakelogs',    label: 'Intake Log',    icon: '📝', section: 'Tracking' },
]

const USER_PAGES = [
  { id: 'profile',    label: 'My Profile',    icon: '👤', section: 'Personal'  },
  { id: 'doctors',    label: 'My Doctors',    icon: '🩺', section: 'Personal'  },
  { id: 'medicines',  label: 'My Medicines',  icon: '💊', section: 'Medical'   },
  { id: 'schedule',   label: 'My Schedule',   icon: '📅', section: 'Medical'   },
  { id: 'intakelogs', label: 'My Intake Log', icon: '📝', section: 'Tracking'  },
  { id: 'reminders',  label: 'My Reminders',  icon: '🔔', section: 'Tracking'  },
]

export default function App() {
  const [user, setUser]               = useState(null)
  const [profile, setProfile]         = useState(null)
  const [page, setPage]               = useState('dashboard')
  const [toast, setToast]             = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        const { data: p } = await supabase.from('users').select('*').eq('auth_id', session.user.id).single()
        setProfile(p)
        setPage(p?.is_admin ? 'dashboard' : 'profile')
      }
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setUser(null); setProfile(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = (u, p) => {
    setUser(u); setProfile(p)
    setPage(p?.is_admin ? 'dashboard' : 'profile')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null); setProfile(null); setPage('dashboard')
  }

  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), [])

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>💊</div>
      <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }}></div>
      <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</div>
    </div>
  )

  if (!user) return <AuthPage onLogin={handleLogin} />

  const isAdmin = profile?.is_admin
  const pages = isAdmin ? ADMIN_PAGES : USER_PAGES
  const props = { showToast, user, profile }

  const renderPage = () => {
    if (isAdmin) {
      switch (page) {
        case 'dashboard':     return <AdminDashboard    {...props} />
        case 'users':         return <AdminUsers        {...props} />
        case 'doctors':       return <AdminDoctors      {...props} />
        case 'prescriptions': return <AdminPrescriptions {...props} />
        case 'medicines':     return <AdminMedicines    {...props} />
        case 'schedules':     return <AdminSchedules    {...props} />
        case 'reminders':     return <AdminReminders    {...props} />
        case 'intakelogs':    return <AdminIntakeLogs   {...props} />
        default:              return <AdminDashboard    {...props} />
      }
    } else {
      switch (page) {
        case 'profile':     return <UserProfile    {...props} />
        case 'doctors':     return <UserDoctors    {...props} />
        case 'medicines':   return <UserMedicines  {...props} />
        case 'schedule':    return <UserSchedule   {...props} />
        case 'intakelogs':  return <UserIntakeLogs {...props} />
        case 'reminders':   return <UserReminders  {...props} />
        default:            return <UserProfile    {...props} />
      }
    }
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar pages={pages} page={page} setPage={setPage} user={user} profile={profile} onLogout={handleLogout} />
      <div className="main">
        <Topbar title={pages.find(p => p.id === page)?.label} onLogout={handleLogout} />
        <div className="content">{renderPage()}</div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}