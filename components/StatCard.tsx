interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  color?: string
}

export default function StatCard({ title, value, subtitle, color = '#1a1a1a' }: StatCardProps) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      borderTop: `4px solid ${color}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <p style={{ color: '#666', fontSize: '14px', margin: '0 0 8px 0' }}>{title}</p>
      <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color }}>{value}</p>
      {subtitle && <p style={{ color: '#999', fontSize: '12px', margin: '8px 0 0 0' }}>{subtitle}</p>}
    </div>
  )
}