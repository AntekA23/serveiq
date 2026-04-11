import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User, Lock, Bell, Save, Trash2, Phone, Mail,
  AlertTriangle, X,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import useAuth from '../../hooks/useAuth'
import useToast from '../../hooks/useToast'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import './Settings.css'

// ────────────────────────────────────────────
// Profile Tab (shared)
// ────────────────────────────────────────────
const profileSchema = z.object({
  firstName: z.string().min(2, 'Imię jest wymagane'),
  lastName: z.string().min(2, 'Nazwisko jest wymagane'),
  phone: z.string().optional(),
})

const coachProfileSchema = profileSchema.extend({
  specialization: z.string().optional(),
  itfLevel: z.string().optional(),
  bio: z.string().max(500).optional(),
})

function TabProfile() {
  const user = useAuthStore((s) => s.user)
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const isCoach = user?.role === 'coach'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isCoach ? coachProfileSchema : profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      specialization: user?.coachProfile?.specialization || '',
      itfLevel: user?.coachProfile?.itfLevel || '',
      bio: user?.coachProfile?.bio || '',
    },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      }
      if (isCoach) {
        payload.coachProfile = {
          specialization: data.specialization,
          itfLevel: data.itfLevel,
          bio: data.bio,
        }
      }
      await api.put('/auth/profile', payload)
      useAuthStore.getState().setUser({
        ...user,
        ...payload,
        coachProfile: isCoach ? { ...user.coachProfile, ...payload.coachProfile } : user.coachProfile,
      })
      toast.success('Profil zaktualizowany')
    } catch {
      toast.error('Nie udało się zapisać zmian')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="settings-section" onSubmit={handleSubmit(onSubmit)}>
      <div className="settings-section-title">Dane osobowe</div>
      <div className="settings-form-row">
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
        label="Telefon"
        type="tel"
        placeholder="+48 123 456 789"
        icon={Phone}
        register={register('phone')}
        error={errors.phone?.message}
      />
      <div className="settings-form-info">
        <Mail size={14} />
        <span>Email: {user?.email}</span>
      </div>

      {isCoach && (
        <>
          <div className="settings-divider" />
          <div className="settings-section-title">Profil trenera</div>
          <div className="settings-form-row">
            <Input
              label="Specjalizacja"
              placeholder="np. Tenis juniorów"
              register={register('specialization')}
              error={errors.specialization?.message}
            />
            <Input
              label="Poziom ITF"
              placeholder="np. ITF Level 2"
              register={register('itfLevel')}
              error={errors.itfLevel?.message}
            />
          </div>
          <div className="settings-textarea-group">
            <label className="input-label">Bio</label>
            <textarea
              {...register('bio')}
              placeholder="Krótki opis o sobie — rodzice zobaczą to przy wpisywaniu kodu zaproszenia"
              maxLength={500}
              rows={3}
              className="settings-textarea"
            />
            {errors.bio && <span className="input-error">{errors.bio.message}</span>}
          </div>
        </>
      )}

      <Button type="submit" variant="primary" loading={loading}>
        <Save size={16} />
        Zapisz zmiany
      </Button>
    </form>
  )
}

// ────────────────────────────────────────────
// Invite Code Tab (coach only)
// ────────────────────────────────────────────
// ────────────────────────────────────────────
// Security Tab (shared)
// ────────────────────────────────────────────
const passwordSchema = z.object({
  oldPassword: z.string().min(1, 'Wprowadź aktualne hasło'),
  newPassword: z.string().min(6, 'Nowe hasło musi mieć co najmniej 6 znaków'),
  confirmPassword: z.string().min(1, 'Potwierdź hasło'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Hasła muszą się zgadzać',
  path: ['confirmPassword'],
})

function TabSecurity() {
  const toast = useToast()
  const { logout } = useAuth()
  const [loadingPw, setLoadingPw] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  })

  const onSubmitPassword = async (data) => {
    setLoadingPw(true)
    try {
      await api.put('/auth/change-password', {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      })
      toast.success('Hasło zostało zmienione')
      reset()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Nie udało się zmienić hasła')
    } finally {
      setLoadingPw(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete('/auth/account')
      toast.success('Konto zostało usunięte')
      await logout()
    } catch {
      toast.error('Nie udało się usunąć konta')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <>
      <form className="settings-section" onSubmit={handleSubmit(onSubmitPassword)}>
        <div className="settings-section-title">Zmień hasło</div>
        <Input
          label="Aktualne hasło"
          type="password"
          placeholder="Wprowadź hasło"
          icon={Lock}
          register={register('oldPassword')}
          error={errors.oldPassword?.message}
        />
        <div className="settings-form-row">
          <Input
            label="Nowe hasło"
            type="password"
            placeholder="Min. 6 znaków"
            icon={Lock}
            register={register('newPassword')}
            error={errors.newPassword?.message}
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
        <Button type="submit" variant="primary" loading={loadingPw}>
          <Save size={16} />
          Zmień hasło
        </Button>
      </form>

      <div className="settings-section settings-danger-zone">
        <div className="settings-section-title settings-danger-title">Strefa niebezpieczna</div>
        <p className="settings-danger-desc">
          Usuniesz swoje konto i wszystkie powiązane dane. Ta operacja jest nieodwracalna.
        </p>
        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
          <Trash2 size={16} />
          Usuń konto
        </Button>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="settings-delete-modal" onClick={(e) => e.stopPropagation()}>
            <button className="settings-delete-modal-close" onClick={() => setShowDeleteModal(false)}>
              <X size={18} />
            </button>
            <div className="settings-delete-modal-icon">
              <AlertTriangle size={32} />
            </div>
            <h3>Usunąć konto?</h3>
            <p>Ta operacja jest nieodwracalna. Wszystkie Twoje dane, dzieci i ustawienia zostaną trwale usunięte.</p>
            <div className="settings-delete-modal-actions">
              <Button variant="danger" onClick={handleDelete} loading={deleting}>
                Tak, usuń konto
              </Button>
              <Button onClick={() => setShowDeleteModal(false)}>
                Anuluj
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ────────────────────────────────────────────
// Notifications Tab (shared)
// ────────────────────────────────────────────
function TabNotifications() {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    weeklyEmail: true,
    pushNotifications: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  })

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleTime = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.put('/auth/notification-settings', settings)
      toast.success('Ustawienia powiadomień zapisane')
    } catch {
      toast.error('Nie udało się zapisać ustawień')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="settings-section">
      <div className="settings-section-title">Powiadomienia</div>

      <div className="settings-toggle-row">
        <div className="settings-toggle-info">
          <div className="settings-toggle-label">Email tygodniowy</div>
          <div className="settings-toggle-desc">Podsumowanie tygodnia na email</div>
        </div>
        <button
          className={`settings-toggle ${settings.weeklyEmail ? 'active' : ''}`}
          onClick={() => handleToggle('weeklyEmail')}
        >
          <span className="settings-toggle-knob" />
        </button>
      </div>

      <div className="settings-toggle-row">
        <div className="settings-toggle-info">
          <div className="settings-toggle-label">Powiadomienia push</div>
          <div className="settings-toggle-desc">Powiadomienia w przeglądarce</div>
        </div>
        <button
          className={`settings-toggle ${settings.pushNotifications ? 'active' : ''}`}
          onClick={() => handleToggle('pushNotifications')}
        >
          <span className="settings-toggle-knob" />
        </button>
      </div>

      <div className="settings-divider" />

      <div className="settings-quiet-hours">
        <div className="settings-toggle-label">Godziny ciszy</div>
        <div className="settings-toggle-desc">Brak powiadomień w tym przedziale</div>
        <div className="settings-quiet-hours-row">
          <div className="settings-time-field">
            <label className="input-label">Od</label>
            <input
              type="time"
              className="input"
              value={settings.quietHoursStart}
              onChange={(e) => handleTime('quietHoursStart', e.target.value)}
            />
          </div>
          <div className="settings-time-field">
            <label className="input-label">Do</label>
            <input
              type="time"
              className="input"
              value={settings.quietHoursEnd}
              onChange={(e) => handleTime('quietHoursEnd', e.target.value)}
            />
          </div>
        </div>
      </div>

      <Button variant="primary" onClick={handleSave} loading={loading}>
        <Save size={16} />
        Zapisz ustawienia
      </Button>
    </div>
  )
}

// ────────────────────────────────────────────
// Main Settings
// ────────────────────────────────────────────
export default function Settings() {
  const TABS = [
    { key: 'profile', label: 'Profil', icon: User },
    { key: 'security', label: 'Bezpieczeństwo', icon: Lock },
    { key: 'notifications', label: 'Powiadomienia', icon: Bell },
  ]

  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div className="settings-page">
      <h1 className="page-title">Ustawienia</h1>

      <div className="settings-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`settings-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-content">
        {activeTab === 'profile' && <TabProfile />}
        {activeTab === 'security' && <TabSecurity />}
        {activeTab === 'notifications' && <TabNotifications />}
      </div>
    </div>
  )
}
