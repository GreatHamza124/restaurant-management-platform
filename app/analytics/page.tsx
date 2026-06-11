'use client'
import { useState, useEffect } from 'react'
import { useTime } from '@/context/time'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'

interface DayData { date: string; revenue: number; covers: number }
interface ItemData { name: string; category: string | null; qty: number; revenue: number }
interface SessionData { name: string; count: number }

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6']

const PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
]

function fmt(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function AnalyticsPage() {
  const { now } = useTime()
  const today = now.toISOString().split('T')[0]

  const [from, setFrom] = useState(() => {
    const d = new Date(now); d.setDate(d.getDate() - 29); return d.toISOString().split('T')[0]
  })
  const [to, setTo] = useState(today)
  const [data, setData] = useState<{
    revenueTrend: DayData[]; topItems: ItemData[]; sessions: SessionData[];
    totalRevenue: number; totalCovers: number; totalBookings: number; avgPartySize: number
  } | null>(null)

  useEffect(() => {
    async function init() { await load() }
    init()
  }, [])

  async function load() {
    const res = await fetch(`/api/analytics?from=${from}&to=${to}`)
    setData(await res.json())
  }

  function applyPreset(days: number) {
    const d = new Date(now); d.setDate(d.getDate() - (days - 1))
    setFrom(d.toISOString().split('T')[0])
    setTo(today)
  }

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: '22px', fontWeight: '700' }}>Analytics</h1>

      {/* Date range */}
      <div style={{ background: 'white', borderRadius: '10px', padding: '14px 18px', border: '1px solid #e8e8e8', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        {PRESETS.map((p) => (
          <button key={p.days} onClick={() => applyPreset(p.days)} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e0e0e0', background: '#f8f8f8', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
            {p.label}
          </button>
        ))}
        <div style={{ width: '1px', height: '24px', background: '#e0e0e0' }} />
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '13px' }} />
        <span style={{ color: '#888', fontSize: '13px' }}>to</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '13px' }} />
        <button onClick={load} style={{ padding: '6px 18px', background: 'black', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Apply</button>
      </div>

      {!data ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>Loading…</div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Total Revenue', value: `£${data.totalRevenue.toFixed(2)}` },
              { label: 'Total Bookings', value: data.totalBookings },
              { label: 'Total Covers', value: data.totalCovers },
              { label: 'Avg Party Size', value: data.avgPartySize.toFixed(1) },
            ].map((card) => (
              <div key={card.label} style={{ background: 'white', borderRadius: '10px', padding: '18px 20px', border: '1px solid #e8e8e8' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Revenue trend */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '20px', border: '1px solid #e8e8e8', marginBottom: '24px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700' }}>Revenue Trend</h2>
            {data.revenueTrend.every((d) => d.revenue === 0) ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#999', fontSize: '14px' }}>No revenue data for this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.revenueTrend}>
                  <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `£${v}`} />
                  <Tooltip formatter={(v: number) => [`£${v.toFixed(2)}`, 'Revenue']} labelFormatter={fmt} />
                  <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Covers trend */}
            <div style={{ background: 'white', borderRadius: '10px', padding: '20px', border: '1px solid #e8e8e8' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700' }}>Covers per Day</h2>
              {data.revenueTrend.every((d) => d.covers === 0) ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#999', fontSize: '14px' }}>No covers data.</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.revenueTrend}>
                    <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={(v: number) => [v, 'Covers']} labelFormatter={fmt} />
                    <Bar dataKey="covers" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Session breakdown */}
            <div style={{ background: 'white', borderRadius: '10px', padding: '20px', border: '1px solid #e8e8e8' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700' }}>Session Breakdown</h2>
              {data.sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#999', fontSize: '14px' }}>No sessions data.</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.sessions} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {data.sessions.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v, 'Bookings']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top menu items */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '20px', border: '1px solid #e8e8e8' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700' }}>Top Menu Items by Quantity Sold</h2>
            {data.topItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#999', fontSize: '14px' }}>No order data for this period.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.topItems} layout="vertical" margin={{ left: 40 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
                    <Tooltip formatter={(v: number, name: string) => [name === 'qty' ? `${v} sold` : `£${(v as number).toFixed(2)}`, name === 'qty' ? 'Qty' : 'Revenue']} />
                    <Bar dataKey="qty" fill="#6366f1" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {data.topItems.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 12px', background: i % 2 === 0 ? '#f9f9f9' : 'white', borderRadius: '6px' }}>
                      <div>
                        <strong>{item.name}</strong>
                        {item.category && <span style={{ color: '#888', marginLeft: '8px' }}>{item.category}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '20px' }}>
                        <span style={{ color: '#666' }}>{item.qty} sold</span>
                        <span style={{ fontWeight: '600' }}>£{item.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
