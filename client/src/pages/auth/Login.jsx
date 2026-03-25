import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import useAuthStore from '../../store/authStore'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import './Login.css'

const schema = z.object({
  email: z.string().min(1, 'Email jest wymagany').email('Nieprawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
})

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (formData) => {
    setError('')
    setLoading(true)
    try {
      const data = await login(formData.email, formData.password)
      const user = data.user || useAuthStore.getState().user
      if (user?.role === 'coach') {
        navigate('/coach/dashboard')
      } else {
        navigate('/parent/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Wystąpił błąd podczas logowania')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">SERVE<span style={{ color: 'var(--color-text)' }}>IQ</span></div>
        <div className="login-subtitle">Zaloguj się do swojego konta</div>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Email"
            type="email"
            placeholder="jan@example.com"
            icon={Mail}
            register={register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Hasło"
            type="password"
            placeholder="Twoje hasło"
            icon={Lock}
            register={register('password')}
            error={errors.password?.message}
          />
          <Button type="submit" variant="primary" loading={loading}>
            Zaloguj się
          </Button>
        </form>

        <div className="login-links">
          <Link to="/forgot-password">Zapomniałeś hasła?</Link>
          <Link to="/register">Nie masz konta? Zarejestruj się</Link>
        </div>
      </div>
    </div>
  )
}
