import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const from = url.searchParams.get('from') ?? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const to = url.searchParams.get('to') ?? new Date().toISOString().split('T')[0]

  // All bookings in range with items
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, booking_items(*, menu_items(name, category))')
    .gte('booking_date', from)
    .lte('booking_date', to)
    .neq('status', 'cancelled')

  const safeBookings = bookings ?? []

  // Revenue per day
  const revenueByDay: Record<string, number> = {}
  const coversByDay: Record<string, number> = {}
  const sessionCounts: Record<string, number> = { Breakfast: 0, Lunch: 0, Dinner: 0, unset: 0 }
  const itemQty: Record<string, { name: string; category: string | null; qty: number; revenue: number }> = {}

  for (const b of safeBookings) {
    const d = b.booking_date
    revenueByDay[d] = (revenueByDay[d] ?? 0) + (b.total_amount ?? 0)
    coversByDay[d] = (coversByDay[d] ?? 0) + (b.party_size ?? 0)

    const sess = b.session ?? 'unset'
    sessionCounts[sess] = (sessionCounts[sess] ?? 0) + 1

    for (const item of b.booking_items ?? []) {
      const id = item.menu_item_id
      if (!itemQty[id]) {
        itemQty[id] = { name: item.menu_items?.name ?? 'Unknown', category: item.menu_items?.category ?? null, qty: 0, revenue: 0 }
      }
      itemQty[id].qty += item.quantity
      itemQty[id].revenue += item.price_at_time * item.quantity
    }
  }

  // Build sorted daily trend
  const allDays: string[] = []
  const start = new Date(from + 'T12:00:00')
  const end = new Date(to + 'T12:00:00')
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    allDays.push(d.toISOString().split('T')[0])
  }
  const revenueTrend = allDays.map((day) => ({
    date: day,
    revenue: revenueByDay[day] ?? 0,
    covers: coversByDay[day] ?? 0,
  }))

  // Top items
  const topItems = Object.values(itemQty)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10)

  const sessions = Object.entries(sessionCounts)
    .filter(([, v]) => v > 0)
    .map(([name, count]) => ({ name: name === 'unset' ? 'No Session' : name, count }))

  const totalRevenue = safeBookings.reduce((s, b) => s + (b.total_amount ?? 0), 0)
  const totalCovers = safeBookings.reduce((s, b) => s + (b.party_size ?? 0), 0)
  const totalBookings = safeBookings.length
  const avgPartySize = totalBookings > 0 ? totalCovers / totalBookings : 0

  return Response.json({ revenueTrend, topItems, sessions, totalRevenue, totalCovers, totalBookings, avgPartySize })
}
