import { supabase } from '@/lib/supabase'

export async function GET() {
  // Get completed bookings for last 7 days
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, booking_items(quantity, price_at_time)')
    .eq('status', 'completed')
    .gte('booking_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('booking_date', { ascending: true })

  // Get all menu items to calculate costs
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')

  // Calculate totals
  const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0
  const totalExpenses = totalRevenue * 0.4 // Simplified: 40% cost ratio
  const totalProfit = totalRevenue - totalExpenses

  // Group by date for chart
  const revenueByDay = bookings?.reduce((acc, booking) => {
    const date = booking.booking_date
    if (!acc[date]) acc[date] = { date, revenue: 0, expenses: 0 }
    acc[date].revenue += booking.total_amount || 0
    acc[date].expenses += (booking.total_amount || 0) * 0.4
    return acc
  }, {})

  const chartData = Object.values(revenueByDay || {})

  // Today's bookings
  const today = new Date().toISOString().split('T')[0]
  const { data: todayBookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('booking_date', today)

  return Response.json({
    totalRevenue,
    totalExpenses,
    totalProfit,
    chartData,
    todayBookings: todayBookings?.length || 0,
    todayCovers: todayBookings?.reduce((sum, b) => sum + b.party_size, 0) || 0
  })
}