import { supabase } from '@/lib/supabase'

const PRICE_PER_SEAT = 5

export async function GET(request: Request) {
  const url = new URL(request.url)
  const today = new Date().toISOString().split('T')[0]
  const from = url.searchParams.get('from') ?? today
  const to = url.searchParams.get('to') ?? today

  // Ingredient costs per menu item — used for expenses
  const { data: ingredientLinks } = await supabase
    .from('menu_item_ingredients')
    .select('menu_item_id, quantity, market_prices(price_per_unit)')

  const ingredientCostMap: Record<string, number> = {}
  for (const link of ingredientLinks ?? []) {
    const mp = link.market_prices as unknown as { price_per_unit: number } | null
    if (!ingredientCostMap[link.menu_item_id]) ingredientCostMap[link.menu_item_id] = 0
    ingredientCostMap[link.menu_item_id] += (mp?.price_per_unit ?? 0) * (link.quantity ?? 1)
  }

  // Bookings in range
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, booking_date, party_size, booking_items(menu_item_id, quantity, price_at_time)')
    .gte('booking_date', from)
    .lte('booking_date', to)
    .neq('status', 'cancelled')
    .order('booking_date', { ascending: true })

  // Labour costs in range (shifts × hourly_rate)
  const { data: shifts } = await supabase
    .from('shifts')
    .select('shift_date, hours_worked, staff(hourly_rate)')
    .gte('shift_date', from)
    .lte('shift_date', to)

  const labourByDay: Record<string, number> = {}
  let totalLabour = 0
  for (const shift of shifts ?? []) {
    const rate = (shift.staff as unknown as { hourly_rate: number } | null)?.hourly_rate ?? 0
    const cost = shift.hours_worked * rate
    totalLabour += cost
    const d = shift.shift_date as string
    labourByDay[d] = (labourByDay[d] ?? 0) + cost
  }

  // Build per-day map
  const allDays: string[] = []
  const startD = new Date(from + 'T12:00:00')
  const endD = new Date(to + 'T12:00:00')
  for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
    allDays.push(d.toISOString().split('T')[0])
  }

  const dayMap: Record<string, { revenue: number; expenses: number }> = {}
  for (const day of allDays) {
    dayMap[day] = { revenue: 0, expenses: labourByDay[day] ?? 0 }
  }

  let totalRevenue = 0
  let totalExpenses = totalLabour

  for (const booking of bookings ?? []) {
    const d = booking.booking_date as string
    if (!dayMap[d]) dayMap[d] = { revenue: 0, expenses: 0 }

    const tableRev = (booking.party_size ?? 0) * PRICE_PER_SEAT
    dayMap[d].revenue += tableRev
    totalRevenue += tableRev

    for (const item of (booking.booking_items as Array<{ menu_item_id: string; quantity: number; price_at_time: number }>) ?? []) {
      const foodRev = (item.price_at_time ?? 0) * (item.quantity ?? 0)
      const foodExp = (ingredientCostMap[item.menu_item_id] ?? 0) * (item.quantity ?? 0)
      dayMap[d].revenue += foodRev
      dayMap[d].expenses += foodExp
      totalRevenue += foodRev
      totalExpenses += foodExp
    }
  }

  const chartData = allDays.map((d) => ({
    date: d.slice(5), // MM-DD for display
    fullDate: d,
    revenue: Math.round(dayMap[d].revenue * 100) / 100,
    expenses: Math.round(dayMap[d].expenses * 100) / 100,
  }))

  // Today stats (always real today for "today's bookings" widget)
  const { data: todayBookings } = await supabase
    .from('bookings')
    .select('id, party_size')
    .eq('booking_date', today)
    .neq('status', 'cancelled')

  const todayCount = (todayBookings ?? []).length
  const todayCovers = (todayBookings ?? []).reduce((s, b) => s + (b.party_size ?? 0), 0)

  return Response.json({
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    totalProfit: Math.round((totalRevenue - totalExpenses) * 100) / 100,
    totalLabour: Math.round(totalLabour * 100) / 100,
    chartData,
    todayBookings: todayCount,
    todayCovers,
    pricePerSeat: PRICE_PER_SEAT,
  })
}
