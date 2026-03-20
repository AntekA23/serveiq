import './Input.css'

export default function Input({
  label,
  error,
  type = 'text',
  placeholder,
  register,
  icon: Icon,
  ...rest
}) {
  const inputProps = register ? { ...register, ...rest } : rest

  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <div className={Icon ? 'input-with-icon' : undefined}>
        {Icon && <Icon size={16} className="input-icon" />}
        <input
          type={type}
          placeholder={placeholder}
          className={`input${error ? ' input-error' : ''}`}
          {...inputProps}
        />
      </div>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  )
}
