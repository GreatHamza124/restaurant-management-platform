'use client'
import { useState, useEffect } from 'react'

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  dietary_notes: string | null
  allergies: string | null
  important_note: string | null
  notes: string | null
  visit_count: number
  created_at: string
}

const EMPTY: Omit<Customer, 'id' | 'visit_count' | 'created_at'> = {
  name: '',
  email: '',
  phone: '',
  dietary_notes: '',
  allergies: '',
  important_note: '',
  notes: '',
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function init() { await load() }
    init()
  }, [])

  async function load() {
    const res = await fetch('/api/customers')
    setCustomers(await res.json())
  }

  function openNew() {
    setSelected(null)
    setForm({ ...EMPTY })
    setIsNew(true)
  }

  function openEdit(c: Customer) {
    setSelected(c)
    setForm({
      name: c.name,
      email: c.email ?? '',
      phone: c.phone ?? '',
      dietary_notes: c.dietary_notes ?? '',
      allergies: c.allergies ?? '',
      important_note: c.important_note ?? '',
      notes: c.notes ?? '',
    })
    setIsNew(false)
  }

  function closePanel() {
    setSelected(null)
    setIsNew(false)
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    if (isNew) {
      await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    } else if (selected) {
      await fetch('/api/customers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selected.id, ...form }) })
    }
    await load()
    closePanel()
    setSaving(false)
  }

  async function del() {
    if (!selected) return
    if (!confirm(`Delete ${selected.name}?`)) return
    await fetch('/api/customers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selected.id }) })
    await load()
    closePanel()
  }

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search)
  )

  const panelOpen = isNew || selected !== null

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      {/* Left: list */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>Customers</h1>
          <button onClick={openNew} style={{ background: 'black', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 18px', fontWeight: '600', cursor: 'pointer' }}>
            + Add Customer
          </button>
        </div>

        <input
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box' }}
        />

        <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>{filtered.length} customer{filtered.length !== 1 ? 's' : ''}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => openEdit(c)}
              style={{
                background: 'white',
                borderRadius: '10px',
                padding: '14px 18px',
                cursor: 'pointer',
                border: selected?.id === c.id ? '2px solid #000' : '1px solid #e8e8e8',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <div style={{ fontWeight: '600', fontSize: '15px' }}>{c.name}</div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                  {[c.email, c.phone].filter(Boolean).join(' · ')}
                </div>
                {c.important_note && (
                  <div style={{ marginTop: '6px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: '#856404', display: 'inline-block' }}>
                    ⚠ {c.important_note}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {c.dietary_notes && <span style={{ background: '#e8f5e9', color: '#2e7d32', borderRadius: '99px', padding: '2px 10px', fontSize: '12px' }}>Diet: {c.dietary_notes}</span>}
                  {c.allergies && <span style={{ background: '#fce4ec', color: '#b71c1c', borderRadius: '99px', padding: '2px 10px', fontSize: '12px' }}>Allergy: {c.allergies}</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>{c.visit_count}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>visits</div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999', background: 'white', borderRadius: '10px', border: '1px solid #e8e8e8' }}>
              {search ? 'No customers match your search.' : 'No customers yet. Add one to get started.'}
            </div>
          )}
        </div>
      </div>

      {/* Right: form panel */}
      {panelOpen && (
        <div style={{
          width: '380px',
          flexShrink: 0,
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e8e8e8',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          padding: '24px',
          position: 'sticky',
          top: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{isNew ? 'New Customer' : 'Edit Customer'}</h2>
            <button onClick={closePanel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#666' }}>×</button>
          </div>

          <Field label="Name *">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" style={inputStyle} />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" style={inputStyle} />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+44 7700 900000" style={inputStyle} />
          </Field>
          <Field label="Dietary Notes">
            <input value={form.dietary_notes} onChange={(e) => setForm({ ...form, dietary_notes: e.target.value })} placeholder="e.g. Vegetarian, Halal" style={inputStyle} />
          </Field>
          <Field label="Allergies">
            <input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="e.g. Nuts, Gluten" style={inputStyle} />
          </Field>
          <Field label="Important Note">
            <textarea
              value={form.important_note}
              onChange={(e) => setForm({ ...form, important_note: e.target.value })}
              placeholder="Shown as a warning in bookings..."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '3px' }}>This note will appear as an orange banner when this customer is selected for a booking.</div>
          </Field>
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="General notes about this customer..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>

          {!isNew && selected && (
            <div style={{ marginBottom: '14px', padding: '10px 14px', background: '#f8f8f8', borderRadius: '8px', fontSize: '13px', color: '#666' }}>
              <strong style={{ color: '#333' }}>{selected.visit_count}</strong> visit{selected.visit_count !== 1 ? 's' : ''} recorded &nbsp;·&nbsp;
              Customer since {new Date(selected.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            {!isNew && (
              <button onClick={del} style={{ padding: '9px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                Delete
              </button>
            )}
            <button onClick={closePanel} style={{ flex: 1, padding: '9px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
              Cancel
            </button>
            <button onClick={save} disabled={saving || !form.name.trim()} style={{ flex: 2, padding: '9px', background: form.name.trim() ? 'black' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', cursor: form.name.trim() ? 'pointer' : 'default', fontWeight: '600', fontSize: '13px' }}>
              {saving ? 'Saving…' : isNew ? 'Add Customer' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '7px',
  border: '1px solid #e0e0e0',
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none',
}
