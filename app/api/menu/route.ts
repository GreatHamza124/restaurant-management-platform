import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('menu_items')
    .select('id, name, category, additional_price, available, menu_item_ingredients(id, quantity, market_price_id, market_prices(id, ingredient, price_per_unit))')
    .order('name')
  if (error) return Response.json([])

  const items = (data ?? []).map((item) => ({
    ...item,
    total_price:
      (item.additional_price ?? 0) +
      (item.menu_item_ingredients ?? []).reduce(
        (sum: number, ing: { quantity: number; market_prices: { price_per_unit: number } | null }) =>
          sum + (ing.market_prices?.price_per_unit ?? 0) * (ing.quantity ?? 1),
        0
      ),
  }))

  return Response.json(items)
}

interface IngredientInput {
  market_price_id: string
  quantity: number
}

export async function POST(request: Request) {
  const { name, category, additional_price, ingredients } = await request.json()
  const ingredientList: IngredientInput[] = ingredients ?? []

  const { data: item, error } = await supabase
    .from('menu_items')
    .insert({
      name,
      category: category?.trim() || null,
      additional_price: additional_price ?? 0,
      available: true,
      selling_price: 0,
      market_cost: 0,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  if (ingredientList.length > 0) {
    await supabase.from('menu_item_ingredients').insert(
      ingredientList.map(({ market_price_id, quantity }) => ({
        menu_item_id: item.id,
        market_price_id,
        quantity: quantity ?? 1,
      }))
    )
  }

  return Response.json(item)
}

export async function PUT(request: Request) {
  const { id, name, category, additional_price, available, ingredients } = await request.json()
  const ingredientList: IngredientInput[] = ingredients ?? []

  const { error } = await supabase
    .from('menu_items')
    .update({ name, category: category?.trim() || null, additional_price, available })
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  await supabase.from('menu_item_ingredients').delete().eq('menu_item_id', id)

  if (ingredientList.length > 0) {
    await supabase.from('menu_item_ingredients').insert(
      ingredientList.map(({ market_price_id, quantity }) => ({
        menu_item_id: id,
        market_price_id,
        quantity: quantity ?? 1,
      }))
    )
  }

  return Response.json({ success: true })
}

export async function DELETE(request: Request) {
  const { id } = await request.json()
  const { error } = await supabase.from('menu_items').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
