'use client'
import { useState, useEffect } from 'react'
import { useTime } from '@/context/time'

interface StaffMember {
  id: string
  name: string
  role: string | null
  hourly_rate: number
  phone: string | null
  email: string | null
}

interface Shift {
  id: string
  staff_id: string
  shift_date: string
  hours_worked: number
  notes: string | null
  staff: { name: string; role: string | null }
}

const EMPTY_STAFF = { name: '', role: '', hourly_rate: '', phone: '', email: '' }

export default function StaffPage() {
  const { now } = useTime()
  const today = now.toISOString().split('T')[0]

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [tab, setTab] = useState<'staff' | 'shifts'>('staff')

  // staff form
  const [staffForm, setStaffForm] = useState({ ...EMPTY_STAFF })
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [staffPanelOpen, setStaffPanelOpen] = useState(false)

  // shift form
  const [shiftStaffId, setShiftStaffId] = useState('')
  const [shiftDate, setShiftDate] = useState(today)
  const [shiftHours, setShiftHours] = useState('')
  const [shiftNotes, setShiftNotes] = useState('')
  const [shiftPanelOpen, setShiftPanelOpen] = useState(false)

  // date range for shifts
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(now); d.setDate(d.getDate() - 6); return d.toISOString().split('T')[0]
  })
  const [toDate, setToDate] = useState(today)

  useEffect(() => {
    async function init() {
      await Promise.all([loadStaff(), loadShifts()])
    }
    init()
  }, [])

  async function loadStaff() {
    const res = await fetch('/api/staff')
    setStaff(await res.json())
  }

  async function loadShifts() {
    const res = await fetch(`/api/staff?type=shifts&from=${fromDate}&to=${toDate}`)
    setShifts(await res.json())
  }

  function openNewStaff() {
    setEditingStaff(null)
    setStaffForm({ ...EMPTY_STAFF })
    setStaffPanelOpen(true)
  }

  function openEditStaff(s: StaffMember) {
    setEditingStaff(s)
    setStaffForm({ name: s.name, role: s.role ?? '', hourly_rate: String(s.hourly_rate), phone: s.phone ?? '', email: s.email ?? '' })
    setStaffPanelOpen(true)
  }

  async function saveStaff() {
    const payload = { ...staffForm, hourly_rate: parseFloat(staffForm.hourly_rate) || 0 }
    if (editingStaff) {
      await fetch('/api/staff', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingStaff.id, ...payload }) })
    } else {
      await fetch('/api/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    await loadStaff()
    setStaffPanelOpen(false)
  }

  async function deleteStaff(id: string) {
    if (!confirm('Delete this staff member? Their shifts will also be removed.')) return
    await fetch('/api/staff', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    await loadStaff()
    setStaffPanelOpen(false)
  }

  async function addShift() {
    if (!shiftStaffId || !shiftHours) return
    await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'shift', staff_id: shiftStaffId, shift_date: shiftDate, hours_worked: parseFloat(shiftHours), notes: shiftNotes }),
    })
    await loadShifts()
    setShiftPanelOpen(false)
    setShiftHours('')
    setShiftNotes('')
  }

  async function deleteShift(id: string) {
    await fetch('/api/staff', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, type: 'shift' }) })
    await loadShifts()
  }

  // Labour cost summary
  const labourMap: Record<string, { name: string; hours: number; cost: number }> = {}
  for (const shift of shifts) {
    const member = staff.find((s) => s.id === shift.staff_id)
    if (!member) continue
    if (!labourMap[shift.staff_id]) labourMap[shift.staff_id] = { name: member.name, hours: 0, cost: 0 }
    labourMap[shift.staff_id].hours += shift.hours_worked
    labourMap[shift.staff_id].cost += shift.hours_worked * member.hourly_rate
  }
  const totalLabour = Object.values(labourMap).reduce((s, v) => s + v.cost, 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>Staff & Labour</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { setTab('staff'); openNewStaff() }} style={{ background: 'black', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 18px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
            + Add Staff
          </button>
          <button onClick={() => { setTab('shifts'); setShiftPanelOpen(true) }} style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 18px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
            + Log Shift
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f0f0f0', borderRadius: '8px', padding: '4px', width: 'fit-content' }}>
        {(['staff', 'shifts'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px',
            background: tab === t ? 'white' : 'transparent',
            color: tab === t ? 'black' : '#666',
            boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
          }}>
            {t === 'staff' ? 'Staff List' : 'Shifts'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {tab === 'staff' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {staff.map((s) => (
                <div key={s.id} onClick={() => openEditStaff(s)} style={{
                  background: 'white', borderRadius: '10px', padding: '14px 18px', cursor: 'pointer',
                  border: editingStaff?.id === s.id ? '2px solid #000' : '1px solid #e8e8e8',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{s.name}</div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                      {s.role && <span style={{ marginRight: '12px' }}>{s.role}</span>}
                      {[s.email, s.phone].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', fontSize: '16px' }}>£{s.hourly_rate.toFixed(2)}<span style={{ fontWeight: '400', fontSize: '12px', color: '#888' }}>/hr</span></div>
                  </div>
                </div>
              ))}
              {staff.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#999', background: 'white', borderRadius: '10px', border: '1px solid #e8e8e8' }}>No staff added yet.</div>}
            </div>
          )}

          {tab === 'shifts' && (
            <>
              {/* Date filter */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', background: 'white', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e8e8e8' }}>
                <label style={{ fontSize: '13px', color: '#666', fontWeight: '600' }}>From</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '13px' }} />
                <label style={{ fontSize: '13px', color: '#666', fontWeight: '600' }}>To</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '13px' }} />
                <button onClick={loadShifts} style={{ padding: '6px 14px', background: 'black', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Apply</button>
              </div>

              {/* Labour cost summary */}
              {shifts.length > 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px', color: '#166534' }}>Labour Cost Summary</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {Object.values(labourMap).map((v) => (
                      <div key={v.name} style={{ fontSize: '13px', color: '#166534' }}>
                        {v.name}: {v.hours.toFixed(1)}h → <strong>£{v.cost.toFixed(2)}</strong>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '15px', fontWeight: '700', color: '#166534' }}>Total: £{totalLabour.toFixed(2)}</div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {shifts.map((sh) => {
                  const member = staff.find((s) => s.id === sh.staff_id)
                  const cost = member ? sh.hours_worked * member.hourly_rate : 0
                  return (
                    <div key={sh.id} style={{ background: 'white', borderRadius: '10px', padding: '12px 18px', border: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{sh.staff?.name}</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          {new Date(sh.shift_date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                          {' · '}{sh.hours_worked}h
                          {sh.notes && <span style={{ color: '#888' }}> · {sh.notes}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontWeight: '700', fontSize: '15px' }}>£{cost.toFixed(2)}</div>
                        <button onClick={() => deleteShift(sh.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>×</button>
                      </div>
                    </div>
                  )
                })}
                {shifts.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#999', background: 'white', borderRadius: '10px', border: '1px solid #e8e8e8' }}>No shifts logged for this period.</div>}
              </div>
            </>
          )}
        </div>

        {/* Staff panel */}
        {tab === 'staff' && staffPanelOpen && (
          <div style={{ width: '340px', flexShrink: 0, background: 'white', borderRadius: '12px', border: '1px solid #e8e8e8', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', padding: '24px', position: 'sticky', top: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{editingStaff ? 'Edit Staff' : 'New Staff Member'}</h2>
              <button onClick={() => setStaffPanelOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#666' }}>×</button>
            </div>
            {[
              { key: 'name', label: 'Name *', placeholder: 'Full name' },
              { key: 'role', label: 'Role', placeholder: 'e.g. Chef, Waiter' },
              { key: 'hourly_rate', label: 'Hourly Rate (£)', placeholder: '12.50', type: 'number' },
              { key: 'phone', label: 'Phone', placeholder: '+44 7700 900000' },
              { key: 'email', label: 'Email', placeholder: 'email@example.com' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key} style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
                <input
                  type={type ?? 'text'}
                  value={(staffForm as Record<string, string>)[key]}
                  onChange={(e) => setStaffForm({ ...staffForm, [key]: e.target.value })}
                  placeholder={placeholder}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #e0e0e0', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px' }}>
              {editingStaff && (
                <button onClick={() => deleteStaff(editingStaff.id)} style={{ padding: '9px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Delete</button>
              )}
              <button onClick={() => setStaffPanelOpen(false)} style={{ flex: 1, padding: '9px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Cancel</button>
              <button onClick={saveStaff} disabled={!staffForm.name.trim()} style={{ flex: 2, padding: '9px', background: staffForm.name.trim() ? 'black' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', cursor: staffForm.name.trim() ? 'pointer' : 'default', fontWeight: '600', fontSize: '13px' }}>
                {editingStaff ? 'Save' : 'Add Staff'}
              </button>
            </div>
          </div>
        )}

        {/* Shift log panel */}
        {tab === 'shifts' && shiftPanelOpen && (
          <div style={{ width: '300px', flexShrink: 0, background: 'white', borderRadius: '12px', border: '1px solid #e8e8e8', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', padding: '24px', position: 'sticky', top: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Log Shift</h2>
              <button onClick={() => setShiftPanelOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#666' }}>×</button>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Staff Member *</label>
              <select value={shiftStaffId} onChange={(e) => setShiftStaffId(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #e0e0e0', fontSize: '14px', boxSizing: 'border-box' }}>
                <option value="">Select staff…</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}{s.role ? ` (${s.role})` : ''}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date *</label>
              <input type="date" value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #e0e0e0', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hours Worked *</label>
              <input type="number" min="0" step="0.5" value={shiftHours} onChange={(e) => setShiftHours(e.target.value)} placeholder="8" style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #e0e0e0', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</label>
              <input value={shiftNotes} onChange={(e) => setShiftNotes(e.target.value)} placeholder="Optional notes…" style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #e0e0e0', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            {shiftStaffId && shiftHours && (
              <div style={{ background: '#f8f8f8', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#555' }}>
                Cost: {parseFloat(shiftHours).toFixed(1)}h × £{staff.find((s) => s.id === shiftStaffId)?.hourly_rate.toFixed(2) ?? '0.00'}/hr =
                {' '}<strong>£{(parseFloat(shiftHours) * (staff.find((s) => s.id === shiftStaffId)?.hourly_rate ?? 0)).toFixed(2)}</strong>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShiftPanelOpen(false)} style={{ flex: 1, padding: '9px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Cancel</button>
              <button onClick={addShift} disabled={!shiftStaffId || !shiftHours} style={{ flex: 2, padding: '9px', background: shiftStaffId && shiftHours ? '#4f46e5' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', cursor: shiftStaffId && shiftHours ? 'pointer' : 'default', fontWeight: '600', fontSize: '13px' }}>
                Log Shift
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
