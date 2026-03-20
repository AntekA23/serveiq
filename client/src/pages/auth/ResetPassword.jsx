import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import useToast from '../../hooks/useToast'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import './ResetPassword.css'

const schema = z.object({
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
  confirmPassword: z.string().min(1, 'Potwierdź hasło'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła muszą się zgadzać',
  path: ['confirmPassword'],
})

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { resetPassword } = useAuth()
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
      await resetPassword(token, formData.password)
      toast.success('Hasło zmienione. Zaloguj się.')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Wystąpił błąd podczas zmiany hasła')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="reset-page">
      <div className="reset-card">
        <div className="reset-logo">ServeIQ</div>
        <div className="reset-subtitle">Ustaw nowe hasło</div>

        {error && <div className="reset-error">{error}</div>}

        <form className="reset-form" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Nowe hasło"
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
          <Button type="submit" variant="primary" loading={loading}>
            Zmień hasło
          </Button>
        </form>

        <div className="reset-links">
          <Link to="/login">Wróć do logowania</Link>
        </div>
      </div>
    </div>
  )
}
