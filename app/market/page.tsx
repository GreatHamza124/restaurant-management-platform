'use client'
import { useState, useEffect } from 'react'

interface MarketPrice {
  id: string
  ingredient: string
  price_per_unit: number
  unit: string
  recorded_date: string
}

export default function MarketPrices() {
  const [prices, setPrices] = useState<MarketPrice[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({ ingredient: '', price_per_unit: '', unit: 'kg' })

  useEffect(() => {
    fetch('/api/market').then(r => r.json()).then(setPrices)
  }, [])

  async function savePrice(id: string) {
    await fetch('/api/market', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, price_per_unit: Number(editPrice) })
    })
    const updated = await fetch('/api/market').then(r => r.json())
    setPrices(updated)
    setEditing(null)
  }

  async function addIngredient() {
    await fetch('/api/market', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newItem, price_per_unit: Number(newItem.price_per_unit) })
    })
    const updated = await fetch('/api/market').then(r => r.json())
    setPrices(updated)
    setShowAdd(false)
    setNewItem({ ingredient: '', price_per_unit: '', unit: 'kg' })
  }

  const units = ['kg', 'litre', 'dozen', 'head', 'unit', 'bunch']

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Market Prices</h1>
          <p style={{ color: '#666', margin: '4px 0 0 0' }}>Track ingredient costs to monitor your food margins</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ padding: '10px 20px', background: 'black', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          {showAdd ? 'Cancel' : '+ Add Ingredient'}
        </button>
      </div>

      {showAdd && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Add New Ingredient</h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '4px' }}>Ingredient</label>
              <input value={newItem.ingredient} onChange={e => setNewItem({ ...newItem, ingredient: e.target.value })}
                placeholder="e.g. Chicken Breast"
                style={{ padding: '8px', border: '1px solid #eee', borderRadius: '6px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '4px' }}>Price</label>
              <input type="number" value={newItem.price_per_unit} onChange={e => setNewItem({ ...newItem, price_per_unit: e.target.value })}
                placeholder="0.00"
                style={{ padding: '8px', border: '1px solid #eee', borderRadius: '6px', width: '80px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '4px' }}>Unit</label>
              <select value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                style={{ padding: '8px', border: '1px solid #eee', borderRadius: '6px' }}>
                {units.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <button onClick={addIngredient}
              style={{ padding: '8px 20px', background: 'black', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Add
            </button>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9f9f9' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Ingredient</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Price per Unit</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Unit</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Last Updated</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prices.map(price => (
              <tr key={price.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '12px 16px', fontWeight: '500' }}>{price.ingredient}</td>
                <td style={{ padding: '12px 16px' }}>
                  {editing === price.id ? (
                    <input type="number" value={editPrice}
                      onChange={e => setEditPrice(e.target.value)}
                      style={{ width: '80px', padding: '4px', border: '1px solid #eee', borderRadius: '4px' }} />
                  ) : `$${price.price_per_unit.toFixed(2)}`}
                </td>
                <td style={{ padding: '12px 16px', color: '#666' }}>per {price.unit}</td>
                <td style={{ padding: '12px 16px', color: '#666', fontSize: '14px' }}>{price.recorded_date}</td>
                <td style={{ padding: '12px 16px' }}>
                  {editing === price.id ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => savePrice(price.id)}
                        style={{ padding: '4px 12px', background: 'black', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Save
                      </button>
                      <button onClick={() => setEditing(null)}
                        style={{ padding: '4px 12px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditing(price.id); setEditPrice(String(price.price_per_unit)) }}
                      style={{ padding: '4px 12px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Update Price
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}