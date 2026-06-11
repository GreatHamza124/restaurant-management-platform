'use client'
import { useState, useEffect } from 'react'

interface MenuItem {
  id: string
  name: string
  category: string
  selling_price: number
  market_cost: number
  available: boolean
}

interface EditValues {
  selling_price: number
  market_cost: number
  available: boolean
}

export default function MenuPrices() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<EditValues>({
  selling_price: 0,
  market_cost: 0,
  available: true
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/menu').then(r => r.json()).then(setItems)
  }, [])

  function startEdit(item: MenuItem) {
    setEditing(item.id)
    setEditValues({
      selling_price: item.selling_price,
      market_cost: item.market_cost,
      available: item.available
    })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    await fetch('/api/menu', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editValues })
    })
    const updated = await fetch('/api/menu').then(r => r.json())
    setItems(updated)
    setEditing(null)
    setSaving(false)
  }

  const categories = [...new Set(items.map(i => i.category))]

  return (
    <div>
      <h1>Menu Prices</h1>
      <p style={{ color: '#666' }}>Update selling prices and track food costs. Margin shown for each item.</p>

      {categories.map(category => (
        <div key={category} style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#444', borderBottom: '2px solid #eee', paddingBottom: '8px' }}>
            {category}
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9f9f9' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Item</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Selling Price</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Market Cost</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Margin</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Available</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.filter(i => i.category === category).map(item => {
                const margin = ((item.selling_price - item.market_cost) / item.selling_price * 100).toFixed(0)
                const marginColor = Number(margin) > 60 ? '#22c55e' : Number(margin) > 40 ? '#f59e0b' : '#ef4444'
                const isEditing = editing === item.id

                return (
                  <tr key={item.id} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{item.name}</td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValues.selling_price}
                          onChange={e => setEditValues({ ...editValues, selling_price: Number(e.target.value) })}
                          style={{ width: '80px', padding: '4px' }}
                        />
                      ) : `$${item.selling_price.toFixed(2)}`}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValues.market_cost}
                          onChange={e => setEditValues({ ...editValues, market_cost: Number(e.target.value) })}
                          style={{ width: '80px', padding: '4px' }}
                        />
                      ) : `$${item.market_cost.toFixed(2)}`}
                    </td>
                    <td style={{ padding: '12px', color: marginColor, fontWeight: 'bold' }}>
                      {margin}%
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={editValues.available}
                          onChange={e => setEditValues({ ...editValues, available: e.target.checked })}
                        />
                      ) : (
                        <span style={{ color: item.available ? '#22c55e' : '#ef4444' }}>
                          {item.available ? '✓ Yes' : '✗ No'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => saveEdit(item.id)}
                            disabled={saving}
                            style={{ padding: '4px 12px', background: 'black', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            {saving ? '...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            style={{ padding: '4px 12px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(item)}
                          style={{ padding: '4px 12px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}