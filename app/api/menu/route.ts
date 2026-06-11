import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabase
    .from('menu_items')
    .select('*')
    .order('category')
  return Response.json(data ?? [])
}

export async function PUT(request: Request) {
  const { id, selling_price, market_cost, available } = await request.json()
  
  const { data, error } = await supabase
    .from('menu_items')
    .update({ selling_price, market_cost, available })
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error }, { status: 500 })
  return Response.json(data)
}