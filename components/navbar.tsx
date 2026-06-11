import Link from 'next/link'

const links = [
  { href: '/', label: '📊 Dashboard' },
  { href: '/bookings', label: '📅 Bookings' },
  { href: '/menu', label: '🍕 Menu Prices' },
  { href: '/market', label: '🛒 Market Prices' }
]

export default function Navbar() {
  return (
    <nav style={{
      backgroundColor: '#1a1a1a',
      padding: '0 40px',
      display: 'flex',
      alignItems: 'center',
      gap: '30px',
      height: '60px'
    }}>
      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', marginRight: '20px' }}>
        🍽️ RestaurantOS
      </span>
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          style={{ color: '#aaa', textDecoration: 'none', fontSize: '14px' }}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}