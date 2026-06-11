import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://iofgylmfldnfjegcwkmg.supabase.co',
  'sb_publishable_mdj82zFS2WfLjA0gt4jlsw_5LyIOHJ-'
)

const menuItems = [
  // Starters
  { name: 'Garlic Bread',         category: 'Starters', selling_price: 7.00,  market_cost: 1.50, available: true },
  { name: 'Bruschetta',           category: 'Starters', selling_price: 9.50,  market_cost: 2.20, available: true },
  { name: 'Soup of the Day',      category: 'Starters', selling_price: 8.00,  market_cost: 2.00, available: true },
  { name: 'Calamari',             category: 'Starters', selling_price: 13.00, market_cost: 4.50, available: true },
  { name: 'Caesar Salad',         category: 'Starters', selling_price: 11.00, market_cost: 3.00, available: true },

  // Mains
  { name: 'Grilled Salmon',       category: 'Mains', selling_price: 26.00, market_cost: 9.00,  available: true },
  { name: 'Ribeye Steak',         category: 'Mains', selling_price: 38.00, market_cost: 14.00, available: true },
  { name: 'Chicken Parmigiana',   category: 'Mains', selling_price: 22.00, market_cost: 6.50,  available: true },
  { name: 'Mushroom Risotto',     category: 'Mains', selling_price: 19.00, market_cost: 5.00,  available: true },
  { name: 'Fish & Chips',         category: 'Mains', selling_price: 18.00, market_cost: 5.50,  available: true },
  { name: 'Lamb Shank',           category: 'Mains', selling_price: 32.00, market_cost: 11.00, available: false },

  // Desserts
  { name: 'Chocolate Lava Cake',  category: 'Desserts', selling_price: 10.00, market_cost: 2.50, available: true },
  { name: 'Crème Brûlée',         category: 'Desserts', selling_price: 9.00,  market_cost: 1.80, available: true },
  { name: 'Tiramisu',             category: 'Desserts', selling_price: 9.50,  market_cost: 2.20, available: true },
  { name: 'Ice Cream (3 scoops)', category: 'Desserts', selling_price: 7.50,  market_cost: 1.50, available: true },

  // Drinks
  { name: 'House Wine (glass)',   category: 'Drinks', selling_price: 9.00,  market_cost: 2.50, available: true },
  { name: 'Craft Beer',           category: 'Drinks', selling_price: 8.00,  market_cost: 2.00, available: true },
  { name: 'Soft Drink',           category: 'Drinks', selling_price: 4.50,  market_cost: 0.60, available: true },
  { name: 'Sparkling Water',      category: 'Drinks', selling_price: 4.00,  market_cost: 0.40, available: true },
  { name: 'Fresh Juice',          category: 'Drinks', selling_price: 6.00,  market_cost: 1.20, available: true },
]

const today = new Date().toISOString().split('T')[0]

const marketPrices = [
  { ingredient: 'Salmon',         price_per_unit: 22.00, unit: 'kg',     recorded_date: today },
  { ingredient: 'Beef Ribeye',    price_per_unit: 38.00, unit: 'kg',     recorded_date: today },
  { ingredient: 'Chicken Breast', price_per_unit: 9.50,  unit: 'kg',     recorded_date: today },
  { ingredient: 'Lamb Shank',     price_per_unit: 18.00, unit: 'kg',     recorded_date: today },
  { ingredient: 'Whitefish',      price_per_unit: 14.00, unit: 'kg',     recorded_date: today },
  { ingredient: 'Arborio Rice',   price_per_unit: 3.20,  unit: 'kg',     recorded_date: today },
  { ingredient: 'Mixed Mushrooms',price_per_unit: 8.50,  unit: 'kg',     recorded_date: today },
  { ingredient: 'Potatoes',       price_per_unit: 1.20,  unit: 'kg',     recorded_date: today },
  { ingredient: 'Tomatoes',       price_per_unit: 3.50,  unit: 'kg',     recorded_date: today },
  { ingredient: 'Garlic',         price_per_unit: 5.00,  unit: 'kg',     recorded_date: today },
  { ingredient: 'Cream',          price_per_unit: 3.80,  unit: 'litre',  recorded_date: today },
  { ingredient: 'Eggs',           price_per_unit: 4.50,  unit: 'dozen',  recorded_date: today },
  { ingredient: 'Butter',         price_per_unit: 7.00,  unit: 'kg',     recorded_date: today },
  { ingredient: 'House Wine',     price_per_unit: 12.00, unit: 'unit',   recorded_date: today },
  { ingredient: 'Craft Beer',     price_per_unit: 4.00,  unit: 'unit',   recorded_date: today },
]

async function seed() {
  console.log('Seeding menu items...')
  const { error: menuError } = await supabase.from('menu_items').insert(menuItems)
  if (menuError) {
    console.error('Menu error:', menuError.message)
  } else {
    console.log(`Inserted ${menuItems.length} menu items`)
  }

  console.log('Seeding market prices...')
  const { error: marketError } = await supabase.from('market_prices').insert(marketPrices)
  if (marketError) {
    console.error('Market error:', marketError.message)
  } else {
    console.log(`Inserted ${marketPrices.length} market prices`)
  }
}

seed()
