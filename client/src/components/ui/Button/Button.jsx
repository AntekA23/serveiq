import './Button.css'

export default function Button({
  children,
  variant = 'default',
  size = 'md',
  onClick,
  disabled,
  type = 'button',
  loading = false,
  icon: Icon,
  className = '',
}) {
  const classes = [
    'btn',
    variant === 'primary' && 'btn-primary',
    variant === 'danger' && 'btn-danger',
    size === 'sm' && 'btn-sm',
    loading && 'btn-loading',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <span className="spinner" />}
      {!loading && Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  )
}
