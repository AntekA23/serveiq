import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Mail, CheckCircle } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import './ForgotPassword.css'

const schema = z.object({
  email: z.string().min(1, 'Email jest wymagany').email('Nieprawidłowy adres email'),
})

export default function ForgotPassword() {
  const { forgotPassword } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

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
      await forgotPassword(formData.email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Wystąpił błąd')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        <div className="forgot-logo">ServeIQ</div>

        {sent ? (
          <div className="forgot-success">
            <div className="forgot-success-icon">
              <CheckCircle size={48} />
            </div>
            <div className="forgot-success-text">
              Sprawdź swoją skrzynkę email. Wysłaliśmy link do resetowania hasła.
            </div>
          </div>
        ) : (
          <>
            <div className="forgot-subtitle">
              Wpisz adres email, a wyślemy Ci link do resetowania hasła
            </div>

            {error && <div className="forgot-error">{error}</div>}

            <form className="forgot-form" onSubmit={handleSubmit(onSubmit)}>
              <Input
                label="Email"
                type="email"
                placeholder="jan@example.com"
                icon={Mail}
                register={register('email')}
                error={errors.email?.message}
              />
              <Button type="submit" variant="primary" loading={loading}>
                Wyślij link
              </Button>
            </form>
          </>
        )}

        <div className="forgot-links">
          <Link to="/login">Wróć do logowania</Link>
        </div>
      </div>
    </div>
  )
}
