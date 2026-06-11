'use client'
import { useState, useEffect } from 'react'

interface MarketItem {
  id: string
  ingredient: string
  price_per_unit: number
}

interface SelectedIngredient {
  market_price_id: string
  quantity: number
}

interface IngredientLink {
  id: string
  market_price_id: string
  quantity: number
  market_prices: {
    id: string
    ingredient: string
    price_per_unit: number
  }
}

interface MenuItem {
  id: string
  name: string
  category: string | null
  additional_price: number
  available: boolean
  total_price: number
  menu_item_ingredients: IngredientLink[]
}

function CategoryInput({ value, onChange, categories }: {
  value: string
  onChange: (v: string) => void
  categories: string[]
}) {
  return (
    <>
      <input
        list="categories-list"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Starters (leave blank for none)"
        style={{ width: '100%', padding: '8px 12px', border: '1px solid #eee', borderRadius: '6px', boxSizing: 'border-box' as const, fontSize: '14px' }}
      />
      <datalist id="categories-list">
        {categories.map((c) => <option key={c} value={c} />)}
      </datalist>
    </>
  )
}

function IngredientSelector({ selected, onChange, marketItems }: {
  selected: SelectedIngredient[]
  onChange: (v: SelectedIngredient[]) => void
  marketItems: MarketItem[]
}) {
  function add(id: string) {
    if (selected.some((i) => i.market_price_id === id)) return
    onChange([...selected, { market_price_id: id, quantity: 1 }])
  }

  function remove(id: string) {
    onChange(selected.filter((i) => i.market_price_id !== id))
  }

  function setQty(id: string, qty: number) {
    if (qty < 1) return
    onChange(selected.map((i) => i.market_price_id === id ? { ...i, quantity: qty } : i))
  }

  const selectedIds = new Set(selected.map((i) => i.market_price_id))

  return (
    <div>
      {/* Available chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
        {marketItems.map((item) => {
          const isSelected = selectedIds.has(item.id)
          return (
            <button
              key={item.id}
              onClick={() => isSelected ? remove(item.id) : add(item.id)}
              style={{
                padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px',
                border: isSelected ? '2px solid black' : '1px solid #eee',
                background: isSelected ? 'black' : 'white',
                color: isSelected ? 'white' : '#333',
              }}
            >
              {item.ingredient} (${item.price_per_unit.toFixed(2)})
            </button>
          )
        })}
      </div>

      {/* Selected with quantity controls */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {selected.map((sel) => {
            const item = marketItems.find((m) => m.id === sel.market_price_id)
            if (!item) return null
            return (
              <div key={sel.market_price_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                <span style={{ flex: 1, fontSize: '14px', fontWeight: '500' }}>{item.ingredient}</span>
                <span style={{ fontSize: '13px', color: '#666' }}>${item.price_per_unit.toFixed(2)} each</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button onClick={() => setQty(item.id, sel.quantity - 1)} style={{ width: '24px', height: '24px', border: '1px solid #eee', borderRadius: '4px', cursor: 'pointer', background: 'white' }}>−</button>
                  <input
                    type="number"
                    value={sel.quantity}
                    onChange={(e) => setQty(item.id, Number(e.target.value))}
                    min={1}
                    style={{ width: '48px', padding: '2px 6px', border: '1px solid #eee', borderRadius: '4px', textAlign: 'center', fontSize: '14px' }}
                  />
                  <button onClick={() => setQty(item.id, sel.quantity + 1)} style={{ width: '24px', height: '24px', border: '1px solid #eee', borderRadius: '4px', cursor: 'pointer', background: 'white' }}>+</button>
                </div>
                <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: '500', minWidth: '60px', textAlign: 'right' }}>
                  = ${(item.price_per_unit * sel.quantity).toFixed(2)}
                </span>
                <button onClick={() => remove(item.id)} style={{ padding: '2px 8px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [marketItems, setMarketItems] = useState<MarketItem[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newAdditional, setNewAdditional] = useState('0')
  const [newIngredients, setNewIngredients] = useState<SelectedIngredient[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editAdditional, setEditAdditional] = useState('0')
  const [editIngredients, setEditIngredients] = useState<SelectedIngredient[]>([])

  async function load() {
    const [menuData, marketData] = await Promise.all([
      fetch('/api/menu').then((r) => r.json()),
      fetch('/api/market').then((r) => r.json()),
    ])
    setItems(menuData)
    setMarketItems(marketData)
  }

  useEffect(() => {
    async function init() {
      const [menuData, marketData] = await Promise.all([
        fetch('/api/menu').then((r) => r.json()),
        fetch('/api/market').then((r) => r.json()),
      ])
      setItems(menuData)
      setMarketItems(marketData)
    }
    init()
  }, [])

  const existingCategories = [...new Set(
    items.map((i) => i.category).filter((c): c is string => !!c)
  )].sort()

  function previewTotal(selected: SelectedIngredient[], additional: string) {
    return selected.reduce((sum, ing) => {
      const item = marketItems.find((m) => m.id === ing.market_price_id)
      return sum + (item?.price_per_unit ?? 0) * ing.quantity
    }, 0) + Number(additional || 0)
  }

  async function addItem() {
    if (!newName.trim()) return
    await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName.trim(),
        category: newCategory.trim() || null,
        additional_price: Number(newAdditional || 0),
        ingredients: newIngredients,
      }),
    })
    setNewName('')
    setNewCategory('')
    setNewAdditional('0')
    setNewIngredients([])
    setShowAdd(false)
    load()
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id)
    setEditName(item.name)
    setEditCategory(item.category ?? '')
    setEditAdditional(String(item.additional_price))
    setEditIngredients(
      item.menu_item_ingredients.map((i) => ({ market_price_id: i.market_price_id, quantity: i.quantity }))
    )
  }

  async function saveEdit(id: string) {
    await fetch('/api/menu', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        name: editName,
        category: editCategory.trim() || null,
        additional_price: Number(editAdditional || 0),
        ingredients: editIngredients,
        available: true,
      }),
    })
    setEditingId(null)
    load()
  }

  async function deleteItem(id: string) {
    await fetch('/api/menu', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: '1px solid #eee',
    borderRadius: '6px', boxSizing: 'border-box', fontSize: '14px',
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Menu</h1>
          <p style={{ color: '#666', margin: '4px 0 0' }}>
            Prices auto-calculate from ingredients × quantities + markup. Updates live when market prices change.
          </p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ padding: '10px 20px', background: 'black', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          {showAdd ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>New Menu Item</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Item name *</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Omelette" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Category</label>
              <CategoryInput value={newCategory} onChange={setNewCategory} categories={existingCategories} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Additional price ($)</label>
              <input type="number" value={newAdditional} onChange={(e) => setNewAdditional(e.target.value)} min="0" step="0.01" style={inputStyle} />
            </div>
          </div>

          <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '8px' }}>Ingredients from market prices</label>
          {marketItems.length === 0 ? (
            <p style={{ color: '#999', fontSize: '14px', marginBottom: '16px' }}>No market price items yet — add ingredients there first.</p>
          ) : (
            <div style={{ marginBottom: '20px' }}>
              <IngredientSelector selected={newIngredients} onChange={setNewIngredients} marketItems={marketItems} />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '16px' }}>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Ingredients: ${(previewTotal(newIngredients, newAdditional) - Number(newAdditional || 0)).toFixed(2)}
              &nbsp;+ Additional: ${Number(newAdditional || 0).toFixed(2)}
              &nbsp;= <strong style={{ color: '#22c55e', fontSize: '16px' }}>${previewTotal(newIngredients, newAdditional).toFixed(2)}</strong>
            </div>
            <button onClick={addItem} style={{ padding: '10px 24px', background: 'black', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              Create Item
            </button>
          </div>
        </div>
      )}

      {/* Edit panel */}
      {editingId && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '2px solid black' }}>
          <h3 style={{ marginTop: 0 }}>Edit: {items.find((i) => i.id === editingId)?.name}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Item name</label>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Category</label>
              <CategoryInput value={editCategory} onChange={setEditCategory} categories={existingCategories} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Additional price ($)</label>
              <input type="number" value={editAdditional} onChange={(e) => setEditAdditional(e.target.value)} min="0" step="0.01" style={inputStyle} />
            </div>
          </div>
          <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '8px' }}>Ingredients</label>
          <div style={{ marginBottom: '20px' }}>
            <IngredientSelector selected={editIngredients} onChange={setEditIngredients} marketItems={marketItems} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '16px' }}>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Ingredients: ${(previewTotal(editIngredients, editAdditional) - Number(editAdditional || 0)).toFixed(2)}
              &nbsp;+ Additional: ${Number(editAdditional || 0).toFixed(2)}
              &nbsp;= <strong style={{ color: '#22c55e', fontSize: '16px' }}>${previewTotal(editIngredients, editAdditional).toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setEditingId(null)} style={{ padding: '8px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => saveEdit(editingId)} style={{ padding: '8px 20px', background: 'black', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Items table */}
      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {items.length === 0 ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No menu items yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9f9f9' }}>
                {['Item', 'Category', 'Ingredients', 'Additional', 'Total Price', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{item.name}</td>
                  <td style={{ padding: '12px 16px', color: '#666', fontSize: '13px' }}>
                    {item.category ?? <span style={{ color: '#ccc' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {item.menu_item_ingredients.length === 0 ? (
                        <span style={{ color: '#999', fontSize: '13px' }}>None</span>
                      ) : (
                        item.menu_item_ingredients.map((ing) => (
                          <span key={ing.id} style={{ padding: '2px 8px', background: '#f0f0f0', borderRadius: '12px', fontSize: '12px' }}>
                            {ing.quantity}× {ing.market_prices.ingredient} (${(ing.market_prices.price_per_unit * ing.quantity).toFixed(2)})
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#666' }}>${item.additional_price.toFixed(2)}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#22c55e', fontSize: '15px' }}>${item.total_price.toFixed(2)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => startEdit(item)} style={{ padding: '4px 12px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Edit</button>
                      <button onClick={() => deleteItem(item.id)} style={{ padding: '4px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Delete</button>
                    </div>
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
