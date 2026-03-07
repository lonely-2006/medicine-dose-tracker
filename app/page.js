'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function getMedCardColor(index) {
  return ['', 'green', 'orange', 'yellow'][index % 4]
}
function getDoctorAccent(index) {
  return ['#2563eb','#16a34a','#d97706','#7c3aed','#0891b2','#dc2626'][index % 6]
}

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:300, background:type==='success'?'#ecfdf5':'#fef2f2', border:`1px solid ${type==='success'?'#a7f3d0':'#fecaca'}`, borderRadius:12, padding:'14px 18px', fontSize:13, minWidth:280, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', display:'flex', alignItems:'center', gap:10, color:type==='success'?'#059669':'#dc2626', fontWeight:600 }}>
      {type==='success'?'✅':'❌'} {message}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal"><div className="modal-title">{title}</div>{children}</div>
    </div>
  )
}

function Loader() { return <div className="loader"><div className="spinner"></div> Loading...</div> }
function Empty({ icon, text }) { return <div className="empty-state"><div className="empty-icon">{icon}</div>{text}</div> }

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [role, setRole] = useState('patient')
  const [form, setForm] = useState({ email:'', password:'', name:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const roles = [
    { id:'patient', label:'Patient', icon:'👤', color:'#2563eb' },
    { id:'doctor',  label:'Doctor',  icon:'🩺', color:'#16a34a' },
    { id:'admin',   label:'Admin',   icon:'👑', color:'#d97706' },
  ]

  const handleLogin = async () => {
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email:form.email, password:form.password })
    if (error) { setError(error.message); setLoading(false); return }
    const { data:profile } = await supabase.from('users').select('*').eq('auth_id', data.user.id).single()
    if (role==='admin' && !profile?.is_admin) {
      await supabase.auth.signOut(); setError('This account is not an Admin account.'); setLoading(false); return
    }
    if (role==='doctor' && !profile?.is_doctor) {
      await supabase.auth.signOut(); setError('This account is not a Doctor account.'); setLoading(false); return
    }
    if (role==='patient' && (profile?.is_admin || profile?.is_doctor)) {
      await supabase.auth.signOut(); setError('Please select the correct role for this account.'); setLoading(false); return
    }
    onLogin(data.user, profile)
    setLoading(false)
  }

  const handleRegister = async () => {
    if (role !== 'patient') {
      setError('Only Patient accounts can self-register. Doctor & Admin accounts are created by the system admin.'); return
    }
    if (!form.name) return setError('Please enter your name')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({ email:form.email, password:form.password, options:{ data:{ name:form.name } } })
    if (error) setError(error.message)
    else setSuccess('Account created! Please login now.')
    setLoading(false)
  }

  const activeRole = roles.find(r => r.id === role)

  return (
    <div className="auth-page">
      <div style={{ textAlign:'center', position:'relative', zIndex:1 }}>
        <div style={{ fontFamily:'Fraunces, serif', fontSize:38, fontWeight:700, color:'#fff', letterSpacing:'-1px' }}>Medi<span style={{ color:'#f59e0b' }}>Track</span></div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', letterSpacing:'2.5px', textTransform:'uppercase', marginTop:5 }}>Dose Tracker System</div>
      </div>
      <div className="auth-card">
        {/* Role Selector */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'1.5px', fontWeight:600, marginBottom:10 }}>Login as</div>
          <div style={{ display:'flex', gap:10 }}>
            {roles.map(r => (
              <button key={r.id} onClick={() => { setRole(r.id); setError(''); setSuccess('') }}
                style={{ flex:1, padding:'12px 8px', borderRadius:12, border:`2px solid ${role===r.id?r.color:'#e2e8f0'}`, background:role===r.id?`${r.color}10`:'#f8fafc', color:role===r.id?r.color:'#94a3b8', fontWeight:role===r.id?700:500, fontSize:13, cursor:'pointer', fontFamily:'Plus Jakarta Sans, sans-serif', transition:'all 0.2s', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:20 }}>{r.icon}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontFamily:'Fraunces, serif', fontSize:22, fontWeight:700, color:'#0f172a' }}>{mode==='login'?`${activeRole.icon} ${activeRole.label} Login`:'📝 Create Account'}</div>
          <div style={{ fontSize:13, color:'#94a3b8', marginTop:4 }}>{mode==='login'?`Sign in as ${activeRole.label}`:'Register as a new patient'}</div>
        </div>

        {/* Login / Register Toggle */}
        <div style={{ display:'flex', background:'#f1f5f9', borderRadius:10, padding:4, marginBottom:20 }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
              style={{ flex:1, padding:'9px 0', borderRadius:8, border:'none', background:mode===m?'#fff':'transparent', color:mode===m?'#0f172a':'#94a3b8', fontWeight:mode===m?700:500, fontSize:13, cursor:'pointer', fontFamily:'Plus Jakarta Sans, sans-serif', transition:'all 0.2s', boxShadow:mode===m?'0 1px 4px rgba(0,0,0,0.1)':'none' }}>
              {m==='login'?'🔑 Login':'📝 Register'}
            </button>
          ))}
        </div>

        {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#dc2626', marginBottom:16 }}>❌ {error}</div>}
        {success && <div style={{ background:'#ecfdf5', border:'1px solid #a7f3d0', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#059669', marginBottom:16 }}>✅ {success}</div>}

        {mode==='register' && role!=='patient' && (
          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#d97706', marginBottom:16 }}>
            ⚠️ Only Patient accounts can self-register. Contact admin for Doctor & Admin access.
          </div>
        )}

        {mode==='register' && <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" placeholder="John Doe" value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></div>}
        <div className="form-group"><label className="form-label">Email Address</label><input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form,email:e.target.value})} onKeyDown={e => e.key==='Enter' && (mode==='login'?handleLogin():handleRegister())}/></div>
        <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form,password:e.target.value})} onKeyDown={e => e.key==='Enter' && (mode==='login'?handleLogin():handleRegister())}/></div>

        <button className="btn btn-primary" style={{ width:'100%', padding:'12px', marginTop:6, fontSize:14, justifyContent:'center', background:activeRole.color, borderColor:activeRole.color }}
          onClick={mode==='login'?handleLogin:handleRegister} disabled={loading}>
          {loading?'⏳ Please wait...':mode==='login'?`${activeRole.icon} Sign in as ${activeRole.label}`:'📝 Create Account'}
        </button>

        <div style={{ textAlign:'center', marginTop:18, fontSize:12.5, color:'#94a3b8' }}>
          {mode==='login'?"Don't have an account? ":'Already have an account? '}
          <span style={{ color:'#1a3c5e', cursor:'pointer', fontWeight:700 }} onClick={() => { setMode(mode==='login'?'register':'login'); setError(''); setSuccess('') }}>{mode==='login'?'Register here':'Login here'}</span>
        </div>
      </div>
      <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', position:'relative', zIndex:1 }}>Secured by Supabase Authentication</div>
    </div>
  )
}

function Sidebar({ pages, page, setPage, user, profile }) {
  const sections = [...new Set(pages.map(p => p.section))]
  const roleLabel = profile?.is_admin?'Admin':profile?.is_doctor?'Doctor':'Patient'
  return (
    <div className="sidebar">
      <div className="logo">
        <div className="logo-text">Medi<span>Track</span></div>
        <div className="logo-sub">Dose Tracker System</div>
      </div>
      <nav className="nav">
        {sections.map(section => (
          <div key={section}>
            <div className="nav-section">{section}</div>
            {pages.filter(p => p.section===section).map(p => (
              <button key={p.id} className={`nav-item ${page===p.id?'active':''}`} onClick={() => setPage(p.id)}>
                <span className="nav-icon">{p.icon}</span><span>{p.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="db-badge">
        <div className="db-badge-avatar">{getInitials(profile?.name)}</div>
        <div className="db-badge-info">
          <span style={{ color:'#fff', fontWeight:600, fontSize:12 }}>{profile?.name||user?.email?.split('@')[0]}</span>
          <span>{roleLabel}</span>
        </div>
      </div>
    </div>
  )
}

function Topbar({ title, onLogout }) {
  return (
    <div className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">
        <div className="topbar-search">
          <span style={{ color:'#94a3b8', fontSize:14 }}>🔍</span>
          <input placeholder="Search..." />
        </div>
        <div className="status-dot"></div>
        <div className="status-text">Connected</div>
        <button className="btn btn-primary btn-sm" onClick={onLogout}>+ Add New</button>
      </div>
    </div>
  )
}

function UserDashboard({ showToast, profile }) {
  const [scheds, setScheds] = useState([])
  const [reminders, setReminders] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]
  const load = useCallback(async () => {
    setLoading(true)
    const { data:d } = await supabase.from('schedule').select('schedule_id,start_date,end_date,time,dosage(amount,unit,frequency,medicine(name,prescription(user_id)))').order('time')
    const myScheds = (d||[]).filter(s => s.dosage?.medicine?.prescription?.user_id===profile.user_id)
    const todayScheds = myScheds.filter(s => s.start_date<=today && s.end_date>=today)
    setScheds(todayScheds)
    const { data:r } = await supabase.from('reminder').select('*').eq('status','Active').limit(5)
    setReminders(r||[])
    const { data:logs } = await supabase.from('intake_log').select('status').gte('date',today)
    const taken = logs?.filter(l=>l.status==='Taken').length||0
    const missed = logs?.filter(l=>l.status==='Missed').length||0
    const adherence = todayScheds.length>0?Math.round((taken/(taken+missed||1))*100):89
    setStats({ todayDoses:todayScheds.length, taken, missed, active:myScheds.length, adherence })
    setLoading(false)
  }, [profile, today])
  useEffect(() => { load() }, [load])
  const statsConfig = [
    { label:"Today's Doses", value:stats.todayDoses??0, sub:`${stats.taken??0} taken · ${(stats.todayDoses??0)-(stats.taken??0)} remaining`, bar:(stats.taken/(stats.todayDoses||1))*100, accent:'#2563eb', accentLight:'#eff6ff' },
    { label:'Adherence Rate', value:`${stats.adherence??89}%`, sub:'This week', bar:stats.adherence??89, accent:'#16a34a', accentLight:'#dcfce7' },
    { label:'Active Medicines', value:stats.active??0, sub:'Your prescriptions', bar:70, accent:'#d97706', accentLight:'#fffbeb' },
    { label:'Missed Today', value:stats.missed??0, sub:'Check schedule', bar:(stats.missed??0)*20, accent:'#dc2626', accentLight:'#fef2f2' },
  ]
  return (
    <div>
      <div className="stats-grid">
        {statsConfig.map((c,i) => (
          <div key={i} className="stat-card" style={{ '--accent':c.accent, '--accent-light':c.accentLight }}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{loading?'—':c.value}</div>
            <div className="stat-sub">{c.sub}</div>
            <div className="stat-bar"><div className="stat-bar-fill" style={{ width:`${Math.min(c.bar||0,100)}%` }}></div></div>
          </div>
        ))}
      </div>
      <div className="dash-grid">
        <div className="section-card">
          <div className="section-header">
            <div><div className="section-title">📅 Today's Schedule</div><div className="section-subtitle">{new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div></div>
            <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
          </div>
          {loading?<Loader/>:scheds.length===0?<Empty icon="🎉" text="No medicines scheduled today!"/>:
            scheds.map(s => (
              <div key={s.schedule_id} className="schedule-item">
                <div className="schedule-item-bar pending"></div>
                <div className="schedule-time">{s.time?.slice(0,5)}</div>
                <div className="schedule-info">
                  <div className="schedule-name">{s.dosage?.medicine?.name}</div>
                  <div className="schedule-detail">{s.dosage?.amount} {s.dosage?.unit} · {s.dosage?.frequency}</div>
                </div>
                <span className="schedule-status-badge pending">Scheduled</span>
              </div>
            ))}
        </div>
        <div className="section-card">
          <div className="section-header"><div><div className="section-title">🔔 Active Reminders</div><div className="section-subtitle">Your upcoming reminders</div></div></div>
          {loading?<Loader/>:reminders.length===0?<Empty icon="🔕" text="No active reminders"/>:
            reminders.map(r => (
              <div key={r.reminder_id} className="reminder-card">
                <div className="reminder-icon-wrap">{r.mode==='Daily'?'⏰':r.mode==='Refill'?'🛒':'💊'}</div>
                <div className="reminder-info">
                  <div className="reminder-name">Schedule #{r.schedule_id}</div>
                  <div className="reminder-sub">{r.mode} · {r.reminder_time}</div>
                </div>
                <span className="badge badge-blue">{r.status}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

function UserMedicines({ showToast, profile }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true)
    const { data:d, error } = await supabase.from('medicine').select('medicine_id,name,brand,type,description,prescription_id,prescription!inner(user_id)').eq('prescription.user_id',profile.user_id)
    if (error) showToast(error.message,'error'); else setData(d)
    setLoading(false)
  }, [showToast, profile])
  useEffect(() => { load() }, [load])
  return (
    <div className="section-card">
      <div className="section-header"><div><div className="section-title">💊 My Medicines</div><div className="section-subtitle">Your prescribed medicines</div></div></div>
      {loading?<Loader/>:data.length===0?<Empty icon="💊" text="No medicines prescribed yet"/>:(
        <div className="medicine-grid">
          {data.map((m,i) => (
            <div key={m.medicine_id} className="medicine-card">
              <div className={`medicine-card-top ${getMedCardColor(i)}`}></div>
              <div className="medicine-card-body">
                <div className="medicine-card-header"><div><div className="medicine-card-name">{m.name}</div><div className="medicine-card-brand">{m.brand}</div></div></div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}><span className="badge badge-blue">{m.type}</span><span className="badge badge-green">Active</span></div>
                <div className="medicine-card-desc">{m.description||'—'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UserSchedule({ showToast, profile }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]
  const load = useCallback(async () => {
    setLoading(true)
    const { data:d, error } = await supabase.from('schedule').select('schedule_id,start_date,end_date,time,dosage(amount,unit,frequency,medicine(name,prescription(user_id)))').order('schedule_id')
    if (error) showToast(error.message,'error')
    else setData(d.filter(s => s.dosage?.medicine?.prescription?.user_id===profile.user_id))
    setLoading(false)
  }, [showToast, profile])
  useEffect(() => { load() }, [load])
  return (
    <div className="section-card">
      <div className="section-header">
        <div><div className="section-title">📅 My Schedule</div><div className="section-subtitle">Active medicine schedules</div></div>
        <div style={{ display:'flex', gap:8 }}><button className="btn btn-ghost btn-sm">Week View</button><button className="btn btn-ghost btn-sm">Month View</button></div>
      </div>
      {loading?<Loader/>:data.length===0?<Empty icon="📅" text="No schedules found"/>:(
        <table>
          <thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Start Date</th><th>End Date</th><th>Time(s)</th><th>Status</th></tr></thead>
          <tbody>{data.map(s => {
            const active = s.start_date<=today && s.end_date>=today
            return (
              <tr key={s.schedule_id}>
                <td><strong>{s.dosage?.medicine?.name||'—'}</strong></td>
                <td>{s.dosage?.amount} {s.dosage?.unit}</td><td>{s.dosage?.frequency}</td>
                <td>{s.start_date}</td><td>{s.end_date}</td>
                <td><span className="badge badge-blue">{s.time?.slice(0,5)}</span></td>
                <td><span className={`badge ${active?'badge-green':'badge-red'}`}>{active?'Active':'Ended'}</span></td>
              </tr>
            )
          })}</tbody>
        </table>
      )}
    </div>
  )
}

function UserPrescriptions({ showToast, profile }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true)
    const { data:d, error } = await supabase.from('prescription').select('prescription_id,date_issued,notes,doctor(name),medicine(name)').eq('user_id',profile.user_id).order('prescription_id')
    if (error) showToast(error.message,'error'); else setData(d)
    setLoading(false)
  }, [showToast, profile])
  useEffect(() => { load() }, [load])
  const getStatus = (dateIssued) => {
    const diff = (new Date()-new Date(dateIssued))/(1000*60*60*24)
    if (diff<30) return { label:'Active', cls:'badge-green' }
    if (diff<90) return { label:'Ongoing', cls:'badge-blue' }
    return { label:'Ending', cls:'badge-yellow' }
  }
  return (
    <div className="section-card">
      <div className="section-header"><div><div className="section-title">📋 My Prescriptions</div><div className="section-subtitle">Prescriptions issued by your doctors</div></div></div>
      {loading?<Loader/>:data.length===0?<Empty icon="📋" text="No prescriptions yet"/>:(
        <table>
          <thead><tr><th>Prescription ID</th><th>Doctor</th><th>Date Issued</th><th>Medicines</th><th>Notes</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{data.map(p => {
            const s = getStatus(p.date_issued)
            return (
              <tr key={p.prescription_id}>
                <td><strong>#RX-{String(p.prescription_id).padStart(4,'0')}</strong></td>
                <td>{p.doctor?.name||'—'}</td><td>{p.date_issued}</td>
                <td>{Array.isArray(p.medicine)?p.medicine.map(m=>m.name).join(', '):p.medicine?.name||'—'}</td>
                <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.notes||'—'}</td>
                <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                <td><button className="btn btn-ghost btn-sm">View</button></td>
              </tr>
            )
          })}</tbody>
        </table>
      )}
    </div>
  )
}

function UserIntakeLogs({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ schedule_id:'', date:today, time_taken:'', status:'Taken' })
  const load = useCallback(async () => {
    setLoading(true)
    const { data:d, error } = await supabase.from('intake_log').select('log_id,schedule_id,date,time_taken,status').order('log_id',{ ascending:false }).limit(30)
    if (error) showToast(error.message,'error'); else setData(d)
    setLoading(false)
  }, [showToast])
  useEffect(() => { load() }, [load])
  const save = async () => {
    const { error } = await supabase.from('intake_log').insert({ schedule_id:parseInt(form.schedule_id), date:form.date, time_taken:form.status==='Taken'?(form.time_taken||null):null, status:form.status })
    if (error) return showToast(error.message,'error')
    showToast('Dose logged!'); setModal(false); load()
  }
  const statusBadge = s => s==='Taken'?'badge-green':s==='Missed'?'badge-red':'badge-yellow'
  return (
    <div>
      <div className="section-card">
        <div className="section-header">
          <div><div className="section-title">📝 Intake Log History</div><div className="section-subtitle">Your dose history</div></div>
          <div style={{ display:'flex', gap:8 }}>
            <select className="form-input" style={{ width:140, padding:'6px 10px', fontSize:12 }}><option>All Medicines</option></select>
            <input type="date" className="form-input" defaultValue={today} style={{ width:150, padding:'6px 10px', fontSize:12 }} />
            <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Log Dose</button>
          </div>
        </div>
        {loading?<Loader/>:data.length===0?<Empty icon="📝" text="No logs yet"/>:(
          <table>
            <thead><tr><th>Log ID</th><th>Medicine</th><th>Scheduled</th><th>Time Taken</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>{data.map(l => (
              <tr key={l.log_id}>
                <td><strong>#LOG-{String(l.log_id).padStart(3,'0')}</strong></td>
                <td>SCH-{l.schedule_id}</td><td>—</td><td>{l.time_taken||'—'}</td><td>{l.date}</td>
                <td><span className={`badge ${statusBadge(l.status)}`}>{l.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {modal && (
        <Modal title="📝 Log Dose" onClose={() => setModal(false)}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Schedule ID</label><input className="form-input" type="number" value={form.schedule_id} onChange={e => setForm({...form,schedule_id:e.target.value})} placeholder="1"/></div>
            <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={form.date} onChange={e => setForm({...form,date:e.target.value})}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Time Taken</label><input className="form-input" type="time" value={form.time_taken} onChange={e => setForm({...form,time_taken:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => setForm({...form,status:e.target.value})}><option>Taken</option><option>Missed</option><option>Skipped</option></select>
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

function UserReminders({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ schedule_id:'', reminder_time:'08:00', mode:'Daily', status:'Active' })
  const [saving, setSaving] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    const { data:d, error } = await supabase.from('reminder').select('reminder_id,schedule_id,mode,reminder_time,status').order('reminder_id')
    if (error) showToast(error.message,'error'); else setData(d)
    setLoading(false)
  }, [showToast])
  useEffect(() => { load() }, [load])
  const save = async () => {
    if (!form.schedule_id) return showToast('Enter a schedule ID','error')
    setSaving(true)
    const { error } = await supabase.from('reminder').insert({ schedule_id:parseInt(form.schedule_id), reminder_time:form.reminder_time, mode:form.mode, status:form.status })
    if (error) showToast(error.message,'error'); else { showToast('Reminder saved!'); load() }
    setSaving(false)
  }
  const icons = { Daily:'⏰', Weekly:'💊', 'One-time':'🔔', Refill:'🛒' }
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20 }}>
      <div className="section-card">
        <div className="section-header"><div><div className="section-title">🔔 Active Reminders</div><div className="section-subtitle">Your medicine reminders</div></div></div>
        {loading?<Loader/>:data.length===0?<Empty icon="🔔" text="No reminders set"/>:
          data.map(r => (
            <div key={r.reminder_id} className="reminder-card">
              <div className="reminder-icon-wrap">{icons[r.mode]||'🔔'}</div>
              <div className="reminder-info">
                <div className="reminder-name">Schedule #{r.schedule_id} — {r.mode}</div>
                <div className="reminder-sub">{r.mode} · {r.reminder_time} · Status: {r.status}</div>
              </div>
              <button className="btn btn-ghost btn-sm">Edit</button>
            </div>
          ))}
      </div>
      <div className="section-card" style={{ alignSelf:'start' }}>
        <div className="section-header"><div><div className="section-title">➕ Add Reminder</div></div></div>
        <div style={{ padding:20 }}>
          <div className="form-group"><label className="form-label">Medicine (Schedule ID)</label><input className="form-input" type="number" placeholder="Schedule ID" value={form.schedule_id} onChange={e => setForm({...form,schedule_id:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Reminder Time</label><input className="form-input" type="time" value={form.reminder_time} onChange={e => setForm({...form,reminder_time:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Mode</label>
            <select className="form-input" value={form.mode} onChange={e => setForm({...form,mode:e.target.value})}><option>Daily</option><option>Weekly</option><option>One-time</option><option>Refill</option></select>
          </div>
          <div className="form-group"><label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={e => setForm({...form,status:e.target.value})}><option>Active</option><option>Inactive</option></select>
          </div>
          <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }} onClick={save} disabled={saving}>{saving?'⏳ Saving...':'💾 Save Reminder'}</button>
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
    const { data:d, error } = await supabase.from('prescription').select('doctor(doctor_id,name,specialization,email,phone)').eq('user_id',profile.user_id)
    if (error) showToast(error.message,'error')
    else { const docs = d.map(p=>p.doctor).filter(Boolean); setData([...new Map(docs.map(d=>[d.doctor_id,d])).values()]) }
    setLoading(false)
  }, [showToast, profile])
  useEffect(() => { load() }, [load])
  const statusLabels = ['Active Patient','Consulting','Short-term','Ongoing']
  const statusColors = ['badge-green','badge-blue','badge-yellow','badge-teal']
  return (
    <div className="section-card">
      <div className="section-header"><div><div className="section-title">🩺 My Doctors</div><div className="section-subtitle">Doctors who prescribed your medicines</div></div></div>
      {loading?<Loader/>:data.length===0?<Empty icon="🩺" text="No doctors assigned yet"/>:(
        <div className="doctor-grid">
          {data.map((d,i) => (
            <div key={d.doctor_id} className="doctor-card">
              <div className="doctor-card-accent" style={{ background:getDoctorAccent(i) }}></div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginTop:8 }}>
                <div className="doctor-avatar" style={{ background:`linear-gradient(135deg, ${getDoctorAccent(i)}33, ${getDoctorAccent(i)}55)`, color:getDoctorAccent(i) }}>{getInitials(d.name)}</div>
                <button className="btn btn-ghost btn-sm">View</button>
              </div>
              <div className="doctor-name">{d.name}</div>
              <div className="doctor-spec">{d.specialization}</div>
              <div className="doctor-info-row"><span>📧</span><span>{d.email}</span></div>
              <div className="doctor-info-row"><span>📱</span><span>{d.phone}</span></div>
              <div style={{ marginTop:12 }}><span className={`badge ${statusColors[i%statusColors.length]}`}>{statusLabels[i%statusLabels.length]}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UserProfile({ showToast, profile, user }) {
  const [form, setForm] = useState({ name:profile?.name||'', phone:profile?.phone||'', age:profile?.age||'', gender:profile?.gender||'Male', notes:'' })
  const [saving, setSaving] = useState(false)
  const [notifPref, setNotifPref] = useState('Push + SMS')
  const [lang, setLang] = useState('English')
  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('users').update({ name:form.name, phone:form.phone, age:parseInt(form.age), gender:form.gender }).eq('user_id',profile.user_id)
    if (error) showToast(error.message,'error'); else showToast('Profile updated!')
    setSaving(false)
  }
  return (
    <div>
      <div className="profile-header">
        <div className="profile-avatar">{getInitials(profile?.name)}</div>
        <div>
          <div className="profile-name">{profile?.name}</div>
          <div className="profile-meta">Patient ID: USR-{String(profile?.user_id||0).padStart(8,'0')} · Age {profile?.age} · {profile?.gender}</div>
          <div className="profile-meta" style={{ marginTop:4 }}>📱 {profile?.phone||'—'} &nbsp;·&nbsp; ✉️ {user?.email}</div>
        </div>
      </div>
      <div className="dash-grid">
        <div className="section-card">
          <div className="section-header"><div><div className="section-title">Personal Information</div></div><button className="btn btn-ghost btn-sm">Edit</button></div>
          <div style={{ padding:22 }}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">Age</label><input className="form-input" type="number" value={form.age} onChange={e => setForm({...form,age:e.target.value})}/></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={user?.email||''} disabled/></div>
            </div>
            <div className="form-group"><label className="form-label">Calendar / Notes</label><textarea className="form-input" rows={3} value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} placeholder="Regular checkups every 3 months..." style={{ resize:'vertical' }}/></div>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'⏳ Saving...':'💾 Save Changes'}</button>
          </div>
        </div>
        <div>
          <div className="section-card" style={{ marginBottom:16 }}>
            <div className="section-header"><div><div className="section-title">Health Summary</div></div></div>
            <div style={{ padding:20 }}>
              {[{ label:'Overall Adherence', value:89 },{ label:'This Week', value:83 },{ label:'This Month', value:91 }].map(h => (
                <div key={h.label} className="health-bar-row">
                  <div className="health-bar-label">{h.label} <span>{h.value}%</span></div>
                  <div className="health-bar-track"><div className="health-bar-fill" style={{ width:`${h.value}%` }}></div></div>
                </div>
              ))}
            </div>
          </div>
          <div className="section-card">
            <div className="section-header"><div><div className="section-title">Account Settings</div></div></div>
            <div style={{ padding:20 }}>
              <div className="form-group"><label className="form-label">Notification Preference</label>
                <select className="form-input" value={notifPref} onChange={e => setNotifPref(e.target.value)}><option>Push + SMS</option><option>Push Only</option><option>SMS Only</option><option>Email</option><option>None</option></select>
              </div>
              <div className="form-group"><label className="form-label">Language</label>
                <select className="form-input" value={lang} onChange={e => setLang(e.target.value)}><option>English</option><option>Hindi</option><option>Malayalam</option><option>Tamil</option></select>
              </div>
              <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'center', marginBottom:10 }}>Save Settings</button>
              <button className="btn btn-danger" style={{ width:'100%', justifyContent:'center', background:'#dc2626', color:'#fff', border:'none' }} onClick={async () => { await supabase.auth.signOut(); window.location.reload() }}>Logout</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DoctorDashboard({ showToast, user, profile }) {
  const [stats, setStats] = useState({})
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true)
    const { data:dr } = await supabase.from('doctor').select('*').eq('email',user.email).single()
    if (!dr) { setLoading(false); return }
    const [p,m] = await Promise.all([
      supabase.from('prescription').select('*',{ count:'exact', head:true }).eq('doctor_id',dr.doctor_id),
      supabase.from('medicine').select('prescription_id,prescription!inner(doctor_id)').eq('prescription.doctor_id',dr.doctor_id),
    ])
    setStats({ prescriptions:p.count||0, medicines:m.data?.length||0 })
    const { data:pr } = await supabase.from('prescription').select('prescription_id,date_issued,notes,users(name,email)').eq('doctor_id',dr.doctor_id).order('prescription_id',{ ascending:false }).limit(10)
    setPrescriptions(pr||[])
    setLoading(false)
  }, [user])
  useEffect(() => { load() }, [load])
  return (
    <div>
      <div className="welcome-banner">
        <div><div className="welcome-title">🩺 Welcome, Dr. {profile?.name?.split(' ')[0]}!</div><div className="welcome-sub">Here is your patient overview for today</div></div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>{new Date().toLocaleDateString('en-US',{ weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(2,1fr)' }}>
        {[{ label:'My Prescriptions', value:stats.prescriptions, accent:'#2563eb', accentLight:'#eff6ff' },{ label:'Medicines Prescribed', value:stats.medicines, accent:'#16a34a', accentLight:'#dcfce7' }].map(c => (
          <div key={c.label} className="stat-card" style={{ '--accent':c.accent, '--accent-light':c.accentLight }}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{loading?'—':c.value??0}</div>
          </div>
        ))}
      </div>
      <div className="section-card">
        <div className="section-header"><div><div className="section-title">📋 Recent Prescriptions</div><div className="section-subtitle">Your latest prescriptions</div></div><button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button></div>
        {loading?<Loader/>:prescriptions.length===0?<Empty icon="📋" text="No prescriptions yet"/>:(
          <table>
            <thead><tr><th>ID</th><th>Patient</th><th>Email</th><th>Date</th><th>Notes</th></tr></thead>
            <tbody>{prescriptions.map(p => (
              <tr key={p.prescription_id}>
                <td><strong>#RX-{String(p.prescription_id).padStart(4,'0')}</strong></td>
                <td><strong>{p.users?.name||'—'}</strong></td><td>{p.users?.email||'—'}</td><td>{p.date_issued}</td>
                <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.notes||'—'}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function DoctorPatients({ showToast, user }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true)
    const { data:dr } = await supabase.from('doctor').select('doctor_id').eq('email',user.email).single()
    if (!dr) { setLoading(false); return }
    const { data:pr, error } = await supabase.from('prescription').select('users(user_id,name,phone,age,gender,email)').eq('doctor_id',dr.doctor_id)
    if (error) showToast(error.message,'error')
    else { const pts = pr.map(p=>p.users).filter(Boolean); setData([...new Map(pts.map(p=>[p.user_id,p])).values()]) }
    setLoading(false)
  }, [showToast, user])
  useEffect(() => { load() }, [load])
  return (
    <div className="section-card">
      <div className="section-header"><div><div className="section-title">👥 My Patients</div><div className="section-subtitle">Patients you have prescribed</div></div></div>
      {loading?<Loader/>:data.length===0?<Empty icon="👥" text="No patients yet"/>:(
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Age</th><th>Gender</th><th>Email</th></tr></thead>
          <tbody>{data.map(u => (
            <tr key={u.user_id}><td>#{u.user_id}</td><td><strong>{u.name}</strong></td><td>{u.phone||'—'}</td><td>{u.age||'—'}</td>
              <td><span className={`badge ${u.gender==='Male'?'badge-blue':'badge-purple'}`}>{u.gender||'—'}</span></td><td>{u.email}</td></tr>
          ))}</tbody>
        </table>
      )}
    </div>
  )
}

function DoctorPrescriptions({ showToast, user }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ user_id:'', date_issued:today, notes:'' })
  const [doctorId, setDoctorId] = useState(null)
  const load = useCallback(async () => {
    setLoading(true)
    const { data:dr } = await supabase.from('doctor').select('doctor_id').eq('email',user.email).single()
    if (!dr) { setLoading(false); return }
    setDoctorId(dr.doctor_id)
    const { data:d, error } = await supabase.from('prescription').select('prescription_id,user_id,date_issued,notes,users(name)').eq('doctor_id',dr.doctor_id).order('prescription_id')
    if (error) showToast(error.message,'error'); else setData(d)
    setLoading(false)
  }, [showToast, user])
  useEffect(() => { load() }, [load])
  const save = async () => {
    const { error } = await supabase.from('prescription').insert({ user_id:parseInt(form.user_id), doctor_id:doctorId, date_issued:form.date_issued, notes:form.notes })
    if (error) return showToast(error.message,'error')
    showToast('Prescription added!'); setModal(false); load()
  }
  return (
    <div>
      <div className="section-card">
        <div className="section-header"><div><div className="section-title">📋 My Prescriptions</div><div className="section-subtitle">Prescriptions you have issued</div></div><button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Add</button></div>
        {loading?<Loader/>:data.length===0?<Empty icon="📋" text="No prescriptions"/>:(
          <table>
            <thead><tr><th>ID</th><th>Patient</th><th>Date</th><th>Notes</th><th>Status</th></tr></thead>
            <tbody>{data.map(p => (
              <tr key={p.prescription_id}>
                <td><strong>#RX-{String(p.prescription_id).padStart(4,'0')}</strong></td>
                <td><strong>{p.users?.name||'—'}</strong></td><td>{p.date_issued}</td>
                <td style={{ maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.notes||'—'}</td>
                <td><span className="badge badge-green">Active</span></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {modal && (
        <Modal title="➕ Add Prescription" onClose={() => setModal(false)}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Patient User ID</label><input className="form-input" type="number" value={form.user_id} onChange={e => setForm({...form,user_id:e.target.value})} placeholder="1"/></div>
            <div className="form-group"><label className="form-label">Date Issued</label><input className="form-input" type="date" value={form.date_issued} onChange={e => setForm({...form,date_issued:e.target.value})}/></div>
          </div>
          <div className="form-group"><label className="form-label">Notes</label><input className="form-input" value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} placeholder="Take after food"/></div>
          <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Add</button></div>
        </Modal>
      )}
    </div>
  )
}

function DoctorMedicines({ showToast, user }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true)
    const { data:dr } = await supabase.from('doctor').select('doctor_id').eq('email',user.email).single()
    if (!dr) { setLoading(false); return }
    const { data:d, error } = await supabase.from('medicine').select('medicine_id,name,brand,type,description,prescription_id,prescription!inner(doctor_id)').eq('prescription.doctor_id',dr.doctor_id)
    if (error) showToast(error.message,'error'); else setData(d)
    setLoading(false)
  }, [showToast, user])
  useEffect(() => { load() }, [load])
  return (
    <div className="section-card">
      <div className="section-header"><div><div className="section-title">💊 Medicines Prescribed</div><div className="section-subtitle">All medicines you have prescribed</div></div></div>
      {loading?<Loader/>:data.length===0?<Empty icon="💊" text="No medicines prescribed"/>:(
        <div className="medicine-grid">
          {data.map((m,i) => (
            <div key={m.medicine_id} className="medicine-card">
              <div className={`medicine-card-top ${getMedCardColor(i)}`}></div>
              <div className="medicine-card-body">
                <div className="medicine-card-header"><div><div className="medicine-card-name">{m.name}</div><div className="medicine-card-brand">{m.brand}</div></div></div>
                <div style={{ display:'flex', gap:6 }}><span className="badge badge-blue">{m.type}</span><span className="badge badge-green">Active</span></div>
                <div className="medicine-card-desc">{m.description||'—'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DoctorSchedules({ showToast, user }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]
  const load = useCallback(async () => {
    setLoading(true)
    const { data:dr } = await supabase.from('doctor').select('doctor_id').eq('email',user.email).single()
    if (!dr) { setLoading(false); return }
    const { data:d, error } = await supabase.from('schedule').select('schedule_id,start_date,end_date,time,dosage(amount,unit,frequency,medicine(name,prescription(doctor_id)))').order('schedule_id')
    if (error) showToast(error.message,'error')
    else setData(d.filter(s => s.dosage?.medicine?.prescription?.doctor_id===dr.doctor_id))
    setLoading(false)
  }, [showToast, user])
  useEffect(() => { load() }, [load])
  return (
    <div className="section-card">
      <div className="section-header"><div><div className="section-title">📅 Patient Schedules</div><div className="section-subtitle">Medicine schedules for your patients</div></div><button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button></div>
      {loading?<Loader/>:data.length===0?<Empty icon="📅" text="No schedules found"/>:(
        <table>
          <thead><tr><th>ID</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Start</th><th>End</th><th>Time</th><th>Status</th></tr></thead>
          <tbody>{data.map(s => {
            const active = s.start_date<=today && s.end_date>=today
            return (
              <tr key={s.schedule_id}>
                <td>#{s.schedule_id}</td><td><strong>{s.dosage?.medicine?.name||'—'}</strong></td>
                <td>{s.dosage?.amount} {s.dosage?.unit}</td><td>{s.dosage?.frequency}</td>
                <td>{s.start_date}</td><td>{s.end_date}</td>
                <td><span className="badge badge-blue">{s.time?.slice(0,5)}</span></td>
                <td><span className={`badge ${active?'badge-green':'badge-red'}`}>{active?'Active':'Ended'}</span></td>
              </tr>
            )
          })}</tbody>
        </table>
      )}
    </div>
  )
}

function AdminDashboard({ showToast, user, profile }) {
  const [stats, setStats] = useState({})
  const [scheds, setScheds] = useState([])
  const [missed, setMissed] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const [u,d,p,m] = await Promise.all([
      supabase.from('users').select('*',{ count:'exact', head:true }),
      supabase.from('doctor').select('*',{ count:'exact', head:true }),
      supabase.from('prescription').select('*',{ count:'exact', head:true }),
      supabase.from('medicine').select('*',{ count:'exact', head:true }),
    ])
    setStats({ users:u.count||0, doctors:d.count||0, prescriptions:p.count||0, medicines:m.count||0 })
    const { data:sc } = await supabase.from('schedule').select('schedule_id,time,start_date,end_date,dosage(amount,unit,frequency,medicine(name,brand))').lte('start_date',today).gte('end_date',today).limit(10)
    setScheds(sc||[])
    const { data:mi } = await supabase.from('intake_log').select('log_id,schedule_id,date,status').eq('status','Missed').order('date',{ ascending:false }).limit(5)
    setMissed(mi||[])
    const { data:lg } = await supabase.from('intake_log').select('log_id,schedule_id,date,time_taken,status').order('log_id',{ ascending:false }).limit(8)
    setLogs(lg||[])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  return (
    <div>
      <div className="welcome-banner">
        <div><div className="welcome-title">👑 Admin Dashboard</div><div className="welcome-sub">System overview — {new Date().toLocaleDateString('en-US',{ weekday:'long', month:'long', day:'numeric', year:'numeric' })}</div></div>
        <button className="btn btn-ghost btn-sm" style={{ color:'#fff', borderColor:'rgba(255,255,255,0.2)' }} onClick={load}>↻ Refresh</button>
      </div>
      <div className="stats-grid">
        {[{ label:'Total Users', value:stats.users, accent:'#2563eb', accentLight:'#eff6ff' },{ label:'Doctors', value:stats.doctors, accent:'#0891b2', accentLight:'#ecfeff' },{ label:'Prescriptions', value:stats.prescriptions, accent:'#d97706', accentLight:'#fffbeb' },{ label:'Medicines', value:stats.medicines, accent:'#dc2626', accentLight:'#fef2f2' }].map(c => (
          <div key={c.label} className="stat-card" style={{ '--accent':c.accent, '--accent-light':c.accentLight }}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{loading?'—':c.value}</div>
          </div>
        ))}
      </div>
      <div className="dash-grid">
        <div className="section-card">
          <div className="section-header"><div><div className="section-title">📅 Today's Schedule</div><div className="section-subtitle">Active medicines due today</div></div></div>
          {loading?<Loader/>:scheds.length===0?<Empty icon="📭" text="No schedules for today"/>:
            scheds.map(s => (
              <div key={s.schedule_id} className="schedule-item">
                <div className="schedule-item-bar pending"></div>
                <div className="schedule-time">{s.time?.slice(0,5)}</div>
                <div className="schedule-info"><div className="schedule-name">{s.dosage?.medicine?.name||'—'}</div><div className="schedule-detail">{s.dosage?.amount}{s.dosage?.unit} · {s.dosage?.frequency}</div></div>
              </div>
            ))}
        </div>
        <div className="section-card">
          <div className="section-header"><div><div className="section-title">⚠️ Missed Doses</div><div className="section-subtitle">Recent missed intakes</div></div></div>
          {loading?<Loader/>:missed.length===0?<Empty icon="✅" text="No missed doses!"/>:(
            <table><thead><tr><th>Log ID</th><th>Schedule</th><th>Date</th></tr></thead>
            <tbody>{missed.map(m => <tr key={m.log_id}><td>#{m.log_id}</td><td>SCH-{m.schedule_id}</td><td>{m.date}</td></tr>)}</tbody></table>
          )}
        </div>
      </div>
      <div className="section-card">
        <div className="section-header"><div><div className="section-title">📝 Recent Intake Log</div><div className="section-subtitle">Latest dose records</div></div></div>
        {loading?<Loader/>:logs.length===0?<Empty icon="📭" text="No logs yet"/>:(
          <table>
            <thead><tr><th>Log ID</th><th>Schedule</th><th>Date</th><th>Time Taken</th><th>Status</th></tr></thead>
            <tbody>{logs.map(l => (
              <tr key={l.log_id}><td><strong>#LOG-{String(l.log_id).padStart(3,'0')}</strong></td><td>SCH-{l.schedule_id}</td><td>{l.date}</td><td>{l.time_taken||'—'}</td>
                <td><span className={`badge ${l.status==='Taken'?'badge-green':'badge-red'}`}>{l.status}</span></td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function AdminUsers({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name:'', phone:'', age:'', gender:'Male', email:'' })
  const load = useCallback(async () => {
    setLoading(true)
    const { data:d, error } = await supabase.from('users').select('user_id,name,phone,age,gender,email,is_admin,is_doctor').order('user_id')
    if (error) showToast(error.message,'error'); else setData(d)
    setLoading(false)
  }, [showToast])
  useEffect(() => { load() }, [load])
  const save = async () => {
    const payload = { name:form.name, phone:form.phone, age:parseInt(form.age), gender:form.gender, email:form.email }
    const { error } = modal==='add'?await supabase.from('users').insert(payload):await supabase.from('users').update(payload).eq('user_id',form.user_id)
    if (error) return showToast(error.message,'error')
    showToast(modal==='add'?'User added!':'User updated!'); setModal(null); load()
  }
  const remove = async (id) => {
    if (!confirm(`Delete user #${id}?`)) return
    const { error } = await supabase.from('users').delete().eq('user_id',id)
    if (error) return showToast(error.message,'error')
    showToast('User deleted!'); load()
  }
  const getRole = u => {
    if (u.is_admin) return <span className="badge badge-yellow">👑 Admin</span>
    if (u.is_doctor) return <span className="badge badge-blue">🩺 Doctor</span>
    return <span className="badge badge-teal">👤 Patient</span>
  }
  return (
    <div>
      <div className="section-card">
        <div className="section-header"><div><div className="section-title">👥 All Users</div><div className="section-subtitle">Manage all registered users</div></div><button className="btn btn-primary btn-sm" onClick={() => { setForm({ name:'',phone:'',age:'',gender:'Male',email:'' }); setModal('add') }}>+ Add User</button></div>
        {loading?<Loader/>:data.length===0?<Empty icon="👥" text="No users found"/>:(
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Age</th><th>Gender</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
            <tbody>{data.map(u => (
              <tr key={u.user_id}><td>#{u.user_id}</td><td><strong>{u.name}</strong></td><td>{u.phone||'—'}</td><td>{u.age||'—'}</td>
                <td><span className={`badge ${u.gender==='Male'?'badge-blue':'badge-purple'}`}>{u.gender}</span></td>
                <td>{u.email}</td><td>{getRole(u)}</td>
                <td style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setForm(u); setModal('edit') }}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(u.user_id)}>🗑️</button>
                </td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {modal && (
        <Modal title={modal==='add'?'➕ Add User':'✏️ Edit User'} onClose={() => setModal(null)}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Age</label><input className="form-input" type="number" value={form.age} onChange={e => setForm({...form,age:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">Gender</label><select className="form-input" value={form.gender} onChange={e => setForm({...form,gender:e.target.value})}><option>Male</option><option>Female</option><option>Other</option></select></div>
          </div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={e => setForm({...form,email:e.target.value})}/></div>
          <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>{modal==='add'?'Add User':'Save Changes'}</button></div>
        </Modal>
      )}
    </div>
  )
}

function AdminDoctors({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name:'', specialization:'', email:'', phone:'' })
  const load = useCallback(async () => {
    setLoading(true)
    const { data:d, error } = await supabase.from('doctor').select('*').order('doctor_id')
    if (error) showToast(error.message,'error'); else setData(d)
    setLoading(false)
  }, [showToast])
  useEffect(() => { load() }, [load])
  const save = async () => {
    const { error } = await supabase.from('doctor').insert(form)
    if (error) return showToast(error.message,'error')
    showToast('Doctor added!'); setModal(false); load()
  }
  const remove = async (id) => {
    if (!confirm(`Delete doctor #${id}?`)) return
    const { error } = await supabase.from('doctor').delete().eq('doctor_id',id)
    if (error) return showToast(error.message,'error')
    showToast('Deleted!'); load()
  }
  return (
    <div>
      <div className="section-card">
        <div className="section-header"><div><div className="section-title">🩺 All Doctors</div><div className="section-subtitle">Manage all doctors</div></div><button className="btn btn-primary btn-sm" onClick={() => { setForm({ name:'',specialization:'',email:'',phone:'' }); setModal(true) }}>+ Add Doctor</button></div>
        {loading?<Loader/>:data.length===0?<Empty icon="🩺" text="No doctors found"/>:(
          <div className="doctor-grid">
            {data.map((d,i) => (
              <div key={d.doctor_id} className="doctor-card">
                <div className="doctor-card-accent" style={{ background:getDoctorAccent(i) }}></div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginTop:8 }}>
                  <div className="doctor-avatar" style={{ background:`linear-gradient(135deg, ${getDoctorAccent(i)}33, ${getDoctorAccent(i)}55)`, color:getDoctorAccent(i) }}>{getInitials(d.name)}</div>
                  <div style={{ display:'flex', gap:6 }}><button className="btn btn-ghost btn-sm">View</button><button className="btn btn-danger btn-sm" onClick={() => remove(d.doctor_id)}>🗑️</button></div>
                </div>
                <div className="doctor-name">{d.name}</div>
                <div className="doctor-spec">{d.specialization}</div>
                <div className="doctor-info-row"><span>📧</span><span>{d.email}</span></div>
                <div className="doctor-info-row"><span>📱</span><span>{d.phone}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
      {modal && (
        <Modal title="➕ Add Doctor" onClose={() => setModal(false)}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Dr. Anil Kumar"/></div>
            <div className="form-group"><label className="form-label">Specialization</label><input className="form-input" value={form.specialization} onChange={e => setForm({...form,specialization:e.target.value})} placeholder="Cardiology"/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={e => setForm({...form,email:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})}/></div>
          </div>
          <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Add Doctor</button></div>
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
  const [form, setForm] = useState({ user_id:'', doctor_id:'', date_issued:today, notes:'' })
  const load = useCallback(async () => {
    setLoading(true)
    const { data:d, error } = await supabase.from('prescription').select('prescription_id,user_id,doctor_id,date_issued,notes,users(name),doctor(name)').order('prescription_id')
    if (error) showToast(error.message,'error'); else setData(d)
    setLoading(false)
  }, [showToast])
  useEffect(() => { load() }, [load])
  const save = async () => {
    const { error } = await supabase.from('prescription').insert({ ...form, user_id:parseInt(form.user_id), doctor_id:parseInt(form.doctor_id) })
    if (error) return showToast(error.message,'error')
    showToast('Prescription added!'); setModal(false); load()
  }
  const remove = async (id) => {
    if (!confirm(`Delete prescription #${id}?`)) return
    const { error } = await supabase.from('prescription').delete().eq('prescription_id',id)
    if (error) return showToast(error.message,'error')
    showToast('Deleted!'); load()
  }
  return (
    <div>
      <div className="section-card">
        <div className="section-header"><div><div className="section-title">📋 All Prescriptions</div><div className="section-subtitle">Manage all prescriptions</div></div><button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Add</button></div>
        {loading?<Loader/>:data.length===0?<Empty icon="📋" text="No prescriptions"/>:(
          <table>
            <thead><tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Notes</th><th>Actions</th></tr></thead>
            <tbody>{data.map(p => (
              <tr key={p.prescription_id}>
                <td><strong>#RX-{String(p.prescription_id).padStart(4,'0')}</strong></td>
                <td><strong>{p.users?.name||'—'}</strong></td><td>{p.doctor?.name||'—'}</td><td>{p.date_issued}</td>
                <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.notes||'—'}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => remove(p.prescription_id)}>🗑️</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {modal && (
        <Modal title="➕ Add Prescription" onClose={() => setModal(false)}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">User ID</label><input className="form-input" type="number" value={form.user_id} onChange={e => setForm({...form,user_id:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">Doctor ID</label><input className="form-input" type="number" value={form.doctor_id} onChange={e => setForm({...form,doctor_id:e.target.value})}/></div>
          </div>
          <div className="form-group"><label className="form-label">Date Issued</label><input className="form-input" type="date" value={form.date_issued} onChange={e => setForm({...form,date_issued:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Notes</label><input className="form-input" value={form.notes} onChange={e => setForm({...form,notes:e.target.value})}/></div>
          <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Add</button></div>
        </Modal>
      )}
    </div>
  )
}

function AdminMedicines({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name:'', brand:'', type:'Tablet', description:'', prescription_id:'' })
  const load = useCallback(async () => {
    setLoading(true)
    const { data:d, error } = await supabase.from('medicine').select('medicine_id,name,brand,type,description,prescription_id').order('medicine_id')
    if (error) showToast(error.message,'error'); else setData(d)
    setLoading(false)
  }, [showToast])
  useEffect(() => { load() }, [load])
  const save = async () => {
    const { error } = await supabase.from('medicine').insert({ ...form, prescription_id:parseInt(form.prescription_id) })
    if (error) return showToast(error.message,'error')
    showToast('Medicine added!'); setModal(false); load()
  }
  const remove = async (id) => {
    if (!confirm(`Delete medicine #${id}?`)) return
    const { error } = await supabase.from('medicine').delete().eq('medicine_id',id)
    if (error) return showToast(error.message,'error')
    showToast('Deleted!'); load()
  }
  return (
    <div>
      <div className="section-card">
        <div className="section-header"><div><div className="section-title">💊 All Medicines</div><div className="section-subtitle">Manage all medicines</div></div><button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Add</button></div>
        {loading?<Loader/>:data.length===0?<Empty icon="💊" text="No medicines"/>:(
          <div className="medicine-grid">
            {data.map((m,i) => (
              <div key={m.medicine_id} className="medicine-card">
                <div className={`medicine-card-top ${getMedCardColor(i)}`}></div>
                <div className="medicine-card-body">
                  <div className="medicine-card-header">
                    <div><div className="medicine-card-name">{m.name}</div><div className="medicine-card-brand">{m.brand}</div></div>
                    <div className="medicine-card-actions"><button className="btn btn-ghost btn-sm">Edit</button><button className="btn btn-danger btn-sm" onClick={() => remove(m.medicine_id)}>Delete</button></div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}><span className="badge badge-blue">{m.type}</span><span className="badge badge-green">Active</span></div>
                  <div className="medicine-card-desc">{m.description||'—'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {modal && (
        <Modal title="➕ Add Medicine" onClose={() => setModal(false)}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Metformin"/></div>
            <div className="form-group"><label className="form-label">Brand</label><input className="form-input" value={form.brand} onChange={e => setForm({...form,brand:e.target.value})} placeholder="Glucophage"/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Type</label><select className="form-input" value={form.type} onChange={e => setForm({...form,type:e.target.value})}>{['Tablet','Capsule','Inhaler','Syrup','Injection','Cream','Eye Drop'].map(t=><option key={t}>{t}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Prescription ID</label><input className="form-input" type="number" value={form.prescription_id} onChange={e => setForm({...form,prescription_id:e.target.value})}/></div>
          </div>
          <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={e => setForm({...form,description:e.target.value})}/></div>
          <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Add</button></div>
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
    const { data:d, error } = await supabase.from('schedule').select('schedule_id,start_date,end_date,time,dosage(amount,unit,frequency,medicine(name))').order('schedule_id')
    if (error) showToast(error.message,'error'); else setData(d)
    setLoading(false)
  }, [showToast])
  useEffect(() => { load() }, [load])
  return (
    <div className="section-card">
      <div className="section-header"><div><div className="section-title">📅 All Schedules</div><div className="section-subtitle">All medicine schedules in the system</div></div><button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button></div>
      {loading?<Loader/>:data.length===0?<Empty icon="📅" text="No schedules"/>:(
        <table>
          <thead><tr><th>ID</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Start</th><th>End</th><th>Time</th><th>Status</th></tr></thead>
          <tbody>{data.map(s => {
            const active = s.start_date<=today && s.end_date>=today
            return (
              <tr key={s.schedule_id}><td>#{s.schedule_id}</td><td><strong>{s.dosage?.medicine?.name||'—'}</strong></td>
                <td>{s.dosage?.amount} {s.dosage?.unit}</td><td>{s.dosage?.frequency}</td>
                <td>{s.start_date}</td><td>{s.end_date}</td>
                <td><span className="badge badge-blue">{s.time?.slice(0,5)}</span></td>
                <td><span className={`badge ${active?'badge-green':'badge-red'}`}>{active?'Active':'Ended'}</span></td></tr>
            )
          })}</tbody>
        </table>
      )}
    </div>
  )
}

function AdminReminders({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true)
    const { data:d, error } = await supabase.from('reminder').select('reminder_id,schedule_id,mode,reminder_time,status').order('reminder_id')
    if (error) showToast(error.message,'error'); else setData(d)
    setLoading(false)
  }, [showToast])
  useEffect(() => { load() }, [load])
  const toggle = async (id, status) => {
    const newStatus = status==='Active'?'Inactive':'Active'
    const { error } = await supabase.from('reminder').update({ status:newStatus }).eq('reminder_id',id)
    if (error) return showToast(error.message,'error')
    showToast(`Reminder ${newStatus}!`); load()
  }
  const icons = { Daily:'⏰', Weekly:'💊', 'One-time':'🔔', Refill:'🛒' }
  return (
    <div className="section-card">
      <div className="section-header"><div><div className="section-title">🔔 All Reminders</div><div className="section-subtitle">Manage all reminders</div></div></div>
      {loading?<Loader/>:data.length===0?<Empty icon="🔔" text="No reminders"/>:(
        data.map(r => (
          <div key={r.reminder_id} className="reminder-card">
            <div className="reminder-icon-wrap">{icons[r.mode]||'🔔'}</div>
            <div className="reminder-info"><div className="reminder-name">Schedule #{r.schedule_id} — {r.mode}</div><div className="reminder-sub">{r.mode} · {r.reminder_time}</div></div>
            <span className={`badge ${r.status==='Active'?'badge-green':'badge-red'}`}>{r.status}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => toggle(r.reminder_id,r.status)}>{r.status==='Active'?'🔕':'🔔'}</button>
          </div>
        ))
      )}
    </div>
  )
}

function AdminIntakeLogs({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ schedule_id:'', date:today, time_taken:'', status:'Taken' })
  const load = useCallback(async () => {
    setLoading(true)
    const { data:d, error } = await supabase.from('intake_log').select('log_id,schedule_id,date,time_taken,status').order('log_id',{ ascending:false }).limit(50)
    if (error) showToast(error.message,'error'); else setData(d)
    setLoading(false)
  }, [showToast])
  useEffect(() => { load() }, [load])
  const save = async () => {
    const { error } = await supabase.from('intake_log').insert({ schedule_id:parseInt(form.schedule_id), date:form.date, time_taken:form.status==='Taken'?(form.time_taken||null):null, status:form.status })
    if (error) return showToast(error.message,'error')
    showToast('Dose logged!'); setModal(false); load()
  }
  const remove = async (id) => {
    if (!confirm(`Delete log #${id}?`)) return
    const { error } = await supabase.from('intake_log').delete().eq('log_id',id)
    if (error) return showToast(error.message,'error')
    showToast('Deleted!'); load()
  }
  return (
    <div>
      <div className="section-card">
        <div className="section-header"><div><div className="section-title">📝 All Intake Logs</div><div className="section-subtitle">All dose records in the system</div></div><button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Log Dose</button></div>
        {loading?<Loader/>:data.length===0?<Empty icon="📝" text="No logs"/>:(
          <table>
            <thead><tr><th>Log ID</th><th>Schedule</th><th>Date</th><th>Time Taken</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{data.map(l => (
              <tr key={l.log_id}><td><strong>#LOG-{String(l.log_id).padStart(3,'0')}</strong></td><td>SCH-{l.schedule_id}</td><td>{l.date}</td><td>{l.time_taken||'—'}</td>
                <td><span className={`badge ${l.status==='Taken'?'badge-green':'badge-red'}`}>{l.status}</span></td>
                <td><button className="btn btn-danger btn-sm" onClick={() => remove(l.log_id)}>🗑️</button></td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {modal && (
        <Modal title="📝 Log Dose" onClose={() => setModal(false)}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Schedule ID</label><input className="form-input" type="number" value={form.schedule_id} onChange={e => setForm({...form,schedule_id:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={form.date} onChange={e => setForm({...form,date:e.target.value})}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Time Taken</label><input className="form-input" type="time" value={form.time_taken} onChange={e => setForm({...form,time_taken:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">Status</label><select className="form-input" value={form.status} onChange={e => setForm({...form,status:e.target.value})}><option>Taken</option><option>Missed</option></select></div>
          </div>
          <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Log Dose</button></div>
        </Modal>
      )}
    </div>
  )
}

const ADMIN_PAGES = [
  { id:'dashboard',     label:'Dashboard',     icon:'🏠', section:'Main'     },
  { id:'users',         label:'Users',         icon:'👥', section:'Main'     },
  { id:'doctors',       label:'Doctors',       icon:'🩺', section:'Main'     },
  { id:'prescriptions', label:'Prescriptions', icon:'📋', section:'Medical'  },
  { id:'medicines',     label:'Medicines',     icon:'💊', section:'Medical'  },
  { id:'schedules',     label:'Schedules',     icon:'📅', section:'Medical'  },
  { id:'reminders',     label:'Reminders',     icon:'🔔', section:'Tracking' },
  { id:'intakelogs',    label:'Intake Log',    icon:'📝', section:'Tracking' },
]
const DOCTOR_PAGES = [
  { id:'dashboard',     label:'Dashboard',           icon:'🏠', section:'Main'    },
  { id:'patients',      label:'My Patients',          icon:'👥', section:'Main'    },
  { id:'prescriptions', label:'My Prescriptions',     icon:'📋', section:'Medical' },
  { id:'medicines',     label:'Medicines Prescribed', icon:'💊', section:'Medical' },
  { id:'schedules',     label:'Patient Schedules',    icon:'📅', section:'Medical' },
]
const USER_PAGES = [
  { id:'dashboard',     label:'Dashboard',     icon:'🏠', section:'Main'      },
  { id:'medicines',     label:'Medicines',     icon:'💊', section:'Medical'   },
  { id:'schedule',      label:'Schedule',      icon:'📅', section:'Medical'   },
  { id:'prescriptions', label:'Prescriptions', icon:'📋', section:'Medical'   },
  { id:'intakelogs',    label:'Intake Log',    icon:'📝', section:'Tracking'  },
  { id:'reminders',     label:'Reminders',     icon:'🔔', section:'Tracking'  },
  { id:'doctors',       label:'Doctors',       icon:'🩺', section:'Personal'  },
  { id:'profile',       label:'My Profile',    icon:'👤', section:'Personal'  },
]

export default function App() {
  const [user, setUser]               = useState(null)
  const [profile, setProfile]         = useState(null)
  const [page, setPage]               = useState('dashboard')
  const [toast, setToast]             = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data:{ session } }) => {
      if (session?.user) {
        setUser(session.user)
        const { data:p } = await supabase.from('users').select('*').eq('auth_id',session.user.id).single()
        setProfile(p)
        setPage('dashboard')
      }
      setAuthLoading(false)
    })
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setUser(null); setProfile(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogin  = (u, p) => { setUser(u); setProfile(p); setPage('dashboard') }
  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); setProfile(null); setPage('dashboard') }
  const showToast    = useCallback((message, type='success') => setToast({ message, type }), [])

  if (authLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f1c2e', flexDirection:'column', gap:16 }}>
      <div style={{ fontFamily:'Fraunces, serif', fontSize:32, fontWeight:700, color:'#fff' }}>Medi<span style={{ color:'#f59e0b' }}>Track</span></div>
      <div className="spinner" style={{ width:28, height:28, borderWidth:3, borderTopColor:'#f59e0b', borderColor:'rgba(255,255,255,0.15)' }}></div>
    </div>
  )

  if (!user) return <AuthPage onLogin={handleLogin} />

  const isAdmin  = profile?.is_admin
  const isDoctor = profile?.is_doctor
  const pages    = isAdmin?ADMIN_PAGES:isDoctor?DOCTOR_PAGES:USER_PAGES
  const props    = { showToast, user, profile }

  const renderPage = () => {
    if (isAdmin) {
      switch (page) {
        case 'dashboard':     return <AdminDashboard     {...props} />
        case 'users':         return <AdminUsers         {...props} />
        case 'doctors':       return <AdminDoctors       {...props} />
        case 'prescriptions': return <AdminPrescriptions {...props} />
        case 'medicines':     return <AdminMedicines     {...props} />
        case 'schedules':     return <AdminSchedules     {...props} />
        case 'reminders':     return <AdminReminders     {...props} />
        case 'intakelogs':    return <AdminIntakeLogs    {...props} />
        default:              return <AdminDashboard     {...props} />
      }
    } else if (isDoctor) {
      switch (page) {
        case 'dashboard':     return <DoctorDashboard     {...props} />
        case 'patients':      return <DoctorPatients      {...props} />
        case 'prescriptions': return <DoctorPrescriptions {...props} />
        case 'medicines':     return <DoctorMedicines     {...props} />
        case 'schedules':     return <DoctorSchedules     {...props} />
        default:              return <DoctorDashboard     {...props} />
      }
    } else {
      switch (page) {
        case 'dashboard':     return <UserDashboard     {...props} />
        case 'medicines':     return <UserMedicines     {...props} />
        case 'schedule':      return <UserSchedule      {...props} />
        case 'prescriptions': return <UserPrescriptions {...props} />
        case 'intakelogs':    return <UserIntakeLogs    {...props} />
        case 'reminders':     return <UserReminders     {...props} />
        case 'doctors':       return <UserDoctors       {...props} />
        case 'profile':       return <UserProfile       {...props} />
        default:              return <UserDashboard     {...props} />
      }
    }
  }

  return (
    <div style={{ display:'flex' }}>
      <Sidebar pages={pages} page={page} setPage={setPage} user={user} profile={profile} />
      <div className="main">
        <Topbar title={pages.find(p=>p.id===page)?.label||'Dashboard'} onLogout={handleLogout} />
        <div className="content">{renderPage()}</div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}