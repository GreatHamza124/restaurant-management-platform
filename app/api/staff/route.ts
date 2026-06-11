import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const type = url.searchParams.get('type')

  if (type === 'shifts') {
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    let q = supabase.from('shifts').select('*, staff(name, role)').order('shift_date', { ascending: false })
    if (from) q = q.gte('shift_date', from)
    if (to) q = q.lte('shift_date', to)
    const { data } = await q
    return Response.json(data ?? [])
  }

  const { data } = await supabase.from('staff').select('*').order('name')
  return Response.json(data ?? [])
}

export async function POST(request: Request) {
  const body = await request.json()

  if (body.type === 'shift') {
    const { data, error } = await supabase
      .from('shifts')
      .insert({
        staff_id: body.staff_id,
        shift_date: body.shift_date,
        hours_worked: body.hours_worked,
        notes: body.notes?.trim() || null,
      })
      .select('*, staff(name, role)')
      .single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data)
  }

  const { data, error } = await supabase
    .from('staff')
    .insert({
      name: body.name?.trim(),
      role: body.role?.trim() || null,
      hourly_rate: body.hourly_rate,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
    })
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function PUT(request: Request) {
  const body = await request.json()
  const { id, ...fields } = body
  const { data, error } = await supabase
    .from('staff')
    .update({
      name: fields.name?.trim(),
      role: fields.role?.trim() || null,
      hourly_rate: fields.hourly_rate,
      phone: fields.phone?.trim() || null,
      email: fields.email?.trim() || null,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(request: Request) {
  const { id, type } = await request.json()
  const table = type === 'shift' ? 'shifts' : 'staff'
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
