'use client'
import { useState, useEffect } from 'react'
import StatCard from '@/components/StatCard'
import { useTime } from '@/context/time'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

interface DashboardData {
  totalRevenue: number
  totalExpenses: number
  totalProfit: number
  totalLabour: number
  chartData: { date: string; fullDate: string; revenue: number; expenses: number }[]
  todayBookings: number
  todayCovers: number
}

const PRESETS = [
  { label: 'Today',       getRange: (now: Date) => { const d = fmt(now); return { from: d, to: d } } },
  { label: 'Yesterday',   getRange: (now: Date) => { const d = new Date(now); d.setDate(d.getDate()-1); const s = fmt(d); return { from: s, to: s } } },
  { label: 'Last 7 days', getRange: (now: Date) => { const d = new Date(now); d.setDate(d.getDate()-6); return { from: fmt(d), to: fmt(now) } } },
  { label: 'Last 30 days',getRange: (now: Date) => { const d = new Date(now); d.setDate(d.getDate()-29); return { from: fmt(d), to: fmt(now) } } },
  { label: 'This month',  getRange: (now: Date) => { const d = new Date(now.getFullYear(), now.getMonth(), 1); return { from: fmt(d), to: fmt(now) } } },
]

function fmt(d: Date) { return d.toISOString().split('T')[0] }

export default function Dashboard() {
  const { now } = useTime()
  const todayStr = fmt(now)

  const [from, setFrom] = useState(() => { const d = new Date(now); d.setDate(d.getDate()-6); return fmt(d) })
  const [to, setTo] = useState(todayStr)
  const [activePreset, setActivePreset] = useState('Last 7 days')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function init() { await load(from, to) }
    init()
  }, [])

  async function load(f: string, t: string) {
    setLoading(true)
    const res = await fetch(`/api/dashboard?from=${f}&to=${t}`)
    setData(await res.json())
    setLoading(false)
  }

  function applyPreset(preset: typeof PRESETS[0]) {
    const range = preset.getRange(now)
    setFrom(range.from)
    setTo(range.to)
    setActivePreset(preset.label)
    load(range.from, range.to)
  }

  function applyCustom() {
    setActivePreset('Custom')
    load(from, to)
  }

  const rangeLabel = from === to
    ? new Date(from + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : `${new Date(from + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(to + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div style={{ fontSize: '13px', color: '#888' }}>{rangeLabel}</div>
      </div>

      {/* Date range controls */}
      <div style={{ background: 'white', borderRadius: '10px', padding: '12px 16px', border: '1px solid #e8e8e8', marginBottom: '24px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            style={{
              padding: '6px 14px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
              borderColor: activePreset === p.label ? 'black' : '#e0e0e0',
              background: activePreset === p.label ? 'black' : '#f8f8f8',
              color: activePreset === p.label ? 'white' : '#333',
            }}
          >
            {p.label}
          </button>
        ))}
        <div style={{ width: '1px', height: '24px', background: '#e0e0e0', margin: '0 4px' }} />
        <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setActivePreset('Custom') }} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '13px' }} />
        <span style={{ color: '#888', fontSize: '13px' }}>to</span>
        <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setActivePreset('Custom') }} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '13px' }} />
        <button onClick={applyCustom} style={{ padding: '5px 14px', background: 'black', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Apply</button>
      </div>

      {loading || !data ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>Loading…</p>
      ) : (
        <>
          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <StatCard title="Revenue" value={`£${data.totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subtitle="From bookings" color="#22c55e" />
            <StatCard title="Food Expenses" value={`£${(data.totalExpenses - data.totalLabour).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subtitle="Ingredient costs" color="#f59e0b" />
            <StatCard title="Labour" value={`£${data.totalLabour.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subtitle="Staff wages" color="#ef4444" />
            <StatCard title="Profit" value={`£${data.totalProfit.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subtitle={data.totalRevenue > 0 ? `${Math.round((data.totalProfit / data.totalRevenue) * 100)}% margin` : 'No revenue'} color="#3b82f6" />
            <StatCard title="Today's Bookings" value={`${data.todayBookings}`} subtitle={`${data.todayCovers} covers`} color="#8b5cf6" />
          </div>

          {/* Chart */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0, fontSize: '16px', fontWeight: '700' }}>Revenue vs Expenses — {rangeLabel}</h2>
            {data.chartData.every((d) => d.revenue === 0 && d.expenses === 0) ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '14px' }}>No data for this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `£${v}`} />
                  <Tooltip formatter={(value: number) => `£${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  )
}
