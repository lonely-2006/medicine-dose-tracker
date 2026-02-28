'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ── Toast ──────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{
      position:'fixed', bottom:24, right:24, zIndex:300,
      background:'var(--card)', border:`1px solid ${type==='success'?'rgba(0,212,170,0.4)':'rgba(255,107,107,0.4)'}`,
      borderRadius:10, padding:'14px 18px', fontSize:13, minWidth:260,
      boxShadow:'0 8px 32px rgba(0,0,0,0.4)', display:'flex', alignItems:'center', gap:10,
      animation:'slideIn 0.3s ease'
    }}>
      {type === 'success' ? '✅' : '❌'} {message}
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  )
}

// ── Loader ─────────────────────────────────────────────────
function Loader() {
  return <div className="loader"><div className="spinner"></div> Loading...</div>
}

// ── Empty ──────────────────────────────────────────────────
function Empty({ icon, text }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div>{text}</div>
}

// ════════════════════════════════════════════════════════════
// PAGE COMPONENTS
// ════════════════════════════════════════════════════════════

// ── Dashboard ─────────────────────────────────────────────
function Dashboard({ showToast }) {
  const [stats, setStats]   = useState({})
  const [scheds, setScheds] = useState([])
  const [missed, setMissed] = useState([])
  const [logs,   setLogs]   = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const [u, d, p, m] = await Promise.all([
      supabase.from('users').select('*',{count:'exact',head:true}),
      supabase.from('doctor').select('*',{count:'exact',head:true}),
      supabase.from('prescription').select('*',{count:'exact',head:true}),
      supabase.from('medicine').select('*',{count:'exact',head:true}),
    ])
    setStats({ users: u.count||0, doctors: d.count||0, prescriptions: p.count||0, medicines: m.count||0 })

    const { data: sc } = await supabase.from('schedule')
      .select('schedule_id,time,dosage(amount,unit,frequency,medicine(name,brand))')
      .lte('start_date', today).gte('end_date', today).limit(10)
    setScheds(sc || [])

    const { data: mi } = await supabase.from('intake_log')
      .select('*').eq('status','Missed').order('date',{ascending:false}).limit(5)
    setMissed(mi || [])

    const { data: lg } = await supabase.from('intake_log')
      .select('*').order('log_id',{ascending:false}).limit(8)
    setLogs(lg || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const statCards = [
    { label:'Total Users', value: stats.users, icon:'👥', accent:'#00d4aa' },
    { label:'Doctors',     value: stats.doctors, icon:'🩺', accent:'#4fa3e0' },
    { label:'Prescriptions', value: stats.prescriptions, icon:'📋', accent:'#ffd166' },
    { label:'Medicines',   value: stats.medicines, icon:'💊', accent:'#ff6b6b' },
  ]

  return (
    <div>
      <div className="stats-grid">
        {statCards.map(c => (
          <div key={c.label} className="stat-card" style={{'--accent':c.accent}}>
            <div className="stat-icon">{c.icon}</div>
            <div className="stat-value">{loading ? '...' : c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="section-card">
          <div className="section-header">
            <div>
              <div className="section-title">📅 Today's Schedule</div>
              <div className="section-subtitle">Medicines due today</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
          </div>
          {loading ? <Loader /> : scheds.length === 0 ? <Empty icon="📭" text="No schedules for today" /> :
            <table>
              <thead><tr><th>Medicine</th><th>Brand</th><th>Dosage</th><th>Time</th></tr></thead>
              <tbody>{scheds.map(s => (
                <tr key={s.schedule_id}>
                  <td>#{s.schedule_id}</td>
                  <td><strong>{s.dosage?.medicine?.name||'—'}</strong></td>
                  <td>{s.dosage?.medicine?.brand||'—'}</td>
                  <td>{s.dosage?.amount} {s.dosage?.unit} · {s.dosage?.frequency}</td>
                  <td><span className="badge badge-blue">{s.time}</span></td>
                </tr>
              ))}</tbody>
            </table>
          }
        </div>

        <div className="section-card">
          <div className="section-header">
            <div>
              <div className="section-title">⚠️ Missed Doses</div>
              <div className="section-subtitle">Recent missed intakes</div>
            </div>
          </div>
          {loading ? <Loader /> : missed.length === 0 ? <Empty icon="✅" text="No missed doses!" /> :
            <table>
              <thead><tr><th>Log ID</th><th>Schedule</th><th>Date</th></tr></thead>
              <tbody>{missed.map(m => (
                <tr key={m.log_id}>
                  <td>#{m.log_id}</td>
                  <td>SCH-{m.schedule_id}</td>
                  <td>{m.date}</td>
                </tr>
              ))}</tbody>
            </table>
          }
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <div>
            <div className="section-title">📝 Recent Intake Log</div>
            <div className="section-subtitle">Latest dose records</div>
          </div>
        </div>
        {loading ? <Loader /> : logs.length === 0 ? <Empty icon="📭" text="No logs yet" /> :
          <table>
            <thead><tr><th>Log ID</th><th>Schedule</th><th>Date</th><th>Time Taken</th><th>Status</th></tr></thead>
            <tbody>{logs.map(l => (
              <tr key={l.log_id}>
                <td>#{l.log_id}</td>
                <td>SCH-{l.schedule_id}</td>
                <td>{l.date}</td>
                <td>{l.time_taken||'—'}</td>
                <td><span className={`badge ${l.status==='Taken'?'badge-green':'badge-red'}`}>{l.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        }
      </div>
    </div>
  )
}

// ── Users ──────────────────────────────────────────────────
function Users({ showToast }) {
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(null) // 'add' | {edit user}
  const [form, setForm]     = useState({ name:'', phone:'', age:'', gender:'Male', email:'' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data: d, error } = await supabase.from('users').select('*').order('user_id')
    if (error) showToast(error.message, 'error')
    else setData(d)
    setLoading(false)
  }, [showToast])

  useEffect(() => { load() }, [load])

  const openAdd  = () => { setForm({ name:'', phone:'', age:'', gender:'Male', email:'' }); setModal('add') }
  const openEdit = (u)  => { setForm(u); setModal('edit') }

  const save = async () => {
    const payload = { name: form.name, phone: form.phone, age: parseInt(form.age), gender: form.gender, email: form.email }
    const { error } = modal === 'add'
      ? await supabase.from('users').insert(payload)
      : await supabase.from('users').update(payload).eq('user_id', form.user_id)
    if (error) return showToast(error.message, 'error')
    showToast(modal === 'add' ? 'User added!' : 'User updated!')
    setModal(null); load()
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
          <div>
            <div className="section-title">👥 Users</div>
            <div className="section-subtitle">All registered patients</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add User</button>
        </div>
        {loading ? <Loader /> : data.length === 0 ? <Empty icon="👥" text="No users found" /> :
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Age</th><th>Gender</th><th>Email</th><th>Actions</th></tr></thead>
            <tbody>{data.map(u => (
              <tr key={u.user_id}>
                <td>#{u.user_id}</td>
                <td><strong>{u.name}</strong></td>
                <td>{u.phone}</td>
                <td>{u.age}</td>
                <td><span className={`badge ${u.gender==='Male'?'badge-blue':'badge-yellow'}`}>{u.gender}</span></td>
                <td>{u.email}</td>
                <td style={{display:'flex', gap:6}}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>✏️ Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(u.user_id)}>🗑️</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        }
      </div>

      {modal && (
        <Modal title={modal==='add'?'➕ Add New User':'✏️ Edit User'} onClose={() => setModal(null)}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Arjun Menon" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} placeholder="9876543201" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Age</label>
              <input className="form-input" type="number" value={form.age} onChange={e => setForm({...form, age:e.target.value})} placeholder="25" />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-input" value={form.gender} onChange={e => setForm({...form, gender:e.target.value})}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Gmail</label>
            <input className="form-input" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="arjun@gmail.com" />
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>{modal==='add'?'Add User':'Save Changes'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Doctors ────────────────────────────────────────────────
function Doctors({ showToast }) {
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState({ name:'', specialization:'', email:'', phone:'' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data: d, error } = await supabase.from('doctor').select('*').order('doctor_id')
    if (error) showToast(error.message, 'error')
    else setData(d)
    setLoading(false)
  }, [showToast])

  useEffect(() => { load() }, [load])

  const save = async () => {
    const { error } = await supabase.from('doctor').insert(form)
    if (error) return showToast(error.message, 'error')
    showToast('Doctor added!'); setModal(false); load()
  }

  const remove = async (id) => {
    if (!confirm(`Delete doctor #${id}? Trigger will block if prescriptions exist.`)) return
    const { error } = await supabase.from('doctor').delete().eq('doctor_id', id)
    if (error) return showToast('🛡️ ' + error.message, 'error')
    showToast('Doctor deleted!'); load()
  }

  return (
    <div>
      <div className="section-card">
        <div className="section-header">
          <div>
            <div className="section-title">🩺 Doctors</div>
            <div className="section-subtitle">All registered doctors</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setForm({ name:'', specialization:'', email:'', phone:'' }); setModal(true) }}>+ Add Doctor</button>
        </div>
        {loading ? <Loader /> : data.length === 0 ? <Empty icon="🩺" text="No doctors found" /> :
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Specialization</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
            <tbody>{data.map(d => (
              <tr key={d.doctor_id}>
                <td>#{d.doctor_id}</td>
                <td><strong>{d.name}</strong></td>
                <td><span className="badge badge-blue">{d.specialization}</span></td>
                <td>{d.email}</td>
                <td>{d.phone}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => remove(d.doctor_id)}>🗑️ Delete</button></td>
              </tr>
            ))}</tbody>
          </table>
        }
      </div>
      {modal && (
        <Modal title="➕ Add New Doctor" onClose={() => setModal(false)}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Dr. Anil Kumar" />
            </div>
            <div className="form-group">
              <label className="form-label">Specialization</label>
              <input className="form-input" value={form.specialization} onChange={e => setForm({...form, specialization:e.target.value})} placeholder="Cardiology" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Gmail</label>
              <input className="form-input" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="anil@gmail.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} placeholder="9111111101" />
            </div>
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

// ── Prescriptions ──────────────────────────────────────────
function Prescriptions({ showToast }) {
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm]     = useState({ user_id:'', doctor_id:'', date_issued: today, notes:'' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data: d, error } = await supabase.from('prescription')
      .select('*, users(name), doctor(name)').order('prescription_id')
    if (error) showToast(error.message, 'error')
    else setData(d)
    setLoading(false)
  }, [showToast])

  useEffect(() => { load() }, [load])

  const save = async () => {
    const { error } = await supabase.from('prescription').insert({
      ...form, user_id: parseInt(form.user_id), doctor_id: parseInt(form.doctor_id)
    })
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
          <div>
            <div className="section-title">📋 Prescriptions</div>
            <div className="section-subtitle">All prescriptions issued</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Add Prescription</button>
        </div>
        {loading ? <Loader /> : data.length === 0 ? <Empty icon="📋" text="No prescriptions" /> :
          <table>
            <thead><tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date Issued</th><th>Notes</th><th>Actions</th></tr></thead>
            <tbody>{data.map(p => (
              <tr key={p.prescription_id}>
                <td>#{p.prescription_id}</td>
                <td><strong>{p.users?.name||'—'}</strong></td>
                <td>{p.doctor?.name||'—'}</td>
                <td>{p.date_issued}</td>
                <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.notes||'—'}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => remove(p.prescription_id)}>🗑️</button></td>
              </tr>
            ))}</tbody>
          </table>
        }
      </div>
      {modal && (
        <Modal title="➕ Add Prescription" onClose={() => setModal(false)}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">User ID</label>
              <input className="form-input" type="number" value={form.user_id} onChange={e => setForm({...form, user_id:e.target.value})} placeholder="1" />
            </div>
            <div className="form-group">
              <label className="form-label">Doctor ID</label>
              <input className="form-input" type="number" value={form.doctor_id} onChange={e => setForm({...form, doctor_id:e.target.value})} placeholder="1" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Date Issued</label>
            <input className="form-input" type="date" value={form.date_issued} onChange={e => setForm({...form, date_issued:e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-input" value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} placeholder="Take after food" />
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Add Prescription</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Medicines ──────────────────────────────────────────────
function Medicines({ showToast }) {
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState({ name:'', brand:'', type:'Tablet', description:'', prescription_id:'' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data: d, error } = await supabase.from('medicine').select('*').order('medicine_id')
    if (error) showToast(error.message, 'error')
    else setData(d)
    setLoading(false)
  }, [showToast])

  useEffect(() => { load() }, [load])

  const save = async () => {
    const { error } = await supabase.from('medicine').insert({
      ...form, prescription_id: parseInt(form.prescription_id)
    })
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
          <div>
            <div className="section-title">💉 Medicines</div>
            <div className="section-subtitle">All medicines in the system</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Add Medicine</button>
        </div>
        {loading ? <Loader /> : data.length === 0 ? <Empty icon="💊" text="No medicines" /> :
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Brand</th><th>Type</th><th>Description</th><th>Prescription</th><th>Actions</th></tr></thead>
            <tbody>{data.map(m => (
              <tr key={m.medicine_id}>
                <td>#{m.medicine_id}</td>
                <td><strong>{m.name}</strong></td>
                <td>{m.brand}</td>
                <td><span className="badge badge-green">{m.type}</span></td>
                <td style={{maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.description||'—'}</td>
                <td>PRE-{m.prescription_id}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => remove(m.medicine_id)}>🗑️</button></td>
              </tr>
            ))}</tbody>
          </table>
        }
      </div>
      {modal && (
        <Modal title="➕ Add Medicine" onClose={() => setModal(false)}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Medicine Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Metformin" />
            </div>
            <div className="form-group">
              <label className="form-label">Brand</label>
              <input className="form-input" value={form.brand} onChange={e => setForm({...form, brand:e.target.value})} placeholder="Glucophage" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-input" value={form.type} onChange={e => setForm({...form, type:e.target.value})}>
                {['Tablet','Capsule','Inhaler','Syrup','Injection','Cream','Eye Drop'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Prescription ID</label>
              <input className="form-input" type="number" value={form.prescription_id} onChange={e => setForm({...form, prescription_id:e.target.value})} placeholder="1" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="Controls blood sugar" />
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Add Medicine</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Schedules ──────────────────────────────────────────────
function Schedules({ showToast }) {
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    setLoading(true)
    const { data: d, error } = await supabase.from('schedule')
      .select('*, dosage(amount,unit,frequency,medicine(name))').order('schedule_id')
    if (error) showToast(error.message, 'error')
    else setData(d)
    setLoading(false)
  }, [showToast])

  useEffect(() => { load() }, [load])

  return (
    <div className="section-card">
      <div className="section-header">
        <div>
          <div className="section-title">📅 Schedules</div>
          <div className="section-subtitle">All medicine schedules</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
      </div>
      {loading ? <Loader /> : data.length === 0 ? <Empty icon="📅" text="No schedules" /> :
        <table>
          <thead><tr><th>ID</th><th>Medicine</th><th>Dosage</th><th>Start</th><th>End</th><th>Time</th><th>Status</th></tr></thead>
          <tbody>{data.map(s => {
            const active = s.start_date <= today && s.end_date >= today
            return (
              <tr key={s.schedule_id}>
                <td>#{s.schedule_id}</td>
                <td><strong>{s.dosage?.medicine?.name||'—'}</strong></td>
                <td>{s.dosage?.amount} {s.dosage?.unit} · {s.dosage?.frequency}</td>
                <td>{s.start_date}</td>
                <td>{s.end_date}</td>
                <td><span className="badge badge-blue">{s.time}</span></td>
                <td><span className={`badge ${active?'badge-green':'badge-red'}`}>{active?'Active':'Ended'}</span></td>
              </tr>
            )
          })}</tbody>
        </table>
      }
    </div>
  )
}

// ── Reminders ──────────────────────────────────────────────
function Reminders({ showToast }) {
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: d, error } = await supabase.from('reminder').select('*').order('reminder_id')
    if (error) showToast(error.message, 'error')
    else setData(d)
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
      <div className="section-header">
        <div>
          <div className="section-title">🔔 Reminders</div>
          <div className="section-subtitle">Manage all reminders</div>
        </div>
      </div>
      {loading ? <Loader /> : data.length === 0 ? <Empty icon="🔔" text="No reminders" /> :
        <table>
          <thead><tr><th>ID</th><th>Schedule</th><th>Mode</th><th>Reminder Time</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{data.map(r => (
            <tr key={r.reminder_id}>
              <td>#{r.reminder_id}</td>
              <td>SCH-{r.schedule_id}</td>
              <td><span className="badge badge-blue">{r.mode}</span></td>
              <td>{r.reminder_time}</td>
              <td><span className={`badge ${r.status==='Active'?'badge-green':'badge-red'}`}>{r.status}</span></td>
              <td>
                <button className="btn btn-ghost btn-sm" onClick={() => toggle(r.reminder_id, r.status)}>
                  {r.status === 'Active' ? '🔕 Deactivate' : '🔔 Activate'}
                </button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      }
    </div>
  )
}

// ── Intake Log ─────────────────────────────────────────────
function IntakeLogs({ showToast }) {
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm]     = useState({ schedule_id:'', date: today, time_taken:'', status:'Taken' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data: d, error } = await supabase.from('intake_log')
      .select('*').order('log_id',{ascending:false}).limit(50)
    if (error) showToast(error.message, 'error')
    else setData(d)
    setLoading(false)
  }, [showToast])

  useEffect(() => { load() }, [load])

  const save = async () => {
    const { error } = await supabase.from('intake_log').insert({
      schedule_id: parseInt(form.schedule_id),
      date: form.date,
      time_taken: form.status === 'Taken' ? (form.time_taken || null) : null,
      status: form.status
    })
    if (error) return showToast(error.message, 'error')
    showToast('Dose logged!'); setModal(false); load()
  }

  const remove = async (id) => {
    if (!confirm(`Delete log #${id}?`)) return
    const { error } = await supabase.from('intake_log').delete().eq('log_id', id)
    if (error) return showToast(error.message, 'error')
    showToast('Log deleted!'); load()
  }

  return (
    <div>
      <div className="section-card">
        <div className="section-header">
          <div>
            <div className="section-title">📝 Intake Log</div>
            <div className="section-subtitle">All dose intake records</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Log Dose</button>
        </div>
        {loading ? <Loader /> : data.length === 0 ? <Empty icon="📝" text="No intake logs" /> :
          <table>
            <thead><tr><th>Log ID</th><th>Schedule</th><th>Date</th><th>Time Taken</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{data.map(l => (
              <tr key={l.log_id}>
                <td>#{l.log_id}</td>
                <td>SCH-{l.schedule_id}</td>
                <td>{l.date}</td>
                <td>{l.time_taken||'—'}</td>
                <td><span className={`badge ${l.status==='Taken'?'badge-green':'badge-red'}`}>{l.status}</span></td>
                <td><button className="btn btn-danger btn-sm" onClick={() => remove(l.log_id)}>🗑️</button></td>
              </tr>
            ))}</tbody>
          </table>
        }
      </div>
      {modal && (
        <Modal title="📝 Log Dose Intake" onClose={() => setModal(false)}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Schedule ID</label>
              <input className="form-input" type="number" value={form.schedule_id} onChange={e => setForm({...form, schedule_id:e.target.value})} placeholder="1" />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={form.date} onChange={e => setForm({...form, date:e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Time Taken</label>
              <input className="form-input" type="time" value={form.time_taken} onChange={e => setForm({...form, time_taken:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => setForm({...form, status:e.target.value})}>
                <option>Taken</option><option>Missed</option>
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

// ════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════
const PAGES = [
  { id:'dashboard',     label:'Dashboard',     icon:'🏠', section:'Main'    },
  { id:'users',         label:'Users',         icon:'👥', section:'Main'    },
  { id:'doctors',       label:'Doctors',       icon:'🩺', section:'Main'    },
  { id:'prescriptions', label:'Prescriptions', icon:'📋', section:'Medical' },
  { id:'medicines',     label:'Medicines',     icon:'💉', section:'Medical' },
  { id:'schedules',     label:'Schedules',     icon:'📅', section:'Medical' },
  { id:'reminders',     label:'Reminders',     icon:'🔔', section:'Tracking'},
  { id:'intakelogs',    label:'Intake Log',    icon:'📝', section:'Tracking'},
]

export default function App() {
  const [page, setPage]   = useState('dashboard')
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type='success') => {
    setToast({ message, type })
  }, [])

  const renderPage = () => {
    const props = { showToast }
    switch(page) {
      case 'dashboard':     return <Dashboard     {...props} />
      case 'users':         return <Users         {...props} />
      case 'doctors':       return <Doctors       {...props} />
      case 'prescriptions': return <Prescriptions {...props} />
      case 'medicines':     return <Medicines     {...props} />
      case 'schedules':     return <Schedules     {...props} />
      case 'reminders':     return <Reminders     {...props} />
      case 'intakelogs':    return <IntakeLogs    {...props} />
      default:              return <Dashboard     {...props} />
    }
  }

  const sections = [...new Set(PAGES.map(p => p.section))]
  const currentPage = PAGES.find(p => p.id === page)

  return (
    <div style={{display:'flex'}}>
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <div className="logo-icon">💊</div>
          <div className="logo-text">DOSE TRACKER</div>
          <div className="logo-sub">Medicine Management</div>
        </div>
        <nav className="nav">
          {sections.map(section => (
            <div key={section}>
              <div className="nav-section">{section}</div>
              {PAGES.filter(p => p.section === section).map(p => (
                <button
                  key={p.id}
                  className={`nav-item ${page === p.id ? 'active' : ''}`}
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
          🟢 Connected
          <span>Supabase Live</span>
        </div>
      </div>

      {/* Main */}
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">{currentPage?.label}</div>
          <div className="topbar-right">
            <div className="status-dot"></div>
            <div className="status-text">Supabase Live</div>
          </div>
        </div>
        <div className="content">
          {renderPage()}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}