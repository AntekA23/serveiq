import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Play } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import useAuthStore from '../../store/authStore'
import { getDemoUser, DEMO_TOKEN } from '../../services/demoData'
import useToast from '../../hooks/useToast'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import './Register.css'

const schema = z.object({
  firstName: z.string().min(2, 'Imie musi miec co najmniej 2 znaki'),
  lastName: z.string().min(2, 'Nazwisko musi miec co najmniej 2 znaki'),
  email: z.string().min(1, 'Email jest wymagany').email('Nieprawidlowy adres email'),
  password: z.string().min(6, 'Haslo musi miec co najmniej 6 znakow'),
  confirmPassword: z.string().min(1, 'Potwierdz haslo'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasla musza sie zgadzac',
  path: ['confirmPassword'],
})

export default function Register() {
  const navigate = useNavigate()
  const { register: registerUser, login } = useAuth()
  const toast = useToast()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState('parent')

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
      const { confirmPassword, ...data } = formData
      await registerUser({
        ...data,
        role,
      })
      await login(data.email, data.password)
      toast.success('Konto utworzone! Witamy w ServeIQ.')
      navigate(role === 'coach' ? '/coach/dashboard' : '/parent/onboarding')
    } catch (err) {
      setError(err.response?.data?.message || 'Wystapil blad podczas rejestracji')
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = () => {
    const demoUser = getDemoUser()
    useAuthStore.getState().setAuth(demoUser, DEMO_TOKEN)
    navigate('/parent/dashboard')
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-logo">SERVE<span style={{ color: 'var(--color-text)' }}>IQ</span></div>
        <div className="register-subtitle">Utworz konto</div>

        {/* Role selector */}
        <div className="register-role-selector">
          <button type="button" className={`register-role-btn ${role === 'parent' ? 'active' : ''}`} onClick={() => setRole('parent')}>
            Rodzic
          </button>
          <button type="button" className={`register-role-btn ${role === 'coach' ? 'active' : ''}`} onClick={() => setRole('coach')}>
            Trener
          </button>
        </div>

        {error && <div className="register-error">{error}</div>}

        <form className="register-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="register-row">
            <Input
              label="Imie"
              placeholder="Jan"
              icon={User}
              register={register('firstName')}
              error={errors.firstName?.message}
            />
            <Input
              label="Nazwisko"
              placeholder="Kowalski"
              icon={User}
              register={register('lastName')}
              error={errors.lastName?.message}
            />
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="jan@example.com"
            icon={Mail}
            register={register('email')}
            error={errors.email?.message}
          />

          <div className="register-row">
            <Input
              label="Haslo"
              type="password"
              placeholder="Min. 6 znakow"
              icon={Lock}
              register={register('password')}
              error={errors.password?.message}
            />
            <Input
              label="Potwierdz haslo"
              type="password"
              placeholder="Powtorz haslo"
              icon={Lock}
              register={register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
          </div>

          <Button type="submit" variant="primary" loading={loading}>
            Zarejestruj sie
          </Button>
        </form>

        <div className="register-divider">
          <span>lub</span>
        </div>

        <button className="register-demo-btn" onClick={handleDemo}>
          <Play size={16} />
          Tryb demo — zobacz dashboard
        </button>

        <div className="register-links">
          <Link to="/login">Masz juz konto? Zaloguj sie</Link>
        </div>
      </div>
    </div>
  )
}
