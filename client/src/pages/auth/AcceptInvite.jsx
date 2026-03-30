import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useParams, useNavigate } from 'react-router-dom'
import { Lock, User, Phone } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import useToast from '../../hooks/useToast'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import './AcceptInvite.css'

const schema = z.object({
  firstName: z.string().min(1, 'Imie jest wymagane'),
  lastName: z.string().min(1, 'Nazwisko jest wymagane'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Haslo musi miec co najmniej 6 znakow'),
  confirmPassword: z.string().min(1, 'Potwierdz haslo'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasla musza sie zgadzac',
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
      await acceptInvite(token, formData.password, formData.firstName, formData.lastName, formData.phone)
      toast.success('Konto aktywowane!')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Wystapil blad podczas aktywacji konta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="accept-invite-page">
      <div className="accept-invite-card">
        <div className="accept-invite-logo">SERVE<span style={{ color: 'var(--color-text)' }}>IQ</span></div>
        <div className="accept-invite-subtitle">
          Witaj! Trener zaprosil Cie do ServeIQ. Uzupelnij dane i ustaw haslo.
        </div>

        {error && <div className="accept-invite-error">{error}</div>}

        <form className="accept-invite-form" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Imie"
            type="text"
            placeholder="Twoje imie"
            icon={User}
            register={register('firstName')}
            error={errors.firstName?.message}
          />
          <Input
            label="Nazwisko"
            type="text"
            placeholder="Twoje nazwisko"
            icon={User}
            register={register('lastName')}
            error={errors.lastName?.message}
          />
          <Input
            label="Telefon (opcjonalnie)"
            type="tel"
            placeholder="+48 600 000 000"
            icon={Phone}
            register={register('phone')}
            error={errors.phone?.message}
          />
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
          <Button type="submit" variant="primary" loading={loading}>
            Aktywuj konto
          </Button>
        </form>
      </div>
    </div>
  )
}
