import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabase
    .from('bookings')
    .select('*, booking_items(*, menu_items(name, selling_price))')
    .order('booking_date', { ascending: false })
  return Response.json(data ?? [])
}

interface OrderItem {
  id: string
  quantity: number
  price: number
}

export async function POST(request: Request) {
  const { customerName, customerEmail, partySize, bookingDate, bookingTime, items } = await request.json()

  const totalAmount = items.reduce((sum: number, item: OrderItem) =>
    sum + (item.price * item.quantity), 0)

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      customer_name: customerName,
      customer_email: customerEmail,
      party_size: partySize,
      booking_date: bookingDate,
      booking_time: bookingTime,
      total_amount: totalAmount,
      status: 'confirmed'
    })
    .select()
    .single()

  if (error) return Response.json({ error }, { status: 500 })

  if (items.length > 0) {
    await supabase.from('booking_items').insert(
      items.map((item: OrderItem) => ({
        booking_id: booking.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price
      }))
    )
  }

  return Response.json(booking)
}