import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User,
  Lock,
  Bell,
  Save,
  Trash2,
  Phone,
  Mail,
  AlertTriangle,
  X,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import useAuth from '../../hooks/useAuth'
import useToast from '../../hooks/useToast'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import './Settings.css'

const TABS = [
  { key: 'profile', label: 'Profil', icon: User },
  { key: 'security', label: 'Bezpieczenstwo', icon: Lock },
  { key: 'notifications', label: 'Powiadomienia', icon: Bell },
]

// --- Profile Tab ---
const profileSchema = z.object({
  firstName: z.string().min(2, 'Imie jest wymagane'),
  lastName: z.string().min(2, 'Nazwisko jest wymagane'),
  phone: z.string().optional(),
})

function TabProfile() {
  const user = useAuthStore((s) => s.user)
  const toast = useToast()
  const [loading, setLoading] = useState(false)

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
      toast.success('Profil zaktualizowany')
    } catch {
      toast.error('Nie udalo sie zapisac zmian')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="settings-section" onSubmit={handleSubmit(onSubmit)}>
      <div className="settings-section-title">Dane osobowe</div>
      <div className="settings-form-row">
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
      <Button type="submit" variant="primary" loading={loading}>
        <Save size={16} />
        Zapisz zmiany
      </Button>
    </form>
  )
}

// --- Security Tab ---
const passwordSchema = z.object({
  oldPassword: z.string().min(1, 'Wprowadz aktualne haslo'),
  newPassword: z.string().min(6, 'Nowe haslo musi miec co najmniej 6 znakow'),
  confirmPassword: z.string().min(1, 'Potwierdz haslo'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Hasla musza sie zgadzac',
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
      toast.success('Haslo zostalo zmienione')
      reset()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Nie udalo sie zmienic hasla')
    } finally {
      setLoadingPw(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete('/auth/account')
      toast.success('Konto zostalo usuniete')
      await logout()
    } catch {
      toast.error('Nie udalo sie usunac konta')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <>
      <form className="settings-section" onSubmit={handleSubmit(onSubmitPassword)}>
        <div className="settings-section-title">Zmien haslo</div>
        <Input
          label="Aktualne haslo"
          type="password"
          placeholder="Wprowadz haslo"
          icon={Lock}
          register={register('oldPassword')}
          error={errors.oldPassword?.message}
        />
        <div className="settings-form-row">
          <Input
            label="Nowe haslo"
            type="password"
            placeholder="Min. 6 znakow"
            icon={Lock}
            register={register('newPassword')}
            error={errors.newPassword?.message}
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
        <Button type="submit" variant="primary" loading={loadingPw}>
          <Save size={16} />
          Zmien haslo
        </Button>
      </form>

      <div className="settings-section settings-danger-zone">
        <div className="settings-section-title settings-danger-title">Strefa niebezpieczna</div>
        <p className="settings-danger-desc">
          Usuniesz swoje konto i wszystkie powiazane dane. Ta operacja jest nieodwracalna.
        </p>
        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
          <Trash2 size={16} />
          Usun konto
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
            <h3>Usunac konto?</h3>
            <p>Ta operacja jest nieodwracalna. Wszystkie Twoje dane, dzieci i ustawienia zostana trwale usuniete.</p>
            <div className="settings-delete-modal-actions">
              <Button variant="danger" onClick={handleDelete} loading={deleting}>
                Tak, usun konto
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

// --- Notifications Tab ---
function TabNotifications() {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    weeklyEmail: true,
    pushNotifications: true,
    criticalThreshold: 30,
    warningThreshold: 50,
    minSleepHours: 7,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  })

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSlider = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: Number(value) }))
  }

  const handleTime = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.put('/auth/notification-settings', settings)
      toast.success('Ustawienia powiadomien zapisane')
    } catch {
      toast.error('Nie udalo sie zapisac ustawien')
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
          <div className="settings-toggle-desc">Powiadomienia w przegladarce</div>
        </div>
        <button
          className={`settings-toggle ${settings.pushNotifications ? 'active' : ''}`}
          onClick={() => handleToggle('pushNotifications')}
        >
          <span className="settings-toggle-knob" />
        </button>
      </div>

      <div className="settings-divider" />

      <div className="settings-slider-row">
        <div className="settings-slider-info">
          <div className="settings-toggle-label">Alert regeneracji (krytyczny)</div>
          <div className="settings-toggle-desc">Powiadom gdy regeneracja spadnie ponizej</div>
        </div>
        <div className="settings-slider-control">
          <input
            type="range"
            min="10"
            max="60"
            value={settings.criticalThreshold}
            onChange={(e) => handleSlider('criticalThreshold', e.target.value)}
            className="settings-slider"
          />
          <span className="settings-slider-value settings-slider-value--red">{settings.criticalThreshold}%</span>
        </div>
      </div>

      <div className="settings-slider-row">
        <div className="settings-slider-info">
          <div className="settings-toggle-label">Alert regeneracji (ostrzezenie)</div>
          <div className="settings-toggle-desc">Powiadom gdy regeneracja spadnie ponizej</div>
        </div>
        <div className="settings-slider-control">
          <input
            type="range"
            min="30"
            max="80"
            value={settings.warningThreshold}
            onChange={(e) => handleSlider('warningThreshold', e.target.value)}
            className="settings-slider"
          />
          <span className="settings-slider-value settings-slider-value--amber">{settings.warningThreshold}%</span>
        </div>
      </div>

      <div className="settings-slider-row">
        <div className="settings-slider-info">
          <div className="settings-toggle-label">Minimalny czas snu</div>
          <div className="settings-toggle-desc">Powiadom gdy sen jest krotszy niz</div>
        </div>
        <div className="settings-slider-control">
          <input
            type="range"
            min="5"
            max="10"
            step="0.5"
            value={settings.minSleepHours}
            onChange={(e) => handleSlider('minSleepHours', e.target.value)}
            className="settings-slider"
          />
          <span className="settings-slider-value">{settings.minSleepHours}h</span>
        </div>
      </div>

      <div className="settings-divider" />

      <div className="settings-quiet-hours">
        <div className="settings-toggle-label">Godziny ciszy</div>
        <div className="settings-toggle-desc">Brak powiadomien w tym przedziale</div>
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

// --- Main Settings ---
export default function Settings() {
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
