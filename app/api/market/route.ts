import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabase
    .from('market_prices')
    .select('*')
    .order('ingredient')
  return Response.json(data ?? [])
}

export async function POST(request: Request) {
  const body = await request.json()
  const { data, error } = await supabase
    .from('market_prices')
    .insert(body)
    .select()
    .single()
  if (error) return Response.json({ error }, { status: 500 })
  return Response.json(data)
}

export async function PUT(request: Request) {
  const { id, price_per_unit } = await request.json()
  const { data, error } = await supabase
    .from('market_prices')
    .update({ price_per_unit, recorded_date: new Date().toISOString().split('T')[0] })
    .eq('id', id)
    .select()
    .single()
  if (error) return Response.json({ error }, { status: 500 })
  return Response.json(data)
}