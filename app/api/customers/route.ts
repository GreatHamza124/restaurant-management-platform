import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabase
    .from('customers')
    .select('*')
    .order('name')
  return Response.json(data ?? [])
}

export async function POST(request: Request) {
  const body = await request.json()
  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: body.name?.trim(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      dietary_notes: body.dietary_notes?.trim() || null,
      allergies: body.allergies?.trim() || null,
      important_note: body.important_note?.trim() || null,
      notes: body.notes?.trim() || null,
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
    .from('customers')
    .update({
      name: fields.name?.trim(),
      email: fields.email?.trim() || null,
      phone: fields.phone?.trim() || null,
      dietary_notes: fields.dietary_notes?.trim() || null,
      allergies: fields.allergies?.trim() || null,
      important_note: fields.important_note?.trim() || null,
      notes: fields.notes?.trim() || null,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(request: Request) {
  const { id } = await request.json()
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
