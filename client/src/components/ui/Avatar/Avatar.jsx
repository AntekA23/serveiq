import './Avatar.css'

export default function Avatar({ firstName, lastName, size = 32, role = 'coach', src }) {
  const initials = `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`
  const fontSize = Math.round(size * 0.38)

  return (
    <div
      className={`avatar avatar-${role}`}
      style={{ width: size, height: size, fontSize }}
    >
      {src ? (
        <img src={src} alt={`${firstName} ${lastName}`} />
      ) : (
        initials
      )}
    </div>
  )
}
