import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const date = url.searchParams.get('date')
  const session = url.searchParams.get('session')

  if (date) {
    let q = supabase
      .from('bookings')
      .select('table_name')
      .eq('booking_date', date)
      .neq('status', 'cancelled')
    if (session) q = q.eq('session', session)
    const { data } = await q
    return Response.json((data ?? []).map((b) => b.table_name))
  }

  const { data } = await supabase
    .from('bookings')
    .select('*')
    .order('booking_date', { ascending: false })
  return Response.json(data ?? [])
}

interface OrderItem {
  id: string
  quantity: number
  price: number
}

export async function POST(request: Request) {
  const { customerName, customerEmail, customerId, partySize, bookingDate, bookingTime, tableName, items, session } =
    await request.json()

  const PRICE_PER_SEAT = 5
  const orderItems: OrderItem[] = items ?? []
  const foodTotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const totalAmount = partySize * PRICE_PER_SEAT + foodTotal

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      customer_name: customerName,
      customer_email: customerEmail,
      customer_id: customerId ?? null,
      party_size: partySize,
      booking_date: bookingDate,
      booking_time: bookingTime,
      table_name: tableName,
      total_amount: totalAmount,
      status: 'confirmed',
      session: session ?? null,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  if (orderItems.length > 0) {
    await supabase.from('booking_items').insert(
      orderItems.map((i) => ({
        booking_id: data.id,
        menu_item_id: i.id,
        quantity: i.quantity,
        price_at_time: i.price,
      }))
    )
  }

  // Increment customer visit count
  if (customerId) {
    await supabase.rpc('increment_visit_count', { customer_id: customerId })
  }

  return Response.json(data)
}
