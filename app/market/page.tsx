'use client'
import { useState, useEffect } from 'react'

interface MarketItem {
  id: string
  ingredient: string
  price_per_unit: number
}

export default function MarketPrices() {
  const [items, setItems] = useState<MarketItem[]>([])
  const [adding, setAdding] = useState(false)
  const [newIngredient, setNewIngredient] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')

  async function load() {
    const data = await fetch('/api/market').then((r) => r.json())
    setItems(data)
  }

  useEffect(() => { load() }, [])

  async function addItem() {
    if (!newIngredient.trim() || !newPrice) return
    await fetch('/api/market', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredient: newIngredient.trim(), price: Number(newPrice) }),
    })
    setNewIngredient('')
    setNewPrice('')
    setAdding(false)
    load()
  }

  async function saveEdit(id: string) {
    await fetch('/api/market', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, price: Number(editPrice) }),
    })
    setEditingId(null)
    load()
  }

  async function deleteItem(id: string) {
    await fetch('/api/market', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Market Prices</h1>
          <p style={{ color: '#666', margin: '4px 0 0' }}>
            Ingredient costs — used to auto-calculate menu item prices
          </p>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          style={{ padding: '10px 20px', background: 'black', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          {adding ? 'Cancel' : '+ Add Ingredient'}
        </button>
      </div>

      {adding && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '4px' }}>Ingredient name</label>
            <input
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder="e.g. Eggs"
              style={{ padding: '8px 12px', border: '1px solid #eee', borderRadius: '6px', width: '200px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '4px' }}>Price ($)</label>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder="0.00"
              min="0"
              step="0.01"
              style={{ padding: '8px 12px', border: '1px solid #eee', borderRadius: '6px', width: '100px' }}
            />
          </div>
          <button
            onClick={addItem}
            style={{ padding: '8px 20px', background: 'black', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Add
          </button>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {items.length === 0 ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            No ingredients yet. Add one above.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9f9f9' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px' }}>Ingredient</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px' }}>Price</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{item.ingredient}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {editingId === item.id ? (
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)}
                        min="0"
                        step="0.01"
                        style={{ width: '90px', padding: '4px 8px', border: '1px solid #eee', borderRadius: '4px' }}
                        autoFocus
                      />
                    ) : (
                      `$${item.price_per_unit.toFixed(2)}`
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {editingId === item.id ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => saveEdit(item.id)}
                          style={{ padding: '4px 12px', background: 'black', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{ padding: '4px 12px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => { setEditingId(item.id); setEditPrice(String(item.price_per_unit)) }}
                          style={{ padding: '4px 12px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Edit Price
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          style={{ padding: '4px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
