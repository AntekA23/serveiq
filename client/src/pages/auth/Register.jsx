import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Phone } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import useToast from '../../hooks/useToast'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import './Register.css'

const schema = z.object({
  firstName: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki'),
  lastName: z.string().min(2, 'Nazwisko musi mieć co najmniej 2 znaki'),
  email: z.string().min(1, 'Email jest wymagany').email('Nieprawidłowy adres email'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
  confirmPassword: z.string().min(1, 'Potwierdź hasło'),
  club: z.string().optional(),
  itfLevel: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła muszą się zgadzać',
  path: ['confirmPassword'],
})

export default function Register() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const toast = useToast()
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
      const { confirmPassword, club, itfLevel, ...data } = formData
      await registerUser({
        ...data,
        role: 'coach',
        coachProfile: { club: club || undefined, itfLevel: itfLevel || undefined },
      })
      toast.success('Konto utworzone. Zaloguj się.')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Wystąpił błąd podczas rejestracji')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-logo">ServeIQ</div>
        <div className="register-subtitle">Utwórz konto trenera</div>

        {error && <div className="register-error">{error}</div>}

        <form className="register-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="register-row">
            <Input
              label="Imię"
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

          <Input
            label="Telefon (opcjonalnie)"
            type="tel"
            placeholder="+48 123 456 789"
            icon={Phone}
            register={register('phone')}
            error={errors.phone?.message}
          />

          <div className="register-row">
            <Input
              label="Hasło"
              type="password"
              placeholder="Min. 6 znaków"
              icon={Lock}
              register={register('password')}
              error={errors.password?.message}
            />
            <Input
              label="Potwierdź hasło"
              type="password"
              placeholder="Powtórz hasło"
              icon={Lock}
              register={register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
          </div>

          <div className="register-row">
            <Input
              label="Nazwa klubu (opcjonalnie)"
              placeholder="Klub tenisowy"
              register={register('club')}
            />
            <div className="input-group">
              <label className="input-label">Poziom ITF (opcjonalnie)</label>
              <select className="input" {...register('itfLevel')}>
                <option value="">Wybierz poziom</option>
                <option value="1">Poziom 1</option>
                <option value="2">Poziom 2</option>
                <option value="3">Poziom 3</option>
              </select>
            </div>
          </div>

          <Button type="submit" variant="primary" loading={loading}>
            Zarejestruj się
          </Button>
        </form>

        <div className="register-links">
          <Link to="/login">Masz już konto? Zaloguj się</Link>
        </div>
      </div>
    </div>
  )
}
