import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabase
    .from('market_prices')
    .select('id, ingredient, price_per_unit')
    .order('ingredient')
  return Response.json(data ?? [])
}

export async function POST(request: Request) {
  const { ingredient, price } = await request.json()
  const { data, error } = await supabase
    .from('market_prices')
    .insert({ ingredient, price_per_unit: price, recorded_date: new Date().toISOString().split('T')[0], unit: '' })
    .select('id, ingredient, price_per_unit')
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function PUT(request: Request) {
  const { id, price } = await request.json()
  const { data, error } = await supabase
    .from('market_prices')
    .update({ price_per_unit: price })
    .eq('id', id)
    .select('id, ingredient, price_per_unit')
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(request: Request) {
  const { id } = await request.json()
  const { error } = await supabase.from('market_prices').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
