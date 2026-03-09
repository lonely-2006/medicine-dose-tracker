'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function getMedCardColor(i) {
  return ['', 'green', 'orange', 'yellow'][i % 4]
}

function getDoctorAccent(i) {
  return ['#2563eb','#16a34a','#d97706','#7c3aed','#0891b2','#dc2626'][i % 6]
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:300, background:type==='success'?'#ecfdf5':'#fef2f2', border:`1px solid ${type==='success'?'#a7f3d0':'#fecaca'}`, borderRadius:12, padding:'14px 18px', fontSize:13, minWidth:280, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', display:'flex', alignItems:'center', gap:10, color:type==='success'?'#059669':'#dc2626', fontWeight:600 }}>
      {type==='success'?'✅':'❌'} {message}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  )
}

function Loader() {
  return <div className="loader"><div className="spinner"></div> Loading...</div>
}

function Empty({ icon, text }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div>{text}</div>
}

// ── AUTH PAGE ────────────────────────────────────
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

  const activeRole = roles.find(r => r.id === role) || roles[0]

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email:form.email, password:form.password })
    if (error) { setError(error.message); setLoading(false); return }
    
    if (role === 'doctor') {
      const { data:doctorData } = await supabase.from('doctor').select('*').eq('email', form.email).single()
      if (!doctorData) { await supabase.auth.signOut(); setError('This account is not a Doctor account.'); setLoading(false); return }
      onLogin(data.user, { ...doctorData, is_doctor: true, is_admin: false })
      setLoading(false)
      return
    }
    
    const { data:profile } = await supabase.from('users').select('*').eq('auth_id', data.user.id).single()
    if (role==='admin' && !profile?.is_admin) { await supabase.auth.signOut(); setError('This account is not an Admin account.'); setLoading(false); return }
    if (role==='patient' && (profile?.is_admin || profile?.is_doctor)) { await supabase.auth.signOut(); setError('Please select the correct role for this account.'); setLoading(false); return }
    onLogin(data.user, profile)
    setLoading(false)
  }

  const handleRegister = async () => {
    if (role === 'admin') { setError('Admin accounts cannot self-register.'); return }
    if (!form.name) return setError('Please enter your name')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    setError('')
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email:form.email, 
      password:form.password, 
      options:{ data:{ name:form.name } } 
    })
    if (authError) { setError(authError.message); setLoading(false); return }
    
    if (role === 'doctor') {
      const { error: doctorError } = await supabase.from('doctor').insert({ 
        name: form.name, 
        email: form.email, 
        specialization: 'General Practitioner',
        phone: ''
      })
      if (doctorError) { setError(doctorError.message); setLoading(false); return }
    } else {
      const { error: userError } = await supabase.from('users').insert({ 
        auth_id: authData.user.id, 
        name: form.name, 
        email: form.email, 
        is_admin: false, 
        is_doctor: false 
      })
      if (userError) { setError(userError.message); setLoading(false); return }
    }
    
    setSuccess('Account created! Please login now.')
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #0f1c2e 0%, #1a3a52 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:40, width:'100%', maxWidth:500, boxShadow:'0 24px 80px rgba(0,0,0,0.35)' }}>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontFamily:'Fraunces, serif', fontSize:36, fontWeight:700, marginBottom:8, color:'#0f172a' }}>Medi<span style={{ color:'#f59e0b' }}>Track</span></div>
          <div style={{ fontSize:13, color:'#94a3b8' }}>Healthcare Management System</div>
        </div>
        
        {/* Role Tabs */}
        <div className="login-tabs">
          {roles.map(r => (
            <button 
              key={r.id} 
              className={`login-tab ${role===r.id?'active':''} ${role===r.id?r.id:''}`}
              onClick={() => { setRole(r.id); setError(''); setSuccess('') }}
              style={role===r.id ? { background: r.color } : {}}
            >
              <span className="login-tab-icon">{r.icon}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>
        
        {/* Mode Tabs */}
        <div style={{ display:'flex', background:'#f1f5f9', borderRadius:10, padding:4, marginBottom:20 }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
              style={{ flex:1, padding:'9px 0', borderRadius:8, border:'none', background:mode===m?'#fff':'transparent', color:mode===m?'#0f172a':'#94a3b8', fontWeight:mode===m?700:500, fontSize:13, cursor:'pointer', fontFamily:'Plus Jakarta Sans, sans-serif', transition:'all 0.2s', boxShadow:mode===m?'0 1px 4px rgba(0,0,0,0.1)':'none' }}>
              {m==='login'?'🔑 Login':'📝 Register'}
            </button>
          ))}
        </div>
        
        {/* Form Title */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>{mode==='login'?`${activeRole.icon} ${activeRole.label} Login`:'Create Account'}</div>
          <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>{mode==='login'?`Enter your ${activeRole.label.toLowerCase()} credentials`:`Register as a ${activeRole.label.toLowerCase()}`}</div>
        </div>
        
        {/* Messages */}
        {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#dc2626', marginBottom:16 }}>❌ {error}</div>}
        {success && <div style={{ background:'#ecfdf5', border:'1px solid #a7f3d0', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#059669', marginBottom:16 }}>✅ {success}</div>}
        {mode==='register' && role==='admin' && <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#d97706', marginBottom:16 }}>⚠️ Admin accounts cannot self-register.</div>}
        
        {/* Form Fields */}
        {mode==='register' && <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" placeholder="John Doe" value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></div>}
        <div className="form-group"><label className="form-label">Email Address</label><input className="form-input" type="email" placeholder={activeRole.id==='doctor'?'doctor@hospital.com':'you@example.com'} value={form.email} onChange={e => setForm({...form,email:e.target.value})} onKeyDown={e => e.key==='Enter' && (mode==='login'?handleLogin():handleRegister())}/></div>
        <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form,password:e.target.value})} onKeyDown={e => e.key==='Enter' && (mode==='login'?handleLogin():handleRegister())}/></div>
        
        {/* Submit Button */}
        <button className="btn btn-primary" style={{ width:'100%', padding:'12px', marginTop:6, fontSize:14, justifyContent:'center', background:activeRole.color, borderColor:activeRole.color, transition:'all 0.3s ease' }} onClick={mode==='login'?handleLogin:handleRegister} disabled={loading}>
          <span style={{ marginRight:4 }}>{activeRole.icon}</span>
          {loading?'⏳ Please wait...':mode==='login'?`Sign in as ${activeRole.label}`:'Create Account'}
        </button>
        
        {/* Toggle */}
        <div style={{ textAlign:'center', marginTop:16, fontSize:12.5, color:'#94a3b8' }}>
          {mode==='login'?"Don't have an account? ":'Already have an account? '}
          <span style={{ color:'#1a3c5e', cursor:'pointer', fontWeight:700 }} onClick={() => { setMode(mode==='login'?'register':'login'); setError(''); setSuccess('') }}>{mode==='login'?'Register':'Login'}</span>
        </div>
      </div>
      <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', position:'fixed', bottom:20, right:20, zIndex:1 }}>Secured by Supabase Authentication</div>
    </div>
  )
}

// ── SIDEBAR ──────────────────────────────────────
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
              <button 
                key={p.id} 
                className={`nav-item ${page===p.id?'active':''}`} 
                onClick={() => setPage(p.id)}
              >
                <span className="nav-icon">{p.icon}</span>
                <span>{p.label}</span>
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

// ── TOPBAR ───────────────────────────────────────
function Topbar({ title, onLogout, actionLabel, onAction }) {
  return (
    <div className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">
        {actionLabel && onAction && (
          <button className="btn btn-primary btn-sm" style={{ marginRight:12 }} onClick={onAction}>{actionLabel}</button>
        )}
        <div className="topbar-search">
          <span style={{ color:'#94a3b8', fontSize:14 }}>🔍</span>
          <input placeholder="Search..."/>
        </div>
        <div className="status-dot"></div>
        <div className="status-text">Connected</div>
        <button className="btn btn-primary btn-sm" onClick={onLogout}>Logout</button>
      </div>
    </div>
  )
}

// ── USER DASHBOARD ───────────────────────────────
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
    const { data:logs } = await supabase.from('intake_log').select('status,schedule_id').gte('date',today)
    const myLogs = (logs||[]).filter(l => todayScheds.some(s => s.schedule_id===l.schedule_id))
    const taken = myLogs.filter(l=>l.status==='Taken').length
    const missed = myLogs.filter(l=>l.status==='Missed').length
    const adherence = (taken+missed)>0?Math.round((taken/(taken+missed))*100):89
    setStats({ todayDoses:todayScheds.length, taken, missed, active:myScheds.length, adherence })
    setLoading(false)
  }, [profile, today])

  useEffect(() => { load() }, [load])

  const logDose = async (scheduleId, status) => {
    const now = new Date()
    const timeTaken = status==='Taken'?`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`:null
    const { error } = await supabase.from('intake_log').insert({ schedule_id:scheduleId, date:today, time_taken:timeTaken, status })
    if (error) return showToast(error.message,'error')
    showToast(`Marked as ${status}!`)
    load()
  }

  const statsConfig = [
    { label:"Today's Doses", value:stats.todayDoses??0, sub:`${stats.taken??0} taken · ${(stats.todayDoses??0)-(stats.taken??0)} remaining`, bar:(stats.taken/(stats.todayDoses||1))*100, accent:'#2563eb', accentLight:'#eff6ff' },
    { label:'Adherence Rate', value:`${stats.adherence??89}%`, sub:'Based on your logs', bar:stats.adherence??89, accent:'#16a34a', accentLight:'#dcfce7' },
    { label:'Active Medicines', value:stats.active??0, sub:'Your prescriptions', bar:70, accent:'#d97706', accentLight:'#fffbeb' },
    { label:'Missed Today', value:stats.missed??0, sub:'Check schedule', bar:Math.min((stats.missed??0)*25,100), accent:'#dc2626', accentLight:'#fef2f2' },
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
            <div>
              <div className="section-title">📅 Today's Schedule</div>
              <div className="section-subtitle">{new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>
            </div>
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
                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-sm" style={{ background:'#dcfce7', color:'#16a34a', border:'none', borderRadius:8, padding:'4px 10px', cursor:'pointer', fontSize:12, fontWeight:600 }} onClick={() => logDose(s.schedule_id,'Taken')}>✓ Taken</button>
                  <button className="btn btn-sm" style={{ background:'#fef2f2', color:'#dc2626', border:'none', borderRadius:8, padding:'4px 10px', cursor:'pointer', fontSize:12, fontWeight:600 }} onClick={() => logDose(s.schedule_id,'Missed')}>✗ Missed</button>
                </div>
              </div>
            ))}
        </div>
        <div className="section-card">
          <div className="section-header">
            <div>
              <div className="section-title">🔔 Active Reminders</div>
              <div className="section-subtitle">Your upcoming reminders</div>
            </div>
          </div>
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

// ── USER MEDICINES ───────────────────────────────
function UserMedicines({ showToast, profile }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name:'', brand:'', type:'Tablet', description:'' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data:prescribed } = await supabase.from('medicine')
      .select('medicine_id,name,brand,type,description,status,added_by_user,prescription_id,prescription!inner(user_id)')
      .eq('prescription.user_id', profile.user_id)
    const { data:selfAdded } = await supabase.from('medicine')
      .select('medicine_id,name,brand,type,description,status,added_by_user,prescription_id')
      .eq('added_by_user', true)
      .is('prescription_id', null)
    const all = [...(prescribed||[]), ...(selfAdded||[])]
    const unique = [...new Map(all.map(m => [m.medicine_id, m])).values()]
    setData(unique)
    setLoading(false)
  }, [profile])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.name) return showToast('Enter medicine name', 'error')
    setSaving(true)
    const { error } = await supabase.from('medicine').insert({
      name: form.name,
      brand: form.brand,
      type: form.type,
      description: form.description,
      status: 'Pending',
      added_by_user: true,
      prescription_id: null
    })
    if (error) { showToast(error.message, 'error'); setSaving(false); return }
    showToast('Medicine submitted for approval! 🕐')
    setModal(false)
    setForm({ name:'', brand:'', type:'Tablet', description:'' })
    setSaving(false)
    load()
  }

  const remove = async (id) => {
    if (!confirm('Remove this medicine?')) return
    await supabase.from('medicine').delete().eq('medicine_id', id)
    showToast('Removed!')
    load()
  }

  const statusBadge = (s) => {
    if (s === 'Active' || !s) return { cls:'badge-green', label:'Active' }
    if (s === 'Pending') return { cls:'badge-yellow', label:'⏳ Pending Approval' }
    if (s === 'Rejected') return { cls:'badge-red', label:'❌ Rejected' }
    return { cls:'badge-blue', label: s }
  }

  return (
    <div className="section-card">
      <div className="section-header">
        <div>
          <div className="section-title">💊 My Medicines</div>
          <div className="section-subtitle">Your prescribed & self-added medicines</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Add Medicine</button>
      </div>
      <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'10px 16px', margin:'0 0 16px 0', fontSize:13, color:'#1d4ed8' }}>
        💡 Medicines you add yourself need <strong>admin/doctor approval</strong> before you can schedule them.
      </div>
      {loading ? <Loader/> : data.length===0 ? <Empty icon="💊" text="No medicines yet — add one!"/> : (
        <div className="medicine-grid">
          {data.map((m,i) => {
            const st = statusBadge(m.status)
            const canSchedule = !m.status || m.status === 'Active'
            return (
              <div key={m.medicine_id} className="medicine-card" style={{ opacity: m.status==='Rejected'?0.6:1 }}>
                <div className={`medicine-card-top ${getMedCardColor(i)}`}></div>
                <div className="medicine-card-body">
                  <div className="medicine-card-header">
                    <div>
                      <div className="medicine-card-name">{m.name}</div>
                      <div className="medicine-card-brand">{m.brand||'—'}</div>
                    </div>
                    {m.added_by_user && (<button className="btn btn-danger btn-sm" onClick={() => remove(m.medicine_id)}>🗑️</button>)}
                  </div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                    <span className="badge badge-blue">{m.type}</span>
                    <span className={`badge ${st.cls}`}>{st.label}</span>
                    {m.added_by_user && <span className="badge badge-purple">Self-added</span>}
                  </div>
                  <div className="medicine-card-desc">{m.description||'—'}</div>
                  {!canSchedule && m.status==='Pending' && (
                    <div style={{ marginTop:10, fontSize:12, color:'#d97706', background:'#fffbeb', borderRadius:8, padding:'6px 10px' }}>⏳ Waiting for approval to add schedule</div>
                  )}
                  {m.status==='Rejected' && (
                    <div style={{ marginTop:10, fontSize:12, color:'#dc2626', background:'#fef2f2', borderRadius:8, padding:'6px 10px' }}>❌ Rejected by admin — please contact your doctor</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {modal && (
        <Modal title="💊 Add Medicine" onClose={() => setModal(false)}>
          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#92400e', marginBottom:16 }}>
            ⚠️ Your medicine will be reviewed by a doctor/admin before activation.
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Medicine Name *</label>
              <input className="form-input" placeholder="e.g. Metformin" value={form.name} onChange={e => setForm({...form,name:e.target.value})}/>
            </div>
            <div className="form-group">
              <label className="form-label">Brand</label>
              <input className="form-input" placeholder="e.g. Glucophage" value={form.brand} onChange={e => setForm({...form,brand:e.target.value})}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-input" value={form.type} onChange={e => setForm({...form,type:e.target.value})}>
              {['Tablet','Capsule','Inhaler','Syrup','Injection','Cream','Eye Drop','Other'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description / Notes</label>
            <textarea className="form-input" rows={3} placeholder="e.g. Take after food..." value={form.description} onChange={e => setForm({...form,description:e.target.value})} style={{ resize:'vertical' }}/>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'⏳ Submitting...':'📨 Submit for Approval'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function UserSchedule({ showToast, profile }) {
  const [schedules, setSchedules] = useState([])
  const [medicines, setMedicines] = useState([])
  const [dosages, setDosages] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalDosage, setModalDosage] = useState(false)
  const [modalSchedule, setModalSchedule] = useState(false)
  const [modalReminder, setModalReminder] = useState(null)
  const today = new Date().toISOString().split('T')[0]
  const [dosageForm, setDosageForm] = useState({ medicine_id:'', amount:'', unit:'tablet', frequency:'Once daily' })
  const [schedForm, setSchedForm] = useState({ dosage_id:'', start_date:today, end_date:'', time:'08:00' })
  const [reminderForm, setReminderForm] = useState({ reminder_time:'08:00', mode:'Daily' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data:prescribed } = await supabase.from('medicine')
      .select('medicine_id,name,prescription!inner(user_id)')
      .eq('prescription.user_id', profile.user_id)
      .or('status.eq.Active,status.is.null')
    const { data:selfAdded } = await supabase.from('medicine')
      .select('medicine_id,name')
      .eq('added_by_user', true)
      .eq('status', 'Active')
      .is('prescription_id', null)
    const allMeds = [...(prescribed||[]).map(m=>({medicine_id:m.medicine_id,name:m.name})), ...(selfAdded||[])]
    const uniqueMeds = [...new Map(allMeds.map(m=>[m.medicine_id,m])).values()]
    setMedicines(uniqueMeds)
    if (uniqueMeds.length > 0) {
      const medIds = uniqueMeds.map(m => m.medicine_id)
      const { data:dos } = await supabase.from('dosage').select('*').in('medicine_id', medIds)
      setDosages(dos||[])
    }
    const { data:d, error } = await supabase.from('schedule')
      .select('schedule_id,start_date,end_date,time,dosage(dosage_id,amount,unit,frequency,medicine(name,prescription(user_id),added_by_user,status))')
      .order('schedule_id')
    if (error) showToast(error.message,'error')
    else {
      const mine = d.filter(s => {
        const m = s.dosage?.medicine
        if (!m) return false
        if (m.added_by_user) return true
        return m.prescription?.user_id === profile.user_id
      })
      setSchedules(mine)
    }
    setLoading(false)
  }, [showToast, profile])

  useEffect(() => { load() }, [load])

  const saveDosage = async () => {
    if (!dosageForm.medicine_id || !dosageForm.amount) return showToast('Fill all fields','error')
    setSaving(true)
    const { error } = await supabase.from('dosage').insert({ medicine_id:parseInt(dosageForm.medicine_id), amount:parseFloat(dosageForm.amount), unit:dosageForm.unit, frequency:dosageForm.frequency })
    if (error) { showToast(error.message,'error'); setSaving(false); return }
    showToast('Dosage added!')
    setModalDosage(false)
    setSaving(false)
    load()
  }

  const saveSchedule = async () => {
    if (!schedForm.dosage_id || !schedForm.end_date) return showToast('Fill all fields','error')
    setSaving(true)
    const { data:sched, error } = await supabase.from('schedule').insert({ dosage_id:parseInt(schedForm.dosage_id), start_date:schedForm.start_date, end_date:schedForm.end_date, time:schedForm.time+':00' }).select().single()
    if (error) { showToast(error.message,'error'); setSaving(false); return }
    showToast('Schedule added! Want to set a reminder?')
    setModalSchedule(false)
    setModalReminder(sched.schedule_id)
    setSaving(false)
    load()
  }

  const saveReminder = async (scheduleId) => {
    setSaving(true)
    const { error } = await supabase.from('reminder').insert({ schedule_id:scheduleId, reminder_time:reminderForm.reminder_time, mode:reminderForm.mode, status:'Active' })
    if (error) { showToast(error.message,'error'); setSaving(false); return }
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🔔 Reminder Set!', { body:`Reminder at ${reminderForm.reminder_time} · ${reminderForm.mode}`, icon:'/favicon.ico' })
    }
    showToast('Reminder set! 🔔')
    setModalReminder(null)
    setSaving(false)
  }

  const deleteSchedule = async (id) => {
    if (!confirm('Delete this schedule?')) return
    await supabase.from('schedule').delete().eq('schedule_id', id)
    showToast('Deleted!')
    load()
  }

  return (
    <div>
      <div className="section-card">
        <div className="section-header">
          <div>
            <div className="section-title">📅 My Schedule</div>
            <div className="section-subtitle">Manage your medicine schedule</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setModalDosage(true)}>+ Add Dosage</button>
            <button className="btn btn-primary btn-sm" onClick={() => setModalSchedule(true)}>+ Add Schedule</button>
          </div>
        </div>
        {medicines.length === 0 && !loading && (
          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'12px 16px', marginBottom:16, fontSize:13, color:'#92400e' }}>
            ⚠️ You need at least one <strong>approved Active medicine</strong> before adding a schedule.
          </div>
        )}
        {loading?<Loader/>:schedules.length===0?<Empty icon="📅" text="No schedules yet — add one above!"/>:(
          <table>
            <thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Start</th><th>End</th><th>Time</th><th>Status</th><th>Reminder</th><th>Del</th></tr></thead>
            <tbody>{schedules.map(s => {
              const active = s.start_date<=today && s.end_date>=today
              return (
                <tr key={s.schedule_id}>
                  <td><strong>{s.dosage?.medicine?.name||'—'}</strong></td>
                  <td>{s.dosage?.amount} {s.dosage?.unit}</td>
                  <td>{s.dosage?.frequency}</td>
                  <td>{s.start_date}</td>
                  <td>{s.end_date}</td>
                  <td><span className="badge badge-blue">{s.time?.slice(0,5)}</span></td>
                  <td><span className={`badge ${active?'badge-green':'badge-red'}`}>{active?'Active':'Ended'}</span></td>
                  <td><button className="btn btn-ghost btn-sm" style={{ fontSize:11 }} onClick={() => { setReminderForm({ reminder_time:'08:00', mode:'Daily' }); setModalReminder(s.schedule_id) }}>🔔 Set</button></td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => deleteSchedule(s.schedule_id)}>🗑️</button></td>
                </tr>
              )
            })}</tbody>
          </table>
        )}
      </div>
      {modalDosage && (
        <Modal title="💊 Add Dosage" onClose={() => setModalDosage(false)}>
          {medicines.length===0 && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#dc2626', marginBottom:16 }}>❌ No active medicines found.</div>}
          <div className="form-group">
            <label className="form-label">Medicine</label>
            <select className="form-input" value={dosageForm.medicine_id} onChange={e => setDosageForm({...dosageForm,medicine_id:e.target.value})}>
              <option value="">Select medicine...</option>
              {medicines.map(m => <option key={m.medicine_id} value={m.medicine_id}>{m.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input className="form-input" type="number" placeholder="1" value={dosageForm.amount} onChange={e => setDosageForm({...dosageForm,amount:e.target.value})}/>
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-input" value={dosageForm.unit} onChange={e => setDosageForm({...dosageForm,unit:e.target.value})}>
                {['tablet','capsule','ml','mg','drop','puff','unit'].map(u=><option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Frequency</label>
            <select className="form-input" value={dosageForm.frequency} onChange={e => setDosageForm({...dosageForm,frequency:e.target.value})}>
              {['Once daily','Twice daily','Three times daily','Every 8 hours','Every 12 hours','Weekly','As needed'].map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModalDosage(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveDosage} disabled={saving||medicines.length===0}>{saving?'Saving...':'Add Dosage'}</button>
          </div>
        </Modal>
      )}
      {modalSchedule && (
        <Modal title="📅 Add Schedule" onClose={() => setModalSchedule(false)}>
          {dosages.length===0 && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#dc2626', marginBottom:16 }}>❌ No dosages found. Add a dosage first.</div>}
          <div className="form-group">
            <label className="form-label">Dosage</label>
            <select className="form-input" value={schedForm.dosage_id} onChange={e => setSchedForm({...schedForm,dosage_id:e.target.value})}>
              <option value="">Select dosage...</option>
              {dosages.map(d => { const med = medicines.find(m=>m.medicine_id===d.medicine_id); return <option key={d.dosage_id} value={d.dosage_id}>{med?.name} — {d.amount} {d.unit} ({d.frequency})</option> })}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input className="form-input" type="date" value={schedForm.start_date} onChange={e => setSchedForm({...schedForm,start_date:e.target.value})}/>
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input className="form-input" type="date" value={schedForm.end_date} onChange={e => setSchedForm({...schedForm,end_date:e.target.value})}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Time</label>
            <input className="form-input" type="time" value={schedForm.time} onChange={e => setSchedForm({...schedForm,time:e.target.value})}/>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModalSchedule(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveSchedule} disabled={saving||dosages.length===0}>{saving?'Saving...':'Add Schedule'}</button>
          </div>
        </Modal>
      )}
      {modalReminder && (
        <Modal title="🔔 Set Reminder" onClose={() => setModalReminder(null)}>
          <div style={{ background:'#ecfdf5', border:'1px solid #a7f3d0', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#059669', marginBottom:16 }}>✅ Schedule saved! Want to set a reminder?</div>
          <div className="form-group">
            <label className="form-label">Reminder Time</label>
            <input className="form-input" type="time" value={reminderForm.reminder_time} onChange={e => setReminderForm({...reminderForm,reminder_time:e.target.value})}/>
          </div>
          <div className="form-group">
            <label className="form-label">Mode</label>
            <select className="form-input" value={reminderForm.mode} onChange={e => setReminderForm({...reminderForm,mode:e.target.value})}>
              <option>Daily</option>
              <option>Weekly</option>
              <option>One-time</option>
              <option>Refill</option>
            </select>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModalReminder(null)}>Skip</button>
            <button className="btn btn-primary" onClick={() => saveReminder(modalReminder)} disabled={saving}>{saving?'Saving...':'🔔 Set Reminder'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function UserPrescriptions({ showToast, profile }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data:d, error } = await supabase.from('prescription')
      .select('prescription_id,date_issued,notes,doctor(name),medicine(name)')
      .eq('user_id',profile.user_id)
      .order('prescription_id')
    if (error) showToast(error.message,'error')
    else setData(d)
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
      <div className="section-header">
        <div>
          <div className="section-title">📋 My Prescriptions</div>
          <div className="section-subtitle">Prescriptions issued by your doctors</div>
        </div>
      </div>
      {loading?<Loader/>:data.length===0?<Empty icon="📋" text="No prescriptions yet"/>:(
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Medicines</th>
              <th>Notes</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map(p => {
              const s = getStatus(p.date_issued)
              return (
                <tr key={p.prescription_id}>
                  <td><strong>#RX-{String(p.prescription_id).padStart(4,'0')}</strong></td>
                  <td>{p.doctor?.name||'—'}</td>
                  <td>{p.date_issued}</td>
                  <td>{Array.isArray(p.medicine)?p.medicine.map(m=>m.name).join(', '):p.medicine?.name||'—'}</td>
                  <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.notes||'—'}</td>
                  <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

function UserIntakeLogs({ showToast, profile }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ schedule_id:'', date:today, time_taken:'', status:'Taken' })
  const [filter, setFilter] = useState('All')

  const load = useCallback(async () => {
    setLoading(true)
    const { data:scheds } = await supabase.from('schedule')
      .select('schedule_id,dosage(medicine(name,prescription(user_id)))')
      .filter('dosage.medicine.prescription.user_id','eq',profile.user_id)
    const mySchedIds = (scheds||[]).filter(s => s.dosage?.medicine?.prescription?.user_id===profile.user_id).map(s => s.schedule_id)
    if (mySchedIds.length === 0) { setData([]); setLoading(false); return }
    const { data:d, error } = await supabase.from('intake_log')
      .select('log_id,schedule_id,date,time_taken,status')
      .in('schedule_id', mySchedIds)
      .order('log_id',{ ascending:false })
      .limit(50)
    if (error) showToast(error.message,'error')
    else setData(d)
    setLoading(false)
  }, [showToast, profile])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.schedule_id) return showToast('Enter a schedule ID','error')
    const { error } = await supabase.from('intake_log').insert({
      schedule_id:parseInt(form.schedule_id),
      date:form.date,
      time_taken:form.status==='Taken'?(form.time_taken||null):null,
      status:form.status
    })
    if (error) return showToast(error.message,'error')
    showToast('Dose logged!')
    setModal(false)
    load()
  }

  const filtered = filter==='All'?data:data.filter(l=>l.status===filter)
  const statusBadge = s => s==='Taken'?'badge-green':s==='Missed'?'badge-red':'badge-yellow'

  return (
    <div>
      <div className="section-card">
        <div className="section-header">
          <div>
            <div className="section-title">📝 Intake Log</div>
            <div className="section-subtitle">Your dose history</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {['All','Taken','Missed','Skipped'].map(f => (
              <button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-ghost'}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
            <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Log Dose</button>
          </div>
        </div>
        {loading?<Loader/>:filtered.length===0?<Empty icon="📝" text="No logs yet"/>:(
          <table>
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Schedule</th>
                <th>Time Taken</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.log_id}>
                  <td><strong>#LOG-{String(l.log_id).padStart(3,'0')}</strong></td>
                  <td>SCH-{l.schedule_id}</td>
                  <td>{l.time_taken||'—'}</td>
                  <td>{l.date}</td>
                  <td><span className={`badge ${statusBadge(l.status)}`}>{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal && (
        <Modal title="📝 Log Dose" onClose={() => setModal(false)}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Schedule ID</label>
              <input className="form-input" type="number" value={form.schedule_id} onChange={e => setForm({...form,schedule_id:e.target.value})} placeholder="1"/>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={form.date} onChange={e => setForm({...form,date:e.target.value})}/>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Time Taken</label>
              <input className="form-input" type="time" value={form.time_taken} onChange={e => setForm({...form,time_taken:e.target.value})}/>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => setForm({...form,status:e.target.value})}>
                <option>Taken</option>
                <option>Missed</option>
                <option>Skipped</option>
              </select>
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
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notifPermission, setNotifPermission] = useState('default')
  const [form, setForm] = useState({ schedule_id:'', reminder_time:'08:00', mode:'Daily', status:'Active' })

  useEffect(() => {
    if ('Notification' in window) setNotifPermission(Notification.permission)
  }, [])

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) return showToast('Browser does not support notifications', 'error')
    const result = await Notification.requestPermission()
    setNotifPermission(result)
    if (result === 'granted') showToast('Browser notifications enabled! 🔔')
    else showToast('Notification permission denied', 'error')
  }

  const sendBrowserNotification = (medName, time, mode) => {
    if (notifPermission !== 'granted') return
    new Notification('💊 MediTrack Reminder Set!', {
      body:`${medName}\nTime: ${time} · ${mode}`,
      icon:'/favicon.ico',
      badge:'/favicon.ico'
    })
  }

  const load = useCallback(async () => {
    setLoading(true)
    const { data:scheds } = await supabase.from('schedule')
      .select('schedule_id,dosage(amount,unit,frequency,medicine(name,prescription(user_id)))')
      .filter('dosage.medicine.prescription.user_id','eq',profile.user_id)
    const myScheds = (scheds||[]).filter(s => s.dosage?.medicine?.prescription?.user_id===profile.user_id)
    setSchedules(myScheds)
    const myIds = myScheds.map(s => s.schedule_id)
    if (myIds.length > 0) {
      const { data:d, error } = await supabase.from('reminder')
        .select('*')
        .in('schedule_id', myIds)
        .order('reminder_id')
      if (error) showToast(error.message,'error')
      else setData(d)
    } else setData([])
    setLoading(false)
  }, [showToast, profile])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.schedule_id) return showToast('Select a schedule', 'error')
    setSaving(true)
    const { error } = await supabase.from('reminder').insert({
      schedule_id:parseInt(form.schedule_id),
      reminder_time:form.reminder_time,
      mode:form.mode,
      status:form.status
    })
    if (error) { showToast(error.message, 'error'); setSaving(false); return }
    const sched = schedules.find(s => s.schedule_id === parseInt(form.schedule_id))
    const medName = sched?.dosage?.medicine?.name || 'your medicine'
    sendBrowserNotification(medName, form.reminder_time, form.mode)
    showToast('Reminder saved! 🔔')
    if (profile?.phone) {
      try {
        const res = await fetch('/api/send-sms', {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body:JSON.stringify({
            to:profile.phone,
            message:`🔔 MediTrack Reminder!\nMedicine: ${medName}\nTime: ${form.reminder_time}\nMode: ${form.mode}\n\nStay healthy! 💊`
          })
        })
        if (res.ok) showToast('SMS sent to your phone! 📱')
      } catch (e) {
        console.log('SMS skipped (Twilio not configured)')
      }
    }
    load()
    setSaving(false)
  }

  const toggle = async (id, status) => {
    const newStatus = status === 'Active' ? 'Inactive' : 'Active'
    const { error } = await supabase.from('reminder').update({ status: newStatus }).eq('reminder_id', id)
    if (error) return showToast(error.message, 'error')
    showToast(`Reminder ${newStatus}!`)
    load()
  }

  const deleteReminder = async (id) => {
    const { error } = await supabase.from('reminder').delete().eq('reminder_id', id)
    if (error) return showToast(error.message, 'error')
    showToast('Reminder deleted!')
    load()
  }

  const icons = { Daily:'⏰', Weekly:'💊', 'One-time':'🔔', Refill:'🛒' }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:20 }}>
      <div className="section-card">
        <div className="section-header">
          <div>
            <div className="section-title">🔔 My Reminders</div>
            <div className="section-subtitle">Your medicine reminders</div>
          </div>
          {notifPermission !== 'granted' && (<button className="btn btn-ghost btn-sm" onClick={requestNotifPermission} style={{ background:'#fffbeb', color:'#d97706', border:'1px solid #fde68a' }}>🔔 Enable Notifications</button>)}
          {notifPermission === 'granted' && (<span style={{ fontSize:12, color:'#16a34a', fontWeight:600 }}>✅ Notifications On</span>)}
        </div>
        {notifPermission === 'default' && (
          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'12px 16px', margin:'0 0 16px 0', fontSize:13, color:'#92400e', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
            <span>🔔 Enable browser notifications to get reminded!</span>
            <button className="btn btn-sm" style={{ background:'#f59e0b', color:'#fff', border:'none', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontWeight:600, whiteSpace:'nowrap' }} onClick={requestNotifPermission}>Enable Now</button>
          </div>
        )}
        {notifPermission === 'denied' && (<div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 16px', margin:'0 0 16px 0', fontSize:13, color:'#dc2626' }}>❌ Notifications blocked. Please enable them in your browser settings.</div>)}
        {loading ? <Loader/> : data.length===0 ? <Empty icon="🔔" text="No reminders yet — add one!"/> :
          data.map(r => (
            <div key={r.reminder_id} className="reminder-card">
              <div className="reminder-icon-wrap">{icons[r.mode]||'🔔'}</div>
              <div className="reminder-info">
                <div className="reminder-name">{schedules.find(s=>s.schedule_id===r.schedule_id)?.dosage?.medicine?.name||`Schedule #${r.schedule_id}`}</div>
                <div className="reminder-sub">{r.mode} · {r.reminder_time} · {r.status}</div>
              </div>
              <span className={`badge ${r.status==='Active'?'badge-green':'badge-red'}`}>{r.status}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => toggle(r.reminder_id, r.status)}>{r.status==='Active'?'Pause':'Resume'}</button>
              <button className="btn btn-danger btn-sm" onClick={() => deleteReminder(r.reminder_id)}>🗑️</button>
            </div>
          ))
        }
      </div>
      <div className="section-card" style={{ alignSelf:'start' }}>
        <div className="section-header">
          <div>
            <div className="section-title">➕ Add Reminder</div>
            <div className="section-subtitle" style={{ display:'flex', flexDirection:'column', gap:2 }}>
              <span>{notifPermission==='granted'?'🔔 Browser notifications active':'⚠️ Enable notifications above'}</span>
              <span>{profile?.phone?'📱 SMS: '+profile.phone:'📱 Add phone in profile for SMS'}</span>
            </div>
          </div>
        </div>
        <div style={{ padding:20 }}>
          <div className="form-group">
            <label className="form-label">Medicine Schedule</label>
            <select className="form-input" value={form.schedule_id} onChange={e => setForm({...form,schedule_id:e.target.value})}>
              <option value="">Select schedule...</option>
              {schedules.map(s => (<option key={s.schedule_id} value={s.schedule_id}>{s.dosage?.medicine?.name} — {s.dosage?.frequency}</option>))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Reminder Time</label>
            <input className="form-input" type="time" value={form.reminder_time} onChange={e => setForm({...form,reminder_time:e.target.value})}/>
          </div>
          <div className="form-group">
            <label className="form-label">Mode</label>
            <select className="form-input" value={form.mode} onChange={e => setForm({...form,mode:e.target.value})}>
              <option>Daily</option>
              <option>Weekly</option>
              <option>One-time</option>
              <option>Refill</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={e => setForm({...form,status:e.target.value})}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          <div style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', marginBottom:14, fontSize:12 }}>
            <div style={{ fontWeight:700, color:'#334155', marginBottom:6 }}>When saved:</div>
            <div style={{ color: notifPermission==='granted'?'#16a34a':'#94a3b8' }}>{notifPermission==='granted'?'✅':'⬜'} Browser notification</div>
            <div style={{ color: profile?.phone?'#16a34a':'#94a3b8' }}>{profile?.phone?'✅':'⬜'} SMS to {profile?.phone||'(no phone set)'}</div>
          </div>
          <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }} onClick={save} disabled={saving}>{saving ? '⏳ Saving...' : '💾 Save Reminder'}</button>
        </div>
      </div>
    </div>
  )
}

function UserStats({ showToast, profile }) {
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data:scheds } = await supabase.from('schedule')
      .select('schedule_id,dosage(medicine(name,prescription(user_id)))')
      .filter('dosage.medicine.prescription.user_id','eq',profile.user_id)
    const myIds = (scheds||[]).filter(s=>s.dosage?.medicine?.prescription?.user_id===profile.user_id).map(s=>s.schedule_id)
    if (myIds.length === 0) { setLoading(false); return }
    const { data:d } = await supabase.from('intake_log')
      .select('*')
      .in('schedule_id', myIds)
      .order('date', { ascending:false })
    const allLogs = d||[]
    setLogs(allLogs.slice(0,20))
    const taken = allLogs.filter(l=>l.status==='Taken').length
    const missed = allLogs.filter(l=>l.status==='Missed').length
    const skipped = allLogs.filter(l=>l.status==='Skipped').length
    const total = taken+missed+skipped
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now()-7*24*60*60*1000).toISOString().split('T')[0]
    const monthAgo = new Date(Date.now()-30*24*60*60*1000).toISOString().split('T')[0]
    const weekLogs = allLogs.filter(l=>l.date>=weekAgo)
    const monthLogs = allLogs.filter(l=>l.date>=monthAgo)
    const todayLogs = allLogs.filter(l=>l.date===today)
    setStats({
      overall: total>0?Math.round((taken/total)*100):0,
      week: weekLogs.length>0?Math.round((weekLogs.filter(l=>l.status==='Taken').length/weekLogs.length)*100):0,
      month: monthLogs.length>0?Math.round((monthLogs.filter(l=>l.status==='Taken').length/monthLogs.length)*100):0,
      today: todayLogs.length>0?Math.round((todayLogs.filter(l=>l.status==='Taken').length/todayLogs.length)*100):0,
      taken, missed, skipped, total
    })
    setLoading(false)
  }, [profile])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="section-card"><Loader/></div>
  if (!stats) return <div className="section-card"><Empty icon="📊" text="No data yet — start logging your doses!"/></div>

  return (
    <div>
      <div className="stats-grid">
        {[
          { label:'Overall Adherence', value:`${stats.overall}%`, bar:stats.overall, accent:'#2563eb', accentLight:'#eff6ff' },
          { label:'This Week', value:`${stats.week}%`, bar:stats.week, accent:'#16a34a', accentLight:'#dcfce7' },
          { label:'This Month', value:`${stats.month}%`, bar:stats.month, accent:'#d97706', accentLight:'#fffbeb' },
          { label:'Today', value:`${stats.today}%`, bar:stats.today, accent:'#0891b2', accentLight:'#ecfeff' },
        ].map((c,i) => (
          <div key={i} className="stat-card" style={{ '--accent':c.accent, '--accent-light':c.accentLight }}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width:`${c.bar}%` }}></div>
            </div>
          </div>
        ))}
      </div>
      <div className="dash-grid">
        <div className="section-card">
          <div className="section-header">
            <div>
              <div className="section-title">📊 Dose Breakdown</div>
              <div className="section-subtitle">All time summary</div>
            </div>
          </div>
          <div style={{ padding:20 }}>
            {[
              { label:'✅ Taken', value:stats.taken, color:'#16a34a', bg:'#dcfce7' },
              { label:'❌ Missed', value:stats.missed, color:'#dc2626', bg:'#fef2f2' },
              { label:'⏭️ Skipped', value:stats.skipped, color:'#d97706', bg:'#fffbeb' }
            ].map(s => (
              <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid #f1f5f9' }}>
                <span style={{ fontSize:14, fontWeight:600, color:'#334155' }}>{s.label}</span>
                <span style={{ background:s.bg, color:s.color, fontWeight:700, fontSize:13, padding:'4px 14px', borderRadius:20 }}>{s.value} doses</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:12 }}>
              <span style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>Total Logged</span>
              <span style={{ fontWeight:700, fontSize:15, color:'#1a3c5e' }}>{stats.total} doses</span>
            </div>
          </div>
        </div>
        <div className="section-card">
          <div className="section-header">
            <div>
              <div className="section-title">🕐 Recent History</div>
              <div className="section-subtitle">Last 20 dose logs</div>
            </div>
          </div>
          {logs.length===0?<Empty icon="📋" text="No logs yet"/>:(
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Schedule</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.log_id}>
                    <td>{l.date}</td>
                    <td>SCH-{l.schedule_id}</td>
                    <td>{l.time_taken||'—'}</td>
                    <td><span className={`badge ${l.status==='Taken'?'badge-green':l.status==='Missed'?'badge-red':'badge-yellow'}`}>{l.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
    const { data:d, error } = await supabase.from('prescription')
      .select('doctor(doctor_id,name,specialization,email,phone)')
      .eq('user_id',profile.user_id)
    if (error) showToast(error.message,'error')
    else {
      const docs = d.map(p=>p.doctor).filter(Boolean)
      setData([...new Map(docs.map(d=>[d.doctor_id,d])).values()])
    }
    setLoading(false)
  }, [showToast, profile])

  useEffect(() => { load() }, [load])

  const statusLabels = ['Active Patient','Consulting','Short-term','Ongoing']
  const statusColors = ['badge-green','badge-blue','badge-yellow','badge-teal']

  return (
    <div className="section-card">
      <div className="section-header">
        <div>
          <div className="section-title">🩺 My Doctors</div>
          <div className="section-subtitle">Doctors who prescribed your medicines</div>
        </div>
      </div>
      {loading?<Loader/>:data.length===0?<Empty icon="🩺" text="No doctors assigned yet"/>:(
        <div className="doctor-grid">
          {data.map((d,i) => (
            <div key={d.doctor_id} className="doctor-card">
              <div className="doctor-card-accent" style={{ background:getDoctorAccent(i) }}></div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginTop:8 }}>
                <div className="doctor-avatar" style={{ background:`linear-gradient(135deg, ${getDoctorAccent(i)}33, ${getDoctorAccent(i)}55)`, color:getDoctorAccent(i), width:50, height:50, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:18 }}>{getInitials(d.name)}</div>
              </div>
              <div className="doctor-card-name">{d.name}</div>
              <div className="doctor-card-spec">{d.specialization||'General'}</div>
              <div style={{ fontSize:12, color:'#94a3b8', marginBottom:12 }}>
                <div>📧 {d.email||'—'}</div>
                <div>📱 {d.phone||'—'}</div>
              </div>
              <span className={`badge ${statusColors[i%4]}`}>{statusLabels[i%4]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── MAIN APP ────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [toast, setToast] = useState(null)

  const pages = [
    { id:'dashboard', label:'Dashboard', icon:'📊', section:'Overview' },
    { id:'medicines', label:'Medicines', icon:'💊', section:'Management' },
    { id:'schedule', label:'Schedule', icon:'📅', section:'Management' },
    { id:'prescriptions', label:'Prescriptions', icon:'📋', section:'Medical' },
    { id:'intake', label:'Intake Log', icon:'📝', section:'Tracking' },
    { id:'reminders', label:'Reminders', icon:'🔔', section:'Tracking' },
    { id:'stats', label:'Statistics', icon:'📈', section:'Analytics' },
    { id:'doctors', label:'My Doctors', icon:'🩺', section:'Medical' },
  ]

  useEffect(() => {
    const checkAuth = async () => {
      const { data:{ user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data:profile } = await supabase.from('users').select('*').eq('auth_id',user.id).single()
        setProfile(profile)
      }
    }
    checkAuth()
  }, [])

  const handleLogin = (user, profile) => {
    setUser(user)
    setProfile(profile)
  }

  const showToast = (message, type='success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setPage('dashboard')
  }

  if (!user) return <AuthPage onLogin={handleLogin} />

  const pageConfig = {
    dashboard: <UserDashboard showToast={showToast} profile={profile} />,
    medicines: <UserMedicines showToast={showToast} profile={profile} />,
    schedule: <UserSchedule showToast={showToast} profile={profile} />,
    prescriptions: <UserPrescriptions showToast={showToast} profile={profile} />,
    intake: <UserIntakeLogs showToast={showToast} profile={profile} />,
    reminders: <UserReminders showToast={showToast} profile={profile} />,
    stats: <UserStats showToast={showToast} profile={profile} />,
    doctors: <UserDoctors showToast={showToast} profile={profile} />,
  }

  const pageTitle = pages.find(p => p.id===page)?.label || 'Dashboard'

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>
      <Sidebar pages={pages} page={page} setPage={setPage} user={user} profile={profile} />
      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
        <Topbar title={pageTitle} onLogout={handleLogout} actionLabel={page==='dashboard'?'+ Add New':undefined} onAction={page==='dashboard'?() => showToast('Add new clicked'):undefined} />
        <main style={{ flex:1, padding:24, overflow:'auto' }}>
          {pageConfig[page]}
        </main>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}