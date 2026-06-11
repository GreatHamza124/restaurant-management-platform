'use client'
import { useState, useEffect } from 'react'

interface MenuItem { id: string; name: string; selling_price: number; category: string }
interface Booking { id: string; customer_name: string; party_size: number; booking_date: string; booking_time: string; status: string; total_amount: number }

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [form, setForm] = useState({
    customerName: '', customerEmail: '',
    partySize: '2', bookingDate: '', bookingTime: '7:00 PM'
  })

  useEffect(() => {
    fetch('/api/bookings').then(r => r.json()).then(setBookings)
    fetch('/api/menu').then(r => r.json()).then(setMenuItems)
  }, [])

  function updateQuantity(itemId: string, qty: number) {
    if (qty === 0) {
      const updated = { ...selectedItems }
      delete updated[itemId]
      setSelectedItems(updated)
    } else {
      setSelectedItems({ ...selectedItems, [itemId]: qty })
    }
  }

  const orderTotal = Object.entries(selectedItems).reduce((sum, [id, qty]) => {
    const item = menuItems.find(m => m.id === id)
    return sum + (item?.selling_price || 0) * qty
  }, 0)

  async function handleSubmit() {
    const items = Object.entries(selectedItems).map(([id, qty]) => {
      const item = menuItems.find(m => m.id === id)
      return { id, quantity: qty, price: item?.selling_price || 0 }
    })

    await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, partySize: Number(form.partySize), items })
    })

    const updated = await fetch('/api/bookings').then(r => r.json())
    setBookings(updated)
    setShowForm(false)
    setSelectedItems({})
    setForm({ customerName: '', customerEmail: '', partySize: '2', bookingDate: '', bookingTime: '7:00 PM' })
  }

  const times = ['12:00 PM', '12:30 PM', '1:00 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM']
  const statusColors: Record<string, string> = { confirmed: '#3b82f6', completed: '#22c55e', cancelled: '#ef4444' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Bookings</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 20px', background: 'black', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          {showForm ? 'Cancel' : '+ New Booking'}
        </button>
      </div>

      {/* New Booking Form */}
      {showForm && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0 }}>New Booking</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>Customer Name</label>
              <input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #eee', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>Email</label>
              <input value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #eee', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>Date</label>
              <input type="date" value={form.bookingDate} onChange={e => setForm({ ...form, bookingDate: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #eee', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>Time</label>
              <select value={form.bookingTime} onChange={e => setForm({ ...form, bookingTime: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #eee', borderRadius: '6px', boxSizing: 'border-box' }}>
                {times.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>Party Size</label>
              <input type="number" min="1" max="20" value={form.partySize}
                onChange={e => setForm({ ...form, partySize: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #eee', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
          </div>

          <h3>Pre-order Food</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {menuItems.filter(m => m).map(item => (
              <div key={item.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>{item.name}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>${item.selling_price}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => updateQuantity(item.id, (selectedItems[item.id] || 0) - 1)}
                    style={{ width: '24px', height: '24px', border: '1px solid #eee', borderRadius: '4px', cursor: 'pointer', background: 'white' }}>−</button>
                  <span style={{ fontSize: '14px', minWidth: '16px', textAlign: 'center' }}>{selectedItems[item.id] || 0}</span>
                  <button onClick={() => updateQuantity(item.id, (selectedItems[item.id] || 0) + 1)}
                    style={{ width: '24px', height: '24px', border: '1px solid #eee', borderRadius: '4px', cursor: 'pointer', background: 'white' }}>+</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontWeight: 'bold' }}>Order Total: ${orderTotal.toFixed(2)}</p>
            <button onClick={handleSubmit}
              style={{ padding: '10px 24px', background: 'black', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              Confirm Booking
            </button>
          </div>
        </div>
      )}

      {/* Bookings Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9f9f9' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px' }}>Customer</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px' }}>Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px' }}>Time</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px' }}>Party</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px' }}>Total</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '12px 16px', fontWeight: '500' }}>{booking.customer_name}</td>
                <td style={{ padding: '12px 16px', color: '#666' }}>{booking.booking_date}</td>
                <td style={{ padding: '12px 16px', color: '#666' }}>{booking.booking_time}</td>
                <td style={{ padding: '12px 16px' }}>{booking.party_size} guests</td>
                <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                  {booking.total_amount > 0 ? `$${booking.total_amount.toFixed(2)}` : '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                    backgroundColor: (statusColors[booking.status] || '#gray') + '20',
                    color: statusColors[booking.status] || '#666'
                  }}>
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}