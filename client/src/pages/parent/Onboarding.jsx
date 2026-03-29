import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User,
  Phone,
  Baby,
  Watch,
  CheckCircle2,
  ChevronRight,
  Plus,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import useToast from '../../hooks/useToast'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import './Onboarding.css'

// --- Progress Bar ---
function ProgressBar({ steps, current }) {
  return (
    <div className="onboarding-progress">
      {Array.from({ length: steps }, (_, i) => {
        const step = i + 1
        const isActive = step === current
        const isDone = step < current
        return (
          <div key={step} className="onboarding-progress-step">
            <div
              className={`onboarding-progress-dot ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
            >
              {isDone ? <CheckCircle2 size={16} /> : step}
            </div>
            {step < steps && (
              <div className={`onboarding-progress-line ${isDone ? 'done' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// --- Step 1: Profile ---
const profileSchema = z.object({
  firstName: z.string().min(2, 'Imie jest wymagane'),
  lastName: z.string().min(2, 'Nazwisko jest wymagane'),
  phone: z.string().optional(),
})

function StepProfile({ onNext, user }) {
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await api.put('/auth/profile', data)
      useAuthStore.getState().setUser({ ...user, ...data })
      onNext()
    } catch (err) {
      toast.error('Nie udalo sie zapisac danych')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="onboarding-step-card">
      <div className="onboarding-step-icon">
        <User size={28} />
      </div>
      <h2 className="onboarding-step-title">Twoje dane</h2>
      <p className="onboarding-step-desc">Sprawdz i uzupelnij swoje dane kontaktowe</p>

      <form className="onboarding-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="onboarding-form-row">
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
          label="Telefon (opcjonalnie)"
          type="tel"
          placeholder="+48 123 456 789"
          icon={Phone}
          register={register('phone')}
          error={errors.phone?.message}
        />
        <Button type="submit" variant="primary" loading={loading}>
          Dalej
          <ChevronRight size={16} />
        </Button>
      </form>
    </div>
  )
}

// --- Step 2: Add Child ---
const childSchema = z.object({
  firstName: z.string().min(2, 'Imie dziecka jest wymagane'),
  lastName: z.string().min(2, 'Nazwisko dziecka jest wymagane'),
  dateOfBirth: z.string().min(1, 'Data urodzenia jest wymagana'),
  gender: z.enum(['M', 'F'], { required_error: 'Wybierz plec' }),
})

function StepChild({ onNext, onChildCreated }) {
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(childSchema),
  })

  const selectedGender = watch('gender')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await api.post('/players/self', data)
      const player = res.data.player || res.data
      if (player?._id) onChildCreated(player._id)
      onNext()
    } catch (err) {
      toast.error('Nie udalo sie dodac dziecka')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="onboarding-step-card">
      <div className="onboarding-step-icon">
        <Baby size={28} />
      </div>
      <h2 className="onboarding-step-title">Dodaj dziecko</h2>
      <p className="onboarding-step-desc">Podaj dane Twojego dziecka</p>

      <form className="onboarding-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="onboarding-form-row">
          <Input
            label="Imie"
            placeholder="Kacper"
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
          label="Data urodzenia"
          type="date"
          register={register('dateOfBirth')}
          error={errors.dateOfBirth?.message}
        />

        <div className="input-group">
          <label className="input-label">Plec</label>
          <div className="onboarding-gender-row">
            <button
              type="button"
              className={`onboarding-gender-btn ${selectedGender === 'M' ? 'active' : ''}`}
              onClick={() => setValue('gender', 'M', { shouldValidate: true })}
            >
              Chlopiec
            </button>
            <button
              type="button"
              className={`onboarding-gender-btn ${selectedGender === 'F' ? 'active' : ''}`}
              onClick={() => setValue('gender', 'F', { shouldValidate: true })}
            >
              Dziewczynka
            </button>
          </div>
          {errors.gender && <span className="input-error-text">{errors.gender.message}</span>}
        </div>

        <Button type="submit" variant="primary" loading={loading}>
          Dalej
          <ChevronRight size={16} />
        </Button>
      </form>
    </div>
  )
}

// --- Step 3: Connect Device ---
const PROVIDERS = {
  whoop: {
    name: 'WHOOP',
    color: 'var(--color-whoop)',
    bg: 'var(--color-whoop-bg)',
    description: 'Monitoruj regeneracje, obciazenie i sen z opaski WHOOP.',
  },
  garmin: {
    name: 'Garmin',
    color: 'var(--color-garmin)',
    bg: 'var(--color-garmin-bg)',
    description: 'Sledz aktywnosc, Body Battery i stres z zegarka Garmin.',
  },
}

function StepDevice({ onNext, childId }) {
  const [connecting, setConnecting] = useState(null)
  const [connected, setConnected] = useState([])
  const toast = useToast()

  const handleConnect = async (provider) => {
    if (!childId) {
      toast.error('Najpierw dodaj dziecko')
      return
    }
    setConnecting(provider)
    try {
      await api.post('/wearables', { provider, deviceName: PROVIDERS[provider].name, playerId: childId })
      setConnected((prev) => [...prev, provider])
      toast.success(`Polaczono z ${PROVIDERS[provider].name}`)
    } catch {
      toast.error('Nie udalo sie polaczyc urzadzenia')
    } finally {
      setConnecting(null)
    }
  }

  return (
    <div className="onboarding-step-card">
      <div className="onboarding-step-icon">
        <Watch size={28} />
      </div>
      <h2 className="onboarding-step-title">Polacz urzadzenie</h2>
      <p className="onboarding-step-desc">Polacz opaske lub zegarek aby sledzic dane zdrowotne</p>

      <div className="onboarding-devices-grid">
        {Object.entries(PROVIDERS).map(([key, info]) => {
          const isConnected = connected.includes(key)
          return (
            <div
              key={key}
              className={`onboarding-device-card ${isConnected ? 'connected' : ''}`}
              style={{ '--provider-color': info.color, '--provider-bg': info.bg }}
            >
              <div className="onboarding-device-icon">
                {isConnected ? <CheckCircle2 size={24} /> : <Watch size={24} />}
              </div>
              <div className="onboarding-device-name">{info.name}</div>
              <div className="onboarding-device-desc">{info.description}</div>
              {isConnected ? (
                <div className="onboarding-device-connected">Polaczono</div>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleConnect(key)}
                  loading={connecting === key}
                >
                  <Plus size={14} />
                  Polacz
                </Button>
              )}
            </div>
          )
        })}
      </div>

      <div className="onboarding-device-actions">
        <Button variant="primary" onClick={onNext}>
          Dalej
          <ChevronRight size={16} />
        </Button>
        <button className="onboarding-skip-btn" onClick={onNext}>
          Polacze pozniej
        </button>
      </div>
    </div>
  )
}

// --- Step 4: Complete ---
function StepComplete() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const user = useAuthStore((s) => s.user)
  const toast = useToast()

  const handleFinish = async () => {
    setLoading(true)
    try {
      await api.put('/auth/onboarding')
      useAuthStore.getState().setUser({ ...user, onboardingCompleted: true })
      toast.success('Witamy w ServeIQ!')
      navigate('/parent/dashboard')
    } catch {
      toast.error('Wystapil blad')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="onboarding-step-card onboarding-complete">
      <div className="onboarding-complete-check">
        <CheckCircle2 size={64} />
      </div>
      <h2 className="onboarding-step-title">Gotowe!</h2>
      <p className="onboarding-complete-msg">
        Witaj w ServeIQ, {user?.firstName}! Twoje konto jest gotowe.
        Zaraz przekierujemy Cie do dashboardu.
      </p>
      <Button variant="primary" onClick={handleFinish} loading={loading}>
        Przejdz do dashboardu
      </Button>
    </div>
  )
}

// --- Main Onboarding ---
export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [childId, setChildId] = useState(null)
  const user = useAuthStore((s) => s.user)

  const handleNext = () => setStep((s) => Math.min(s + 1, 4))

  return (
    <div className="onboarding">
      <div className="onboarding-header">
        <div className="onboarding-logo">SERVE<span style={{ color: 'var(--color-text)' }}>IQ</span></div>
      </div>
      <ProgressBar steps={4} current={step} />
      <div className="onboarding-content">
        {step === 1 && <StepProfile onNext={handleNext} user={user} />}
        {step === 2 && <StepChild onNext={handleNext} onChildCreated={setChildId} />}
        {step === 3 && <StepDevice onNext={handleNext} childId={childId} />}
        {step === 4 && <StepComplete />}
      </div>
    </div>
  )
}
