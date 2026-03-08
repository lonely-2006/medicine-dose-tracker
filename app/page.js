'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function getMedCardColor(i) { return ['', 'green', 'orange', 'yellow'][i % 4] }
function getDoctorAccent(i) { return ['#2563eb','#16a34a','#d97706','#7c3aed','#0891b2','#dc2626'][i % 6] }

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

// ── AUTH ─────────────────────────────────────────
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
    if (role==='admin' && !profile?.is_admin) { await supabase.auth.signOut(); setError('This account is not an Admin account.'); setLoading(false); return }
    if (role==='doctor' && !profile?.is_doctor) { await supabase.auth.signOut(); setError('This account is not a Doctor account.'); setLoading(false); return }
    if (role==='patient' && (profile?.is_admin || profile?.is_doctor)) { await supabase.auth.signOut(); setError('Please select the correct role for this account.'); setLoading(false); return }
    onLogin(data.user, profile); setLoading(false)
  }
  const handleRegister = async () => {
    if (role === 'admin') { setError('Admin accounts cannot self-register.'); return }
    if (!form.name) return setError('Please enter your name')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true); setError('')
    const { data: authData, error: authError } = await supabase.auth.signUp({ email:form.email, password:form.password, options:{ data:{ name:form.name } } })
    if (authError) { setError(authError.message); setLoading(false); return }
    if (authData?.user) {
      await supabase.from('users').insert({ auth_id: authData.user.id, name: form.name, email: form.email, is_admin: false, is_doctor: role==='doctor' })
    }
    setSuccess('Account created! Please login now.')
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
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'1.5px', fontWeight:600, marginBottom:10 }}>Login as</div>
          <div style={{ display:'flex', gap:10 }}>
            {roles.map(r => (
              <button key={r.id} onClick={() => { setRole(r.id); setError(''); setSuccess('') }}
                style={{ flex:1, padding:'12px 8px', borderRadius:12, border:`2px solid ${role===r.id?r.color:'#e2e8f0'}`, background:role===r.id?`${r.color}10`:'#f8fafc', color:role===r.id?r.color:'#94a3b8', fontWeight:role===r.id?700:500, fontSize:13, cursor:'pointer', fontFamily:'Plus Jakarta Sans, sans-serif', transition:'all 0.2s', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:20 }}>{r.icon}</span><span>{r.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontFamily:'Fraunces, serif', fontSize:22, fontWeight:700, color:'#0f172a' }}>{mode==='login'?`${activeRole.icon} ${activeRole.label} Login`:'📝 Create Account'}</div>
          <div style={{ fontSize:13, color:'#94a3b8', marginTop:4 }}>{mode==='login'?`Sign in as ${activeRole.label}`:'Register as a new patient'}</div>
        </div>
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
        {mode==='register' && role==='admin' && <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#d97706', marginBottom:16 }}>⚠️ Only Admin accounts cannot self-register.</div>}
        {mode==='register' && <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" placeholder="John Doe" value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></div>}
        <div className="form-group"><label className="form-label">Email Address</label><input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form,email:e.target.value})} onKeyDown={e => e.key==='Enter' && (mode==='login'?handleLogin():handleRegister())}/></div>
        <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form,password:e.target.value})} onKeyDown={e => e.key==='Enter' && (mode==='login'?handleLogin():handleRegister())}/></div>
        <button className="btn btn-primary" style={{ width:'100%', padding:'12px', marginTop:6, fontSize:14, justifyContent:'center', background:activeRole.color, borderColor:activeRole.color }} onClick={mode==='login'?handleLogin:handleRegister} disabled={loading}>
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

// ── SIDEBAR / TOPBAR ─────────────────────────────
function Sidebar({ pages, page, setPage, user, profile }) {
  const sections = [...new Set(pages.map(p => p.section))]
  const roleLabel = profile?.is_admin?'Admin':profile?.is_doctor?'Doctor':'Patient'
  return (
    <div className="sidebar">
      <div className="logo"><div className="logo-text">Medi<span>Track</span></div><div className="logo-sub">Dose Tracker System</div></div>
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
        <div className="topbar-search"><span style={{ color:'#94a3b8', fontSize:14 }}>🔍</span><input placeholder="Search..."/></div>
        <div className="status-dot"></div><div className="status-text">Connected</div>
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
    showToast(`Marked as ${status}!`); load()
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
                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-sm" style={{ background:'#dcfce7', color:'#16a34a', border:'none', borderRadius:8, padding:'4px 10px', cursor:'pointer', fontSize:12, fontWeight:600 }} onClick={() => logDose(s.schedule_id,'Taken')}>✓ Taken</button>
                  <button className="btn btn-sm" style={{ background:'#fef2f2', color:'#dc2626', border:'none', borderRadius:8, padding:'4px 10px', cursor:'pointer', fontSize:12, fontWeight:600 }} onClick={() => logDose(s.schedule_id,'Missed')}>✗ Missed</button>
                </div>
              </div>
            ))}
        </div>
        <div className="section-card">
          <div className="section-header"><div><div className="section-title">🔔 Active Reminders</div><div className="section-subtitle">Your upcoming reminders</div></div></div>
          {loading?<Loader/>:reminders.length===0?<Empty icon="🔕" text="No active reminders"/>:
            reminders.map(r => (
              <div key={r.reminder_id} className="reminder-card">
                <div className="reminder-icon-wrap">{r.mode==='Daily'?'⏰':r.mode==='Refill'?'🛒':'💊'}</div>
                <div className="reminder-info"><div className="reminder-name">Schedule #{r.schedule_id}</div><div className="reminder-sub">{r.mode} · {r.reminder_time}</div></div>
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
      name: form.name, brand: form.brand, type: form.type, description: form.description,
      status: 'Pending', added_by_user: true, prescription_id: null
    })
    if (error) { showToast(error.message, 'error'); setSaving(false); return }
    showToast('Medicine submitted for approval! 🕐')
    setModal(false); setForm({ name:'', brand:'', type:'Tablet', description:'' }); setSaving(false); load()
  }

  const remove = async (id) => {
    if (!confirm('Remove this medicine?')) return
    await supabase.from('medicine').delete().eq('medicine_id', id)
    showToast('Removed!'); load()
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
        <div><div className="section-title">💊 My Medicines</div><div className="section-subtitle">Your prescribed & self-added medicines</div></div>
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
                    <div><div className="medicine-card-name">{m.name}</div><div className="medicine-card-brand">{m.brand||'—'}</div></div>
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
            <div className="form-group"><label className="form-label">Medicine Name *</label><input className="form-input" placeholder="e.g. Metformin" value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">Brand</label><input className="form-input" placeholder="e.g. Glucophage" value={form.brand} onChange={e => setForm({...form,brand:e.target.value})}/></div>
          </div>
          <div className="form-group"><label className="form-label">Type</label>
            <select className="form-input" value={form.type} onChange={e => setForm({...form,type:e.target.value})}>
              {['Tablet','Capsule','Inhaler','Syrup','Injection','Cream','Eye Drop','Other'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Description / Notes</label>
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
      .eq('added_by_user', true).eq('status', 'Active').is('prescription_id', null)
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
    showToast('Dosage added!'); setModalDosage(false); setSaving(false); load()
  }

  const saveSchedule = async () => {
    if (!schedForm.dosage_id || !schedForm.end_date) return showToast('Fill all fields','error')
    setSaving(true)
    const { data:sched, error } = await supabase.from('schedule').insert({ dosage_id:parseInt(schedForm.dosage_id), start_date:schedForm.start_date, end_date:schedForm.end_date, time:schedForm.time+':00' }).select().single()
    if (error) { showToast(error.message,'error'); setSaving(false); return }
    showToast('Schedule added! Want to set a reminder?')
    setModalSchedule(false); setModalReminder(sched.schedule_id); setSaving(false); load()
  }

  const saveReminder = async (scheduleId) => {
    setSaving(true)
    const { error } = await supabase.from('reminder').insert({ schedule_id:scheduleId, reminder_time:reminderForm.reminder_time, mode:reminderForm.mode, status:'Active' })
    if (error) { showToast(error.message,'error'); setSaving(false); return }
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🔔 Reminder Set!', { body:`Reminder at ${reminderForm.reminder_time} · ${reminderForm.mode}`, icon:'/favicon.ico' })
    }
    showToast('Reminder set! 🔔'); setModalReminder(null); setSaving(false)
  }

  const deleteSchedule = async (id) => {
    if (!confirm('Delete this schedule?')) return
    await supabase.from('schedule').delete().eq('schedule_id', id)
    showToast('Deleted!'); load()
  }

  return (
    <div>
      <div className="section-card">
        <div className="section-header">
          <div><div className="section-title">📅 My Schedule</div><div className="section-subtitle">Manage your medicine schedule</div></div>
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
                  <td>{s.dosage?.amount} {s.dosage?.unit}</td><td>{s.dosage?.frequency}</td>
                  <td>{s.start_date}</td><td>{s.end_date}</td>
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
          <div className="form-group"><label className="form-label">Medicine</label>
            <select className="form-input" value={dosageForm.medicine_id} onChange={e => setDosageForm({...dosageForm,medicine_id:e.target.value})}>
              <option value="">Select medicine...</option>
              {medicines.map(m => <option key={m.medicine_id} value={m.medicine_id}>{m.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Amount</label><input className="form-input" type="number" placeholder="1" value={dosageForm.amount} onChange={e => setDosageForm({...dosageForm,amount:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">Unit</label>
              <select className="form-input" value={dosageForm.unit} onChange={e => setDosageForm({...dosageForm,unit:e.target.value})}>
                {['tablet','capsule','ml','mg','drop','puff','unit'].map(u=><option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">Frequency</label>
            <select className="form-input" value={dosageForm.frequency} onChange={e => setDosageForm({...dosageForm,frequency:e.target.value})}>
              {['Once daily','Twice daily','Three times daily','Every 8 hours','Every 12 hours','Weekly','As needed'].map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setModalDosage(false)}>Cancel</button><button className="btn btn-primary" onClick={saveDosage} disabled={saving||medicines.length===0}>{saving?'Saving...':'Add Dosage'}</button></div>
        </Modal>
      )}
      {modalSchedule && (
        <Modal title="📅 Add Schedule" onClose={() => setModalSchedule(false)}>
          {dosages.length===0 && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#dc2626', marginBottom:16 }}>❌ No dosages found. Add a dosage first.</div>}
          <div className="form-group"><label className="form-label">Dosage</label>
            <select className="form-input" value={schedForm.dosage_id} onChange={e => setSchedForm({...schedForm,dosage_id:e.target.value})}>
              <option value="">Select dosage...</option>
              {dosages.map(d => { const med = medicines.find(m=>m.medicine_id===d.medicine_id); return <option key={d.dosage_id} value={d.dosage_id}>{med?.name} — {d.amount} {d.unit} ({d.frequency})</option> })}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Start Date</label><input className="form-input" type="date" value={schedForm.start_date} onChange={e => setSchedForm({...schedForm,start_date:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">End Date</label><input className="form-input" type="date" value={schedForm.end_date} onChange={e => setSchedForm({...schedForm,end_date:e.target.value})}/></div>
          </div>
          <div className="form-group"><label className="form-label">Time</label><input className="form-input" type="time" value={schedForm.time} onChange={e => setSchedForm({...schedForm,time:e.target.value})}/></div>
          <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setModalSchedule(false)}>Cancel</button><button className="btn btn-primary" onClick={saveSchedule} disabled={saving||dosages.length===0}>{saving?'Saving...':'Add Schedule'}</button></div>
        </Modal>
      )}
      {modalReminder && (
        <Modal title="🔔 Set Reminder" onClose={() => setModalReminder(null)}>
          <div style={{ background:'#ecfdf5', border:'1px solid #a7f3d0', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#059669', marginBottom:16 }}>✅ Schedule saved! Want to set a reminder?</div>
          <div className="form-group"><label className="form-label">Reminder Time</label><input className="form-input" type="time" value={reminderForm.reminder_time} onChange={e => setReminderForm({...reminderForm,reminder_time:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Mode</label>
            <select className="form-input" value={reminderForm.mode} onChange={e => setReminderForm({...reminderForm,mode:e.target.value})}>
              <option>Daily</option><option>Weekly</option><option>One-time</option><option>Refill</option>
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
          <thead><tr><th>ID</th><th>Doctor</th><th>Date</th><th>Medicines</th><th>Notes</th><th>Status</th></tr></thead>
          <tbody>{data.map(p => {
            const s = getStatus(p.date_issued)
            return (
              <tr key={p.prescription_id}>
                <td><strong>#RX-{String(p.prescription_id).padStart(4,'0')}</strong></td>
                <td>{p.doctor?.name||'—'}</td><td>{p.date_issued}</td>
                <td>{Array.isArray(p.medicine)?p.medicine.map(m=>m.name).join(', '):p.medicine?.name||'—'}</td>
                <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.notes||'—'}</td>
                <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
              </tr>
            )
          })}</tbody>
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
    const { data:scheds } = await supabase.from('schedule').select('schedule_id,dosage(medicine(name,prescription(user_id)))').filter('dosage.medicine.prescription.user_id','eq',profile.user_id)
    const mySchedIds = (scheds||[]).filter(s => s.dosage?.medicine?.prescription?.user_id===profile.user_id).map(s => s.schedule_id)
    if (mySchedIds.length === 0) { setData([]); setLoading(false); return }
    const { data:d, error } = await supabase.from('intake_log').select('log_id,schedule_id,date,time_taken,status').in('schedule_id', mySchedIds).order('log_id',{ ascending:false }).limit(50)
    if (error) showToast(error.message,'error'); else setData(d)
    setLoading(false)
  }, [showToast, profile])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.schedule_id) return showToast('Enter a schedule ID','error')
    const { error } = await supabase.from('intake_log').insert({ schedule_id:parseInt(form.schedule_id), date:form.date, time_taken:form.status==='Taken'?(form.time_taken||null):null, status:form.status })
    if (error) return showToast(error.message,'error')
    showToast('Dose logged!'); setModal(false); load()
  }

  const filtered = filter==='All'?data:data.filter(l=>l.status===filter)
  const statusBadge = s => s==='Taken'?'badge-green':s==='Missed'?'badge-red':'badge-yellow'

  return (
    <div>
      <div className="section-card">
        <div className="section-header">
          <div><div className="section-title">📝 Intake Log</div><div className="section-subtitle">Your dose history</div></div>
          <div style={{ display:'flex', gap:8 }}>
            {['All','Taken','Missed','Skipped'].map(f => (
              <button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-ghost'}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
            <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Log Dose</button>
          </div>
        </div>
        {loading?<Loader/>:filtered.length===0?<Empty icon="📝" text="No logs yet"/>:(
          <table>
            <thead><tr><th>Log ID</th><th>Schedule</th><th>Time Taken</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>{filtered.map(l => (
              <tr key={l.log_id}>
                <td><strong>#LOG-{String(l.log_id).padStart(3,'0')}</strong></td>
                <td>SCH-{l.schedule_id}</td><td>{l.time_taken||'—'}</td><td>{l.date}</td>
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
          <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Log Dose</button></div>
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

  useEffect(() => { if ('Notification' in window) setNotifPermission(Notification.permission) }, [])

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) return showToast('Browser does not support notifications', 'error')
    const result = await Notification.requestPermission()
    setNotifPermission(result)
    if (result === 'granted') showToast('Browser notifications enabled! 🔔')
    else showToast('Notification permission denied', 'error')
  }

  const sendBrowserNotification = (medName, time, mode) => {
    if (notifPermission !== 'granted') return
    new Notification('💊 MediTrack Reminder Set!', { body:`${medName}\nTime: ${time} · ${mode}`, icon:'/favicon.ico', badge:'/favicon.ico' })
  }

  const load = useCallback(async () => {
    setLoading(true)
    const { data:scheds } = await supabase.from('schedule').select('schedule_id,dosage(amount,unit,frequency,medicine(name,prescription(user_id)))').filter('dosage.medicine.prescription.user_id','eq',profile.user_id)
    const myScheds = (scheds||[]).filter(s => s.dosage?.medicine?.prescription?.user_id===profile.user_id)
    setSchedules(myScheds)
    const myIds = myScheds.map(s => s.schedule_id)
    if (myIds.length > 0) {
      const { data:d, error } = await supabase.from('reminder').select('*').in('schedule_id', myIds).order('reminder_id')
      if (error) showToast(error.message,'error'); else setData(d)
    } else setData([])
    setLoading(false)
  }, [showToast, profile])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.schedule_id) return showToast('Select a schedule', 'error')
    setSaving(true)
    const { error } = await supabase.from('reminder').insert({ schedule_id:parseInt(form.schedule_id), reminder_time:form.reminder_time, mode:form.mode, status:form.status })
    if (error) { showToast(error.message, 'error'); setSaving(false); return }
    const sched = schedules.find(s => s.schedule_id === parseInt(form.schedule_id))
    const medName = sched?.dosage?.medicine?.name || 'your medicine'
    sendBrowserNotification(medName, form.reminder_time, form.mode)
    showToast('Reminder saved! 🔔')
    if (profile?.phone) {
      try {
        const res = await fetch('/api/send-sms', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ to:profile.phone, message:`🔔 MediTrack Reminder!\nMedicine: ${medName}\nTime: ${form.reminder_time}\nMode: ${form.mode}\n\nStay healthy! 💊` }) })
        if (res.ok) showToast('SMS sent to your phone! 📱')
      } catch (e) { console.log('SMS skipped (Twilio not configured)') }
    }
    load(); setSaving(false)
  }

  const toggle = async (id, status) => {
    const newStatus = status === 'Active' ? 'Inactive' : 'Active'
    const { error } = await supabase.from('reminder').update({ status: newStatus }).eq('reminder_id', id)
    if (error) return showToast(error.message, 'error')
    showToast(`Reminder ${newStatus}!`); load()
  }

  const deleteReminder = async (id) => {
    const { error } = await supabase.from('reminder').delete().eq('reminder_id', id)
    if (error) return showToast(error.message, 'error')
    showToast('Reminder deleted!'); load()
  }

  const icons = { Daily:'⏰', Weekly:'💊', 'One-time':'🔔', Refill:'🛒' }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:20 }}>
      <div className="section-card">
        <div className="section-header">
          <div><div className="section-title">🔔 My Reminders</div><div className="section-subtitle">Your medicine reminders</div></div>
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
          <div className="form-group"><label className="form-label">Medicine Schedule</label>
            <select className="form-input" value={form.schedule_id} onChange={e => setForm({...form,schedule_id:e.target.value})}>
              <option value="">Select schedule...</option>
              {schedules.map(s => (<option key={s.schedule_id} value={s.schedule_id}>{s.dosage?.medicine?.name} — {s.dosage?.frequency}</option>))}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Reminder Time</label><input className="form-input" type="time" value={form.reminder_time} onChange={e => setForm({...form,reminder_time:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Mode</label>
            <select className="form-input" value={form.mode} onChange={e => setForm({...form,mode:e.target.value})}>
              <option>Daily</option><option>Weekly</option><option>One-time</option><option>Refill</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={e => setForm({...form,status:e.target.value})}><option>Active</option><option>Inactive</option></select>
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
    const { data:scheds } = await supabase.from('schedule').select('schedule_id,dosage(medicine(name,prescription(user_id)))').filter('dosage.medicine.prescription.user_id','eq',profile.user_id)
    const myIds = (scheds||[]).filter(s=>s.dosage?.medicine?.prescription?.user_id===profile.user_id).map(s=>s.schedule_id)
    if (myIds.length === 0) { setLoading(false); return }
    const { data:d } = await supabase.from('intake_log').select('*').in('schedule_id', myIds).order('date', { ascending:false })
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
            <div className="stat-label">{c.label}</div><div className="stat-value">{c.value}</div>
            <div className="stat-bar"><div className="stat-bar-fill" style={{ width:`${c.bar}%` }}></div></div>
          </div>
        ))}
      </div>
      <div className="dash-grid">
        <div className="section-card">
          <div className="section-header"><div><div className="section-title">📊 Dose Breakdown</div><div className="section-subtitle">All time summary</div></div></div>
          <div style={{ padding:20 }}>
            {[{ label:'✅ Taken', value:stats.taken, color:'#16a34a', bg:'#dcfce7' },{ label:'❌ Missed', value:stats.missed, color:'#dc2626', bg:'#fef2f2' },{ label:'⏭️ Skipped', value:stats.skipped, color:'#d97706', bg:'#fffbeb' }].map(s => (
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
          <div className="section-header"><div><div className="section-title">🕐 Recent History</div><div className="section-subtitle">Last 20 dose logs</div></div></div>
          {logs.length===0?<Empty icon="📋" text="No logs yet"/>:(
            <table>
              <thead><tr><th>Date</th><th>Schedule</th><th>Time</th><th>Status</th></tr></thead>
              <tbody>{logs.map(l => (
                <tr key={l.log_id}><td>{l.date}</td><td>SCH-{l.schedule_id}</td><td>{l.time_taken||'—'}</td>
                  <td><span className={`badge ${l.status==='Taken'?'badge-green':l.status==='Missed'?'badge-red':'badge-yellow'}`}>{l.status}</span></td>
                </tr>
              ))}</tbody>
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
              <div className="doctor-name">{d.name}</div><div className="doctor-spec">{d.specialization}</div>
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
    if (error) showToast(error.message,'error'); else showToast('Profile updated! Phone saved for SMS.')
    setSaving(false)
  }
  return (
    <div>
      <div className="profile-header">
        <div className="profile-avatar">{getInitials(profile?.name)}</div>
        <div>
          <div className="profile-name">{profile?.name}</div>
          <div className="profile-meta">Patient ID: USR-{String(profile?.user_id||0).padStart(8,'0')} · Age {profile?.age} · {profile?.gender}</div>
          <div className="profile-meta" style={{ marginTop:4 }}>📱 {profile?.phone||'Not set — add for SMS!'} &nbsp;·&nbsp; ✉️ {user?.email}</div>
        </div>
      </div>
      <div className="dash-grid">
        <div className="section-card">
          <div className="section-header"><div><div className="section-title">Personal Information</div></div></div>
          <div style={{ padding:22 }}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">Age</label><input className="form-input" type="number" value={form.age} onChange={e => setForm({...form,age:e.target.value})}/></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Phone (for SMS reminders) 📱</label><input className="form-input" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} placeholder="+91XXXXXXXXXX"/></div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={user?.email||''} disabled/></div>
            </div>
            <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" rows={3} value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} placeholder="Regular checkups every 3 months..." style={{ resize:'vertical' }}/></div>
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

// ── DOCTOR PAGES ─────────────────────────────────
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
            <div className="stat-label">{c.label}</div><div className="stat-value">{loading?'—':c.value??0}</div>
          </div>
        ))}
      </div>
      <div className="section-card">
        <div className="section-header"><div><div className="section-title">📋 Recent Prescriptions</div></div><button className="btn btn-ghost btn-sm" onClick={load}>↻</button></div>
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
      <div className="section-header"><div><div className="section-title">👥 My Patients</div></div></div>
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
        <div className="section-header"><div><div className="section-title">📋 My Prescriptions</div></div><button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Add</button></div>
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
  const [modal, setModal] = useState(false)
  const [prescriptions, setPrescriptions] = useState([])
  const [form, setForm] = useState({ name:'', brand:'', type:'Tablet', description:'', prescription_id:'' })
  const load = useCallback(async () => {
    setLoading(true)
    const { data:dr } = await supabase.from('doctor').select('doctor_id').eq('email',user.email).single()
    if (!dr) { setLoading(false); return }
    const { data:d, error } = await supabase.from('medicine').select('medicine_id,name,brand,type,description,prescription_id,prescription!inner(doctor_id)').eq('prescription.doctor_id',dr.doctor_id)
    if (error) showToast(error.message,'error'); else setData(d)
    const { data:pr } = await supabase.from('prescription').select('prescription_id,users(name)').eq('doctor_id',dr.doctor_id)
    setPrescriptions(pr||[])
    setLoading(false)
  }, [showToast, user])
  useEffect(() => { load() }, [load])
  const save = async () => {
    const { error } = await supabase.from('medicine').insert({ ...form, prescription_id:parseInt(form.prescription_id) })
    if (error) return showToast(error.message,'error')
    showToast('Medicine added!'); setModal(false); load()
  }
  return (
    <div>
      <div className="section-card">
        <div className="section-header"><div><div className="section-title">💊 Medicines Prescribed</div></div><button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Add Medicine</button></div>
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
      {modal && (
        <Modal title="➕ Add Medicine" onClose={() => setModal(false)}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Metformin"/></div>
            <div className="form-group"><label className="form-label">Brand</label><input className="form-input" value={form.brand} onChange={e => setForm({...form,brand:e.target.value})} placeholder="Glucophage"/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Type</label>
              <select className="form-input" value={form.type} onChange={e => setForm({...form,type:e.target.value})}>{['Tablet','Capsule','Inhaler','Syrup','Injection','Cream','Eye Drop'].map(t=><option key={t}>{t}</option>)}</select>
            </div>
            <div className="form-group"><label className="form-label">Prescription</label>
              <select className="form-input" value={form.prescription_id} onChange={e => setForm({...form,prescription_id:e.target.value})}>
                <option value="">Select prescription...</option>
                {prescriptions.map(p => <option key={p.prescription_id} value={p.prescription_id}>#RX-{String(p.prescription_id).padStart(4,'0')} — {p.users?.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={e => setForm({...form,description:e.target.value})}/></div>
          <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Add</button></div>
        </Modal>
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
      <div className="section-header"><div><div className="section-title">📅 Patient Schedules</div></div><button className="btn btn-ghost btn-sm" onClick={load}>↻</button></div>
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

// ── ADMIN PAGES ──────────────────────────────────
function AdminDashboard({ showToast }) {
  const [stats, setStats] = useState({})
  const [scheds, setScheds] = useState([])
  const [missed, setMissed] = useState([])
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
    const { data:sc } = await supabase.from('schedule').select('schedule_id,time,dosage(amount,unit,frequency,medicine(name))').lte('start_date',today).gte('end_date',today).limit(10)
    setScheds(sc||[])
    const { data:mi } = await supabase.from('intake_log').select('log_id,schedule_id,date,status').eq('status','Missed').order('date',{ ascending:false }).limit(5)
    setMissed(mi||[])
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
            <div className="stat-label">{c.label}</div><div className="stat-value">{loading?'—':c.value}</div>
          </div>
        ))}
      </div>
      <div className="dash-grid">
        <div className="section-card">
          <div className="section-header"><div><div className="section-title">📅 Today's Schedule</div></div></div>
          {loading?<Loader/>:scheds.length===0?<Empty icon="📭" text="No schedules for today"/>:
            scheds.map(s => (
              <div key={s.schedule_id} className="schedule-item">
                <div className="schedule-item-bar pending"></div>
                <div className="schedule-time">{s.time?.slice(0,5)}</div>
                <div className="schedule-info"><div className="schedule-name">{s.dosage?.medicine?.name||'—'}</div><div className="schedule-detail">{s.dosage?.amount} {s.dosage?.unit} · {s.dosage?.frequency}</div></div>
              </div>
            ))}
        </div>
        <div className="section-card">
          <div className="section-header"><div><div className="section-title">⚠️ Missed Doses</div></div></div>
          {loading?<Loader/>:missed.length===0?<Empty icon="✅" text="No missed doses!"/>:(
            <table><thead><tr><th>Log ID</th><th>Schedule</th><th>Date</th></tr></thead>
            <tbody>{missed.map(m => <tr key={m.log_id}><td>#{m.log_id}</td><td>SCH-{m.schedule_id}</td><td>{m.date}</td></tr>)}</tbody></table>
          )}
        </div>
      </div>
    </div>
  )
}

// ── ADMIN USERS (FIXED - shows patients + doctors) ──
function AdminUsers({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [filter, setFilter] = useState('All')
  const [form, setForm] = useState({ name:'', phone:'', age:'', gender:'Male', email:'' })

  const load = useCallback(async () => {
    setLoading(true)
    // Fetch patients/admins from users table
    const { data:users, error:usersError } = await supabase.from('users').select('*').order('user_id')
    if (usersError) { showToast(usersError.message,'error'); setLoading(false); return }

    // Fetch doctors from doctor table
    const { data:doctors, error:doctorsError } = await supabase.from('doctor').select('*').order('doctor_id')
    if (doctorsError) { showToast(doctorsError.message,'error') }

    // Combine: mark doctors with a _type field
    const patientRows = (users||[]).map(u => ({ ...u, _type: u.is_admin?'admin':'patient' }))
    const doctorRows  = (doctors||[]).map(d => ({ user_id: d.doctor_id, name: d.name, email: d.email, phone: d.phone||'—', age: '—', gender: '—', is_admin: false, is_doctor: true, _type:'doctor', _doctor_id: d.doctor_id }))

    setData([...patientRows, ...doctorRows])
    setLoading(false)
  }, [showToast])

  useEffect(() => { load() }, [load])

  const save = async () => {
    const payload = { name:form.name, phone:form.phone, age:parseInt(form.age)||0, gender:form.gender, email:form.email }
    const { error } = modal==='add'
      ? await supabase.from('users').insert(payload)
      : await supabase.from('users').update(payload).eq('user_id', form.user_id)
    if (error) return showToast(error.message,'error')
    showToast(modal==='add'?'User added!':'User updated!'); setModal(null); load()
  }

  const remove = async (u) => {
    if (!confirm(`Delete ${u.name}?`)) return
    if (u._type === 'doctor') {
      await supabase.from('doctor').delete().eq('doctor_id', u._doctor_id)
    } else {
      await supabase.from('users').delete().eq('user_id', u.user_id)
    }
    showToast('Deleted!'); load()
  }

  const getRoleBadge = u => {
    if (u._type==='admin')   return <span className="badge badge-yellow">👑 Admin</span>
    if (u._type==='doctor')  return <span className="badge badge-blue">🩺 Doctor</span>
    return <span className="badge badge-teal">👤 Patient</span>
  }

  const filtered = filter==='All' ? data : data.filter(u => u._type===filter.toLowerCase())

  return (
    <div>
      <div className="section-card">
        <div className="section-header">
          <div><div className="section-title">👥 All Users</div><div className="section-subtitle">{data.length} total — patients, doctors & admins</div></div>
          <div style={{ display:'flex', gap:8 }}>
            {['All','Patient','Doctor','Admin'].map(f => (
              <button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-ghost'}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
            <button className="btn btn-primary btn-sm" onClick={() => { setForm({ name:'',phone:'',age:'',gender:'Male',email:'' }); setModal('add') }}>+ Add User</button>
          </div>
        </div>
        {loading?<Loader/>:filtered.length===0?<Empty icon="👥" text="No users"/>:(
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Age</th><th>Gender</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
            <tbody>{filtered.map((u,i) => (
              <tr key={`${u._type}-${u.user_id}-${i}`}>
                <td>#{u.user_id}</td>
                <td><strong>{u.name}</strong></td>
                <td>{u.phone||'—'}</td>
                <td>{u.age||'—'}</td>
                <td>{u.gender && u.gender!=='—' ? <span className={`badge ${u.gender==='Male'?'badge-blue':'badge-purple'}`}>{u.gender}</span> : '—'}</td>
                <td>{u.email}</td>
                <td>{getRoleBadge(u)}</td>
                <td style={{ display:'flex', gap:6 }}>
                  {u._type !== 'doctor' && <button className="btn btn-ghost btn-sm" onClick={() => { setForm(u); setModal('edit') }}>✏️</button>}
                  <button className="btn btn-danger btn-sm" onClick={() => remove(u)}>🗑️</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {modal && (
        <Modal title={modal==='add'?'➕ Add User':'✏️ Edit User'} onClose={() => setModal(null)}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone||''} onChange={e => setForm({...form,phone:e.target.value})}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Age</label><input className="form-input" type="number" value={form.age||''} onChange={e => setForm({...form,age:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">Gender</label><select className="form-input" value={form.gender||'Male'} onChange={e => setForm({...form,gender:e.target.value})}><option>Male</option><option>Female</option><option>Other</option></select></div>
          </div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={form.email||''} onChange={e => setForm({...form,email:e.target.value})}/></div>
          <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>{modal==='add'?'Add':'Save'}</button></div>
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
    await supabase.from('doctor').delete().eq('doctor_id',id)
    showToast('Deleted!'); load()
  }
  return (
    <div>
      <div className="section-card">
        <div className="section-header"><div><div className="section-title">🩺 All Doctors</div></div><button className="btn btn-primary btn-sm" onClick={() => { setForm({ name:'',specialization:'',email:'',phone:'' }); setModal(true) }}>+ Add Doctor</button></div>
        {loading?<Loader/>:data.length===0?<Empty icon="🩺" text="No doctors"/>:(
          <div className="doctor-grid">
            {data.map((d,i) => (
              <div key={d.doctor_id} className="doctor-card">
                <div className="doctor-card-accent" style={{ background:getDoctorAccent(i) }}></div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginTop:8 }}>
                  <div className="doctor-avatar" style={{ background:`linear-gradient(135deg, ${getDoctorAccent(i)}33, ${getDoctorAccent(i)}55)`, color:getDoctorAccent(i) }}>{getInitials(d.name)}</div>
                  <div style={{ display:'flex', gap:6 }}><button className="btn btn-danger btn-sm" onClick={() => remove(d.doctor_id)}>🗑️</button></div>
                </div>
                <div className="doctor-name">{d.name}</div><div className="doctor-spec">{d.specialization}</div>
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
    showToast('Added!'); setModal(false); load()
  }
  const remove = async (id) => {
    if (!confirm(`Delete #${id}?`)) return
    await supabase.from('prescription').delete().eq('prescription_id',id)
    showToast('Deleted!'); load()
  }
  return (
    <div>
      <div className="section-card">
        <div className="section-header"><div><div className="section-title">📋 All Prescriptions</div></div><button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Add</button></div>
        {loading?<Loader/>:data.length===0?<Empty icon="📋" text="No prescriptions"/>:(
          <table>
            <thead><tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Notes</th><th>Del</th></tr></thead>
            <tbody>{data.map(p => (
              <tr key={p.prescription_id}>
                <td><strong>#RX-{String(p.prescription_id).padStart(4,'0')}</strong></td>
                <td>{p.users?.name||'—'}</td><td>{p.doctor?.name||'—'}</td><td>{p.date_issued}</td>
                <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.notes||'—'}</td>
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
          <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={form.date_issued} onChange={e => setForm({...form,date_issued:e.target.value})}/></div>
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
  const [filter, setFilter] = useState('All')
  const [form, setForm] = useState({ name:'', brand:'', type:'Tablet', description:'', prescription_id:'' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data:d, error } = await supabase.from('medicine').select('medicine_id,name,brand,type,description,prescription_id,status,added_by_user').order('medicine_id')
    if (error) showToast(error.message,'error'); else setData(d)
    setLoading(false)
  }, [showToast])
  useEffect(() => { load() }, [load])

  const save = async () => {
    const { error } = await supabase.from('medicine').insert({ ...form, prescription_id:form.prescription_id?parseInt(form.prescription_id):null, status:'Active', added_by_user:false })
    if (error) return showToast(error.message,'error')
    showToast('Medicine added!'); setModal(false); load()
  }

  const approve = async (id) => {
    const { error } = await supabase.from('medicine').update({ status:'Active' }).eq('medicine_id', id)
    if (error) return showToast(error.message,'error')
    showToast('Medicine approved! ✅'); load()
  }

  const reject = async (id) => {
    if (!confirm('Reject this medicine request?')) return
    const { error } = await supabase.from('medicine').update({ status:'Rejected' }).eq('medicine_id', id)
    if (error) return showToast(error.message,'error')
    showToast('Medicine rejected.'); load()
  }

  const remove = async (id) => {
    if (!confirm('Delete this medicine?')) return
    await supabase.from('medicine').delete().eq('medicine_id', id)
    showToast('Deleted!'); load()
  }

  const pending = data.filter(m => m.status === 'Pending')
  const filtered = filter==='All'?data:filter==='Pending'?pending:data.filter(m=>(m.status||'Active')===filter)

  return (
    <div>
      {pending.length > 0 && (
        <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:12, padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:14, color:'#92400e', fontWeight:600 }}>⏳ {pending.length} medicine{pending.length>1?'s':''} waiting for your approval</div>
          <button className="btn btn-sm" style={{ background:'#f59e0b', color:'#fff', border:'none', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontWeight:600 }} onClick={() => setFilter('Pending')}>Review Now</button>
        </div>
      )}
      <div className="section-card">
        <div className="section-header">
          <div><div className="section-title">💊 All Medicines</div><div className="section-subtitle">Manage & approve medicine requests</div></div>
          <div style={{ display:'flex', gap:8 }}>
            {['All','Pending','Active','Rejected'].map(f => (
              <button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-ghost'}`} onClick={() => setFilter(f)}>
                {f==='Pending'&&pending.length>0?`⏳ Pending (${pending.length})`:f}
              </button>
            ))}
            <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Add</button>
          </div>
        </div>
        {loading?<Loader/>:filtered.length===0?<Empty icon="💊" text="No medicines"/>:(
          <div className="medicine-grid">
            {filtered.map((m,i) => (
              <div key={m.medicine_id} className="medicine-card" style={{ border:m.status==='Pending'?'2px solid #fde68a':'1px solid #e2e8f0' }}>
                <div className={`medicine-card-top ${getMedCardColor(i)}`}></div>
                <div className="medicine-card-body">
                  <div className="medicine-card-header">
                    <div><div className="medicine-card-name">{m.name}</div><div className="medicine-card-brand">{m.brand||'—'}</div></div>
                    <div className="medicine-card-actions">
                      {m.status==='Pending'?(
                        <>
                          <button className="btn btn-sm" style={{ background:'#dcfce7', color:'#16a34a', border:'none', borderRadius:8, padding:'4px 10px', cursor:'pointer', fontSize:12, fontWeight:700 }} onClick={() => approve(m.medicine_id)}>✅ Approve</button>
                          <button className="btn btn-sm" style={{ background:'#fef2f2', color:'#dc2626', border:'none', borderRadius:8, padding:'4px 10px', cursor:'pointer', fontSize:12, fontWeight:700 }} onClick={() => reject(m.medicine_id)}>❌ Reject</button>
                        </>
                      ):(<button className="btn btn-danger btn-sm" onClick={() => remove(m.medicine_id)}>Delete</button>)}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <span className="badge badge-blue">{m.type}</span>
                    {m.status==='Pending'&&<span className="badge badge-yellow">⏳ Pending</span>}
                    {(m.status==='Active'||!m.status)&&<span className="badge badge-green">Active</span>}
                    {m.status==='Rejected'&&<span className="badge badge-red">Rejected</span>}
                    {m.added_by_user&&<span className="badge badge-purple">Patient Request</span>}
                  </div>
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
            <div className="form-group"><label className="form-label">Type</label>
              <select className="form-input" value={form.type} onChange={e => setForm({...form,type:e.target.value})}>{['Tablet','Capsule','Inhaler','Syrup','Injection','Cream','Eye Drop'].map(t=><option key={t}>{t}</option>)}</select>
            </div>
            <div className="form-group"><label className="form-label">Prescription ID (optional)</label><input className="form-input" type="number" value={form.prescription_id} onChange={e => setForm({...form,prescription_id:e.target.value})}/></div>
          </div>
          <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={e => setForm({...form,description:e.target.value})}/></div>
          <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Add</button></div>
        </Modal>
      )}
    </div>
  )
}

function AdminDosages({ showToast }) {
  const [data, setData] = useState([])
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ medicine_id:'', amount:'', unit:'tablet', frequency:'Once daily' })
  const load = useCallback(async () => {
    setLoading(true)
    const [{ data:d },{ data:m }] = await Promise.all([
      supabase.from('dosage').select('dosage_id,medicine_id,amount,unit,frequency').order('dosage_id'),
      supabase.from('medicine').select('medicine_id,name').order('medicine_id'),
    ])
    setData(d||[]); setMedicines(m||[])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  const save = async () => {
    const { error } = await supabase.from('dosage').insert({ medicine_id:parseInt(form.medicine_id), amount:parseFloat(form.amount), unit:form.unit, frequency:form.frequency })
    if (error) return showToast(error.message,'error')
    showToast('Dosage added!'); setModal(false); load()
  }
  const remove = async (id) => {
    if (!confirm(`Delete dosage #${id}?`)) return
    await supabase.from('dosage').delete().eq('dosage_id',id)
    showToast('Deleted!'); load()
  }
  return (
    <div>
      <div className="section-card">
        <div className="section-header"><div><div className="section-title">💉 All Dosages</div><div className="section-subtitle">Manage medicine dosages</div></div><button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Add Dosage</button></div>
        {loading?<Loader/>:data.length===0?<Empty icon="💉" text="No dosages yet"/>:(
          <table>
            <thead><tr><th>ID</th><th>Medicine</th><th>Amount</th><th>Unit</th><th>Frequency</th><th>Del</th></tr></thead>
            <tbody>{data.map(d => (
              <tr key={d.dosage_id}>
                <td>#{d.dosage_id}</td>
                <td><strong>{medicines.find(m=>m.medicine_id===d.medicine_id)?.name||'—'}</strong></td>
                <td>{d.amount}</td><td>{d.unit}</td><td>{d.frequency}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => remove(d.dosage_id)}>🗑️</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {modal && (
        <Modal title="➕ Add Dosage" onClose={() => setModal(false)}>
          <div className="form-group"><label className="form-label">Medicine</label>
            <select className="form-input" value={form.medicine_id} onChange={e => setForm({...form,medicine_id:e.target.value})}>
              <option value="">Select medicine...</option>
              {medicines.map(m => <option key={m.medicine_id} value={m.medicine_id}>{m.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Amount</label><input className="form-input" type="number" placeholder="1" value={form.amount} onChange={e => setForm({...form,amount:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">Unit</label>
              <select className="form-input" value={form.unit} onChange={e => setForm({...form,unit:e.target.value})}>
                {['tablet','capsule','ml','mg','drop','puff','unit'].map(u=><option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">Frequency</label>
            <select className="form-input" value={form.frequency} onChange={e => setForm({...form,frequency:e.target.value})}>
              {['Once daily','Twice daily','Three times daily','Every 8 hours','Every 12 hours','Weekly','As needed'].map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Add Dosage</button></div>
        </Modal>
      )}
    </div>
  )
}

function AdminSchedules({ showToast }) {
  const [data, setData] = useState([])
  const [dosages, setDosages] = useState([])
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ dosage_id:'', start_date:today, end_date:'', time:'08:00' })
  const load = useCallback(async () => {
    setLoading(true)
    const [{ data:d },{ data:dos },{ data:m }] = await Promise.all([
      supabase.from('schedule').select('schedule_id,start_date,end_date,time,dosage(amount,unit,frequency,medicine(name))').order('schedule_id'),
      supabase.from('dosage').select('*'),
      supabase.from('medicine').select('medicine_id,name'),
    ])
    setData(d||[]); setDosages(dos||[]); setMedicines(m||[])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  const save = async () => {
    if (!form.dosage_id || !form.end_date) return showToast('Fill all fields','error')
    const { error } = await supabase.from('schedule').insert({ dosage_id:parseInt(form.dosage_id), start_date:form.start_date, end_date:form.end_date, time:form.time+':00' })
    if (error) return showToast(error.message,'error')
    showToast('Schedule added!'); setModal(false); load()
  }
  const remove = async (id) => {
    if (!confirm(`Delete schedule #${id}?`)) return
    await supabase.from('schedule').delete().eq('schedule_id',id)
    showToast('Deleted!'); load()
  }
  return (
    <div>
      <div className="section-card">
        <div className="section-header"><div><div className="section-title">📅 All Schedules</div><div className="section-subtitle">Manage medicine schedules</div></div><button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Add Schedule</button></div>
        {loading?<Loader/>:data.length===0?<Empty icon="📅" text="No schedules"/>:(
          <table>
            <thead><tr><th>ID</th><th>Medicine</th><th>Dosage</th><th>Freq</th><th>Start</th><th>End</th><th>Time</th><th>Status</th><th>Del</th></tr></thead>
            <tbody>{data.map(s => {
              const active = s.start_date<=today && s.end_date>=today
              return (
                <tr key={s.schedule_id}>
                  <td>#{s.schedule_id}</td><td><strong>{s.dosage?.medicine?.name||'—'}</strong></td>
                  <td>{s.dosage?.amount} {s.dosage?.unit}</td><td>{s.dosage?.frequency}</td>
                  <td>{s.start_date}</td><td>{s.end_date}</td>
                  <td><span className="badge badge-blue">{s.time?.slice(0,5)}</span></td>
                  <td><span className={`badge ${active?'badge-green':'badge-red'}`}>{active?'Active':'Ended'}</span></td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => remove(s.schedule_id)}>🗑️</button></td>
                </tr>
              )
            })}</tbody>
          </table>
        )}
      </div>
      {modal && (
        <Modal title="➕ Add Schedule" onClose={() => setModal(false)}>
          <div className="form-group"><label className="form-label">Dosage</label>
            <select className="form-input" value={form.dosage_id} onChange={e => setForm({...form,dosage_id:e.target.value})}>
              <option value="">Select dosage...</option>
              {dosages.map(d => { const med = medicines.find(m=>m.medicine_id===d.medicine_id); return <option key={d.dosage_id} value={d.dosage_id}>{med?.name} — {d.amount} {d.unit} ({d.frequency})</option> })}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Start Date</label><input className="form-input" type="date" value={form.start_date} onChange={e => setForm({...form,start_date:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">End Date</label><input className="form-input" type="date" value={form.end_date} onChange={e => setForm({...form,end_date:e.target.value})}/></div>
          </div>
          <div className="form-group"><label className="form-label">Time</label><input className="form-input" type="time" value={form.time} onChange={e => setForm({...form,time:e.target.value})}/></div>
          <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Add Schedule</button></div>
        </Modal>
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
    await supabase.from('reminder').update({ status:newStatus }).eq('reminder_id',id)
    showToast(`Reminder ${newStatus}!`); load()
  }
  const icons = { Daily:'⏰', Weekly:'💊', 'One-time':'🔔', Refill:'🛒' }
  return (
    <div className="section-card">
      <div className="section-header"><div><div className="section-title">🔔 All Reminders</div></div></div>
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
  const load = useCallback(async () => {
    setLoading(true)
    const { data:d, error } = await supabase.from('intake_log').select('log_id,schedule_id,date,time_taken,status').order('log_id',{ ascending:false }).limit(50)
    if (error) showToast(error.message,'error'); else setData(d)
    setLoading(false)
  }, [showToast])
  useEffect(() => { load() }, [load])
  const remove = async (id) => {
    if (!confirm(`Delete log #${id}?`)) return
    await supabase.from('intake_log').delete().eq('log_id',id)
    showToast('Deleted!'); load()
  }
  return (
    <div className="section-card">
      <div className="section-header"><div><div className="section-title">📝 All Intake Logs</div></div><button className="btn btn-ghost btn-sm" onClick={load}>↻</button></div>
      {loading?<Loader/>:data.length===0?<Empty icon="📝" text="No logs"/>:(
        <table>
          <thead><tr><th>Log ID</th><th>Schedule</th><th>Date</th><th>Time</th><th>Status</th><th>Del</th></tr></thead>
          <tbody>{data.map(l => (
            <tr key={l.log_id}><td><strong>#LOG-{String(l.log_id).padStart(3,'0')}</strong></td><td>SCH-{l.schedule_id}</td><td>{l.date}</td><td>{l.time_taken||'—'}</td>
              <td><span className={`badge ${l.status==='Taken'?'badge-green':'badge-red'}`}>{l.status}</span></td>
              <td><button className="btn btn-danger btn-sm" onClick={() => remove(l.log_id)}>🗑️</button></td></tr>
          ))}</tbody>
        </table>
      )}
    </div>
  )
}

// ── PAGE DEFINITIONS ─────────────────────────────
const ADMIN_PAGES = [
  { id:'dashboard',     label:'Dashboard',     icon:'🏠', section:'Main'     },
  { id:'users',         label:'Users',         icon:'👥', section:'Main'     },
  { id:'doctors',       label:'Doctors',       icon:'🩺', section:'Main'     },
  { id:'prescriptions', label:'Prescriptions', icon:'📋', section:'Medical'  },
  { id:'medicines',     label:'Medicines',     icon:'💊', section:'Medical'  },
  { id:'dosages',       label:'Dosages',       icon:'💉', section:'Medical'  },
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
  { id:'stats',         label:'My Stats',      icon:'📊', section:'Tracking'  },
  { id:'doctors',       label:'Doctors',       icon:'🩺', section:'Personal'  },
  { id:'profile',       label:'My Profile',    icon:'👤', section:'Personal'  },
]

// ── MAIN APP ─────────────────────────────────────
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
        setProfile(p); setPage('dashboard')
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
        case 'dosages':       return <AdminDosages       {...props} />
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
        case 'stats':         return <UserStats         {...props} />
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