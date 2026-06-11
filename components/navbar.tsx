'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useTime } from '@/context/time'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/bookings', label: 'Bookings' },
  { href: '/menu', label: 'Menu' },
  { href: '/market', label: 'Market Prices' },
  { href: '/customers', label: 'Customers' },
  { href: '/staff', label: 'Staff' },
  { href: '/analytics', label: 'Analytics' },
]

function pad(n: number) { return String(n).padStart(2, '0') }

export default function Navbar() {
  const pathname = usePathname()
  const { now, setNow } = useTime()
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  function openEdit() {
    const v = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
    setEditValue(v)
    setEditing(true)
  }

  function confirmEdit() {
    const d = new Date(editValue)
    if (!isNaN(d.getTime())) setNow(d)
    setEditing(false)
  }

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <nav style={{
      backgroundColor: '#1a1a1a', padding: '0 32px',
      display: 'flex', alignItems: 'center', height: '60px', gap: '0',
    }}>
      <span style={{ color: 'white', fontWeight: '700', fontSize: '16px', marginRight: '24px', whiteSpace: 'nowrap' }}>
        RestaurantOS
      </span>

      <div style={{ display: 'flex', gap: '2px', flex: 1, flexWrap: 'nowrap', overflow: 'hidden' }}>
        {links.map((link) => {
          const active = pathname === link.href
          return (
            <Link key={link.href} href={link.href} style={{
              color: active ? 'white' : '#888',
              textDecoration: 'none',
              fontSize: '13px',
              padding: '5px 10px',
              borderRadius: '6px',
              background: active ? '#333' : 'transparent',
              whiteSpace: 'nowrap',
            }}>
              {link.label}
            </Link>
          )
        })}
      </div>

      {/* Clock */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button onClick={openEdit} style={{
          background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: '8px',
          color: 'white', cursor: 'pointer', padding: '5px 14px', textAlign: 'right',
          lineHeight: 1.3,
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>{timeStr}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>{dateStr}</div>
        </button>

        {editing && (
          <>
            <div onClick={() => setEditing(false)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
            <div style={{
              position: 'absolute', right: 0, top: '110%', background: 'white',
              borderRadius: '10px', boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
              padding: '16px', zIndex: 1000, minWidth: '240px',
            }}>
              <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#666', fontWeight: '500' }}>Set current date & time</p>
              <input
                type="datetime-local"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #eee', borderRadius: '6px', boxSizing: 'border-box', marginBottom: '10px', fontSize: '14px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setEditing(false)} style={{ flex: 1, padding: '7px', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={confirmEdit} style={{ flex: 1, padding: '7px', background: 'black', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Set Time</button>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  )
}
