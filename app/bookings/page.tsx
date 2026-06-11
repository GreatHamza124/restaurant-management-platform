'use client'
import { useState, useEffect, useRef } from 'react'
import { useTime } from '@/context/time'

interface Booking {
  id: string
  customer_name: string
  party_size: number
  booking_date: string
  booking_time: string
  session: string | null
  status: string
  table_name: string
  total_amount: number
}

interface MenuItem {
  id: string
  name: string
  category: string | null
  total_price: number
}

interface Customer {
  id: string
  name: string
  email: string | null
  important_note: string | null
}

interface Table {
  id: string
  seats: number
  x: number
  y: number
  w: number
  h: number
}

const TABLES: Table[] = [
  { id: 'A1', seats: 2, x: 3,  y: 6,  w: 11, h: 13 },
  { id: 'A2', seats: 2, x: 17, y: 6,  w: 11, h: 13 },
  { id: 'A3', seats: 2, x: 31, y: 6,  w: 11, h: 13 },
  { id: 'A4', seats: 2, x: 45, y: 6,  w: 11, h: 13 },
  { id: 'A5', seats: 2, x: 59, y: 6,  w: 11, h: 13 },
  { id: 'A6', seats: 2, x: 73, y: 6,  w: 11, h: 13 },
  { id: 'B1', seats: 4, x: 3,  y: 30, w: 17, h: 17 },
  { id: 'B2', seats: 4, x: 24, y: 30, w: 17, h: 17 },
  { id: 'B3', seats: 4, x: 45, y: 30, w: 17, h: 17 },
  { id: 'B4', seats: 4, x: 66, y: 30, w: 17, h: 17 },
  { id: 'C1', seats: 6, x: 3,  y: 60, w: 24, h: 18 },
  { id: 'C2', seats: 6, x: 33, y: 60, w: 24, h: 18 },
  { id: 'C3', seats: 6, x: 63, y: 60, w: 24, h: 18 },
  { id: 'D1', seats: 8, x: 5,  y: 83, w: 38, h: 13 },
  { id: 'D2', seats: 8, x: 52, y: 83, w: 38, h: 13 },
]

const SESSIONS = [
  { id: 'Breakfast', label: 'Breakfast', endHour: 11 },
  { id: 'Lunch',     label: 'Lunch',     endHour: 15 },
  { id: 'Dinner',    label: 'Dinner',    endHour: 22 },
]

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: '#dbeafe', text: '#3b82f6' },
  completed:  { bg: '#dcfce7', text: '#22c55e' },
  cancelled:  { bg: '#fee2e2', text: '#ef4444' },
}

const PRICE_PER_SEAT = 5

export default function Bookings() {
  const { now } = useTime()
  const today = now.toISOString().split('T')[0]

  const [date, setDate] = useState(today)
  const [session, setSession] = useState<string>('Dinner')
  const [bookedTables, setBookedTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orderQty, setOrderQty] = useState<Record<string, number>>({})

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({ customerName: '', customerEmail: '', time: '7:00 PM' })
  const [submitting, setSubmitting] = useState(false)

  // Determine which sessions are blocked (past) for today
  function isSessionBlocked(sess: { id: string; endHour: number }) {
    if (date !== today) return false
    return now.getHours() >= sess.endHour
  }

  // Pick first available session on mount / date change
  useEffect(() => {
    const available = SESSIONS.find((s) => !isSessionBlocked(s))
    setSession(available?.id ?? 'Dinner')
  }, [date, today])

  useEffect(() => {
    async function init() {
      const [menu, allBookings, cust] = await Promise.all([
        fetch('/api/menu').then((r) => r.json()),
        fetch('/api/bookings').then((r) => r.json()),
        fetch('/api/customers').then((r) => r.json()),
      ])
      setMenuItems(Array.isArray(menu) ? menu : [])
      setBookings(Array.isArray(allBookings) ? allBookings : [])
      setCustomers(Array.isArray(cust) ? cust : [])
    }
    init()
  }, [])

  useEffect(() => {
    async function fetchBooked() {
      const data = await fetch(`/api/bookings?date=${date}&session=${session}`).then((r) => r.json())
      setBookedTables(Array.isArray(data) ? data : [])
      setSelectedTable(null)
    }
    fetchBooked()
  }, [date, session])

  // Close suggestions on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleTableClick(tableId: string) {
    if (bookedTables.includes(tableId)) return
    setSelectedTable(tableId === selectedTable ? null : tableId)
  }

  function tableColor(tableId: string) {
    if (tableId === selectedTable) return '#f59e0b'
    if (bookedTables.includes(tableId)) return '#ef4444'
    return '#22c55e'
  }

  function selectCustomer(c: Customer) {
    setSelectedCustomer(c)
    setCustomerSearch(c.name)
    setForm((f) => ({ ...f, customerName: c.name, customerEmail: c.email ?? '' }))
    setShowSuggestions(false)
  }

  function clearCustomer() {
    setSelectedCustomer(null)
    setCustomerSearch('')
    setForm((f) => ({ ...f, customerName: '', customerEmail: '' }))
  }

  const suggestions = customerSearch.length >= 1
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.email ?? '').toLowerCase().includes(customerSearch.toLowerCase())
      ).slice(0, 6)
    : []

  const orderTotal = Object.entries(orderQty).reduce((sum, [id, qty]) => {
    const item = menuItems.find((m) => m.id === id)
    return sum + (item?.total_price ?? 0) * qty
  }, 0)

  const categorisedMenu = (() => {
    const named: Record<string, MenuItem[]> = {}
    const none: MenuItem[] = []
    for (const item of menuItems) {
      if (item.category) {
        if (!named[item.category]) named[item.category] = []
        named[item.category].push(item)
      } else {
        none.push(item)
      }
    }
    const groups = Object.keys(named).sort().map((cat) => ({ label: cat, items: named[cat] }))
    if (none.length > 0) groups.push({ label: 'No Category', items: none })
    return groups
  })()

  async function handleSubmit() {
    if (!selectedTable || !form.customerName.trim() || submitting) return
    const table = TABLES.find((t) => t.id === selectedTable)!
    setSubmitting(true)
    const items = Object.entries(orderQty)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({
        id,
        quantity: qty,
        price: menuItems.find((m) => m.id === id)?.total_price ?? 0,
      }))
    await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerId: selectedCustomer?.id ?? null,
        partySize: table.seats,
        bookingDate: date,
        bookingTime: form.time,
        tableName: selectedTable,
        items,
        session,
      }),
    })
    setSelectedTable(null)
    setOrderQty({})
    setForm({ customerName: '', customerEmail: '', time: '7:00 PM' })
    clearCustomer()
    setSubmitting(false)
    const [booked, allBookings] = await Promise.all([
      fetch(`/api/bookings?date=${date}&session=${session}`).then((r) => r.json()),
      fetch('/api/bookings').then((r) => r.json()),
    ])
    setBookedTables(Array.isArray(booked) ? booked : [])
    setBookings(Array.isArray(allBookings) ? allBookings : [])
  }

  const selectedTableInfo = TABLES.find((t) => t.id === selectedTable)
  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>Bookings</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '14px', color: '#666' }}>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value) }}
            style={{ padding: '8px 12px', border: '1px solid #eee', borderRadius: '8px', fontSize: '14px' }}
          />
          {/* Session selector */}
          <div style={{ display: 'flex', gap: '4px', background: '#f0f0f0', borderRadius: '8px', padding: '4px' }}>
            {SESSIONS.map((s) => {
              const blocked = isSessionBlocked(s)
              const active = session === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => !blocked && setSession(s.id)}
                  disabled={blocked}
                  title={blocked ? `${s.label} has already passed for today` : undefined}
                  style={{
                    padding: '5px 14px', borderRadius: '6px', border: 'none', cursor: blocked ? 'not-allowed' : 'pointer',
                    fontWeight: '600', fontSize: '13px',
                    background: active ? 'white' : 'transparent',
                    color: blocked ? '#bbb' : active ? 'black' : '#666',
                    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                    opacity: blocked ? 0.5 : 1,
                  }}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Floor Plan */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>
            Floor Plan — {displayDate}, {session}
          </h2>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#555' }}>
            {[['#22c55e', 'Available'], ['#ef4444', 'Booked'], ['#f59e0b', 'Selected']].map(([color, label]) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: color, borderRadius: '3px' }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', width: '100%', paddingBottom: '45%', background: '#f5f5f5', border: '3px solid #d0d0d0', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '80px', height: '6px', background: '#d0d0d0', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <span style={{ position: 'absolute', bottom: '8px', fontSize: '9px', color: '#aaa', letterSpacing: '2px', whiteSpace: 'nowrap' }}>ENTRANCE</span>
          </div>

          {TABLES.map((table) => {
            const booked = bookedTables.includes(table.id)
            const color = tableColor(table.id)
            return (
              <div
                key={table.id}
                onClick={() => handleTableClick(table.id)}
                title={booked ? `Table ${table.id} — already booked (${session})` : `Table ${table.id} — ${table.seats} seats`}
                style={{
                  position: 'absolute',
                  left: `${table.x}%`, top: `${table.y}%`,
                  width: `${table.w}%`, height: `${table.h}%`,
                  background: color, borderRadius: '5px',
                  cursor: booked ? 'not-allowed' : 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: '700', fontSize: '12px',
                  boxShadow: table.id === selectedTable ? '0 0 0 3px #d97706' : '0 1px 3px rgba(0,0,0,0.15)',
                  transition: 'background 0.15s, box-shadow 0.15s',
                  userSelect: 'none', gap: '2px',
                }}
              >
                <span>{table.id}</span>
                <span style={{ fontSize: '9px', opacity: 0.85, fontWeight: '400' }}>{table.seats}p</span>
              </div>
            )
          })}
        </div>

        {selectedTable && selectedTableInfo ? (
          <div style={{ marginTop: '14px', padding: '10px 16px', background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '8px', fontSize: '14px' }}>
            Selected: <strong>{displayDate} — {session} — Table {selectedTable}</strong> &nbsp;·&nbsp; {selectedTableInfo.seats} seats
          </div>
        ) : (
          <p style={{ marginTop: '12px', fontSize: '13px', color: '#999' }}>Click a green table to select it for a new booking.</p>
        )}
      </div>

      {/* Booking form */}
      {selectedTable && selectedTableInfo && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '2px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>New Booking — {displayDate}, {session}, Table {selectedTable}</h3>
            <div style={{ textAlign: 'right', fontSize: '13px', color: '#666' }}>
              <div>Table ({selectedTableInfo.seats} × £{PRICE_PER_SEAT}): <strong>£{(selectedTableInfo.seats * PRICE_PER_SEAT).toFixed(2)}</strong></div>
              {orderTotal > 0 && <div>Food pre-order: <strong>£{orderTotal.toFixed(2)}</strong></div>}
              <div style={{ marginTop: '4px', fontSize: '15px', color: '#111' }}>
                Total: <strong>£{(selectedTableInfo.seats * PRICE_PER_SEAT + orderTotal).toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Important note banner */}
          {selectedCustomer?.important_note && (
            <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '18px' }}>⚠</span>
              <div>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#856404' }}>Important Note — {selectedCustomer.name}</div>
                <div style={{ fontSize: '14px', color: '#856404', marginTop: '2px' }}>{selectedCustomer.important_note}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {/* Customer search */}
            <div ref={searchRef} style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                Customer Name *
                {selectedCustomer && (
                  <button onClick={clearCustomer} style={{ marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '12px' }}>✕ Clear</button>
                )}
              </label>
              <input
                value={selectedCustomer ? form.customerName : customerSearch}
                onChange={(e) => {
                  if (selectedCustomer) {
                    clearCustomer()
                  }
                  setCustomerSearch(e.target.value)
                  setForm((f) => ({ ...f, customerName: e.target.value }))
                  setShowSuggestions(true)
                }}
                onFocus={() => { if (!selectedCustomer) setShowSuggestions(true) }}
                placeholder="Search customers or type name…"
                style={{ width: '100%', padding: '8px 12px', border: `1px solid ${selectedCustomer ? '#22c55e' : '#eee'}`, borderRadius: '6px', boxSizing: 'border-box', background: selectedCustomer ? '#f0fdf4' : 'white' }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden', marginTop: '2px' }}>
                  {suggestions.map((c) => (
                    <div
                      key={c.id}
                      onMouseDown={() => selectCustomer(c)}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                    >
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{c.name}</div>
                      {c.email && <div style={{ fontSize: '12px', color: '#888' }}>{c.email}</div>}
                      {c.important_note && <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '2px' }}>⚠ {c.important_note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '4px' }}>Email</label>
              <input
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #eee', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '4px' }}>Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #eee', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Order section */}
          {menuItems.length > 0 && (
            <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '600' }}>Pre-order Food (optional)</h4>
              {categorisedMenu.map(({ label, items }) => (
                <div key={label} style={{ marginBottom: '16px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#999', letterSpacing: '0.05em' }}>{label}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {items.map((item) => {
                      const qty = orderQty[item.id] ?? 0
                      return (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: qty > 0 ? '#f0fdf4' : '#fafafa', borderRadius: '8px', border: `1px solid ${qty > 0 ? '#bbf7d0' : '#eee'}` }}>
                          <div>
                            <span style={{ fontWeight: '500', fontSize: '14px' }}>{item.name}</span>
                            <span style={{ marginLeft: '8px', color: '#22c55e', fontSize: '13px' }}>£{item.total_price.toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button onClick={() => setOrderQty((prev) => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] ?? 0) - 1) }))} style={{ width: '26px', height: '26px', border: '1px solid #eee', borderRadius: '4px', cursor: 'pointer', background: 'white', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                            <span style={{ minWidth: '20px', textAlign: 'center', fontSize: '14px', fontWeight: '500' }}>{qty}</span>
                            <button onClick={() => setOrderQty((prev) => ({ ...prev, [item.id]: (prev[item.id] ?? 0) + 1 }))} style={{ width: '26px', height: '26px', border: '1px solid #eee', borderRadius: '4px', cursor: 'pointer', background: 'white', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              {orderTotal > 0 && <p style={{ margin: '8px 0 0', fontWeight: '600', fontSize: '15px' }}>Order total: <span style={{ color: '#22c55e' }}>£{orderTotal.toFixed(2)}</span></p>}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={() => { setSelectedTable(null); setOrderQty({}); clearCustomer() }} style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.customerName.trim()}
              style={{ padding: '10px 24px', background: submitting ? '#999' : 'black', color: 'white', border: 'none', borderRadius: '8px', cursor: submitting ? 'default' : 'pointer' }}
            >
              {submitting ? 'Saving…' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}

      {/* Bookings list */}
      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: 0, padding: '16px 20px', borderBottom: '1px solid #eee', fontSize: '15px' }}>All Bookings</h3>
        {bookings.length === 0 ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No bookings yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9f9f9' }}>
                {['Customer', 'Date', 'Session', 'Time', 'Table', 'Party', 'Total', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const sc = STATUS_COLORS[b.status] ?? { bg: '#f3f4f6', text: '#666' }
                return (
                  <tr key={b.id} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500' }}>{b.customer_name}</td>
                    <td style={{ padding: '12px 16px', color: '#666' }}>{b.booking_date}</td>
                    <td style={{ padding: '12px 16px', color: '#666' }}>{b.session ?? '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#666' }}>{b.booking_time}</td>
                    <td style={{ padding: '12px 16px' }}>Table {b.table_name}</td>
                    <td style={{ padding: '12px 16px' }}>{b.party_size}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '600' }}>£{b.total_amount?.toFixed(2) ?? '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', background: sc.bg, color: sc.text }}>{b.status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
