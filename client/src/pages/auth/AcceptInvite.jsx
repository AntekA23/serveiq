import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useParams, useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import useToast from '../../hooks/useToast'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import './AcceptInvite.css'

const schema = z.object({
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
  confirmPassword: z.string().min(1, 'Potwierdź hasło'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła muszą się zgadzać',
  path: ['confirmPassword'],
})

export default function AcceptInvite() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { acceptInvite } = useAuth()
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
      await acceptInvite(token, formData.password)
      toast.success('Konto aktywowane. Zaloguj się.')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Wystąpił błąd podczas aktywacji konta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="accept-invite-page">
      <div className="accept-invite-card">
        <div className="accept-invite-logo">ServeIQ</div>
        <div className="accept-invite-subtitle">
          Witaj! Trener zaprosił Cię do ServeIQ. Ustaw hasło, aby aktywować konto.
        </div>

        {error && <div className="accept-invite-error">{error}</div>}

        <form className="accept-invite-form" onSubmit={handleSubmit(onSubmit)}>
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
          <Button type="submit" variant="primary" loading={loading}>
            Aktywuj konto
          </Button>
        </form>
      </div>
    </div>
  )
}
