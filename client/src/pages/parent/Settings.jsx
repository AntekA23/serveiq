import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User, Lock, Bell, Save, Trash2, Phone, Mail,
  AlertTriangle, X, Link2, Copy, RefreshCw, ToggleLeft, ToggleRight,
  CheckCircle, XCircle, Building2, LogOut as LogOutIcon,
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
// Invite Code Tab (coach only)
// ────────────────────────────────────────────
function TabInviteCode() {
  const [code, setCode] = useState('')
  const [active, setActive] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [requests, setRequests] = useState([])
  const [responding, setResponding] = useState(null)
  const toast = useToast()

  const fetchRequests = async () => {
    try {
      const res = await api.get('/coach-links/requests?status=pending')
      setRequests(res.data.requests || [])
    } catch { /* silent */ }
  }

  useEffect(() => {
    api.get('/coach-links/my-code')
      .then((res) => {
        setCode(res.data.inviteCode || '')
        setActive(res.data.inviteActive)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
    fetchRequests()
  }, [])

  const handleRespond = async (id, status) => {
    setResponding(id)
    try {
      await api.put(`/coach-links/requests/${id}`, { status })
      setRequests((prev) => prev.filter((r) => r._id !== id))
      toast.success(status === 'accepted' ? 'Zaakceptowano' : 'Odrzucono')
    } catch {
      toast.error('Nie udalo sie odpowiedziec')
    } finally {
      setResponding(null)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Kod skopiowany')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = async () => {
    setResetting(true)
    try {
      const res = await api.post('/coach-links/reset-code')
      setCode(res.data.inviteCode)
      toast.success('Wygenerowano nowy kod')
    } catch {
      toast.error('Nie udało się zresetować kodu')
    } finally {
      setResetting(false)
    }
  }

  const handleToggle = async () => {
    try {
      const res = await api.patch('/coach-links/toggle-code')
      setActive(res.data.inviteActive)
      toast.success(res.data.inviteActive ? 'Kod aktywowany' : 'Kod dezaktywowany')
    } catch {
      toast.error('Nie udało się zmienić statusu kodu')
    }
  }

  if (!loaded) return <div className="settings-section"><p>Ładowanie...</p></div>

  return (
    <div className="settings-section">
      <div className="settings-section-title">Kod zaproszenia dla rodziców</div>
      <p className="settings-invite-desc">
        Podaj ten kod rodzicowi — wpisze go w aplikacji, wybierze dziecko i wyśle prośbę o dołączenie.
        Ty decydujesz czy zaakceptować.
      </p>

      <div className={`settings-invite-code-box ${!active ? 'inactive' : ''}`}>
        <span className="settings-invite-code">{active ? code : '--------'}</span>
      </div>

      <div className="settings-invite-status">
        <span className={`settings-invite-dot ${active ? 'active' : ''}`} />
        <span>{active ? 'Aktywny — rodzice mogą dołączać' : 'Nieaktywny — kod nie działa'}</span>
      </div>

      <div className="settings-invite-actions">
        <Button variant="primary" size="sm" onClick={handleCopy} disabled={!active}>
          <Copy size={14} /> {copied ? 'Skopiowano!' : 'Kopiuj kod'}
        </Button>
        <Button size="sm" onClick={handleReset} loading={resetting}>
          <RefreshCw size={14} /> Nowy kod
        </Button>
        <Button size="sm" onClick={handleToggle}>
          {active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
          {active ? 'Wyłącz' : 'Włącz'}
        </Button>
      </div>

      <div className="settings-invite-hint">
        Po wygenerowaniu nowego kodu stary przestaje działać. Istniejące połączenia zostają.
      </div>

      {requests.length > 0 && (
        <>
          <div className="settings-divider" />
          <div className="settings-section-title">
            Oczekujące prośby <span className="settings-requests-badge">{requests.length}</span>
          </div>
          <div className="settings-requests-list">
            {requests.map((req) => (
              <div key={req._id} className="settings-request-card">
                <div className="settings-request-info">
                  <div className="settings-request-name">{req.parent?.firstName} {req.parent?.lastName}</div>
                  <div className="settings-request-email">{req.parent?.email}</div>
                  {req.players?.length > 0 && (
                    <div className="settings-request-players">
                      Dzieci: {req.players.map((p) => `${p.firstName} ${p.lastName}`).join(', ')}
                    </div>
                  )}
                  {req.message && (
                    <div className="settings-request-message">&ldquo;{req.message}&rdquo;</div>
                  )}
                </div>
                <div className="settings-request-actions">
                  <button className="settings-request-accept" onClick={() => handleRespond(req._id, 'accepted')} disabled={responding === req._id} title="Akceptuj">
                    <CheckCircle size={18} />
                  </button>
                  <button className="settings-request-reject" onClick={() => handleRespond(req._id, 'rejected')} disabled={responding === req._id} title="Odrzuć">
                    <XCircle size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ────────────────────────────────────────────
// Club Tab (coach join/leave + clubAdmin invite code)
// ────────────────────────────────────────────
function TabClub() {
  const user = useAuthStore((s) => s.user)
  const toast = useToast()
  const isCoach = user?.role === 'coach'
  const isClubAdmin = user?.role === 'clubAdmin'
  const clubId = user?.club && typeof user.club === 'object' ? user.club._id : user?.club
  const clubName = user?.club && typeof user.club === 'object' ? user.club.name : null

  const [code, setCode] = useState('')
  const [preview, setPreview] = useState(null)
  const [validating, setValidating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [clubInviteCode, setClubInviteCode] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isClubAdmin && clubId) {
      api.get(`/clubs/${clubId}/invite-code`)
        .then((res) => setClubInviteCode(res.data.inviteCode || ''))
        .catch(() => {})
    }
  }, [isClubAdmin, clubId])

  const handleValidate = async () => {
    if (!code.trim()) return
    setValidating(true)
    setPreview(null)
    try {
      const { data } = await api.get(`/clubs/validate-code?code=${code.trim()}`)
      setPreview(data.club)
    } catch { toast.error('Nieprawidłowy kod zaproszenia') }
    setValidating(false)
  }

  const handleJoin = async () => {
    setJoining(true)
    try {
      const { data } = await api.post('/clubs/join', { code: code.trim() })
      toast.success(data.message)
      const meRes = await api.get('/auth/me')
      useAuthStore.getState().setUser(meRes.data.user)
      setPreview(null)
      setCode('')
    } catch (err) { toast.error(err.response?.data?.message || 'Nie udało się dołączyć') }
    setJoining(false)
  }

  const handleLeave = async () => {
    setLeaving(true)
    try {
      await api.post('/clubs/leave')
      toast.success('Opuściłeś klub')
      const meRes = await api.get('/auth/me')
      useAuthStore.getState().setUser(meRes.data.user)
    } catch (err) { toast.error(err.response?.data?.message || 'Nie udało się opuścić klubu') }
    setLeaving(false)
  }

  const handleCopyClubCode = () => {
    navigator.clipboard.writeText(clubInviteCode)
    setCopied(true)
    toast.success('Kod skopiowany')
    setTimeout(() => setCopied(false), 2000)
  }

  if (isClubAdmin) {
    return (
      <div className="settings-section">
        <div className="settings-section-title">Kod zaproszenia klubu</div>
        <p className="settings-invite-desc">Podaj ten kod trenerom — wpiszą go w swoich ustawieniach aby dołączyć do klubu.</p>
        <div className="settings-invite-code-box">
          <span className="settings-invite-code">{clubInviteCode || '---'}</span>
        </div>
        <div className="settings-invite-actions">
          <Button variant="primary" size="sm" onClick={handleCopyClubCode} disabled={!clubInviteCode}>
            <Copy size={14} /> {copied ? 'Skopiowano!' : 'Kopiuj kod'}
          </Button>
        </div>
      </div>
    )
  }

  if (isCoach && clubId) {
    return (
      <div className="settings-section">
        <div className="settings-section-title">Twój klub</div>
        <div style={{ padding: '1rem', borderRadius: 10, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Building2 size={24} style={{ color: 'var(--color-accent)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{clubName || 'Klub'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Jesteś przypisany do tego klubu</div>
          </div>
        </div>
        <Button variant="danger" size="sm" onClick={handleLeave} loading={leaving}>
          <LogOutIcon size={14} /> Opuść klub
        </Button>
      </div>
    )
  }

  return (
    <div className="settings-section">
      <div className="settings-section-title">Dołącz do klubu</div>
      <p className="settings-invite-desc">Wpisz kod zaproszenia klubu, aby się do niego przypisać.</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setPreview(null) }}
          placeholder="np. KLUB-XXXXXX" maxLength={12}
          style={{ flex: 1, padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text)', fontSize: '0.95rem', fontFamily: 'monospace', letterSpacing: 2 }}
        />
        <Button size="sm" onClick={handleValidate} loading={validating}>Sprawdź</Button>
      </div>
      {preview && (
        <div style={{ padding: '1rem', borderRadius: 10, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-accent)', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{preview.name}</div>
          {preview.city && <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>{preview.city}</div>}
          <Button variant="primary" size="sm" onClick={handleJoin} loading={joining} style={{ marginTop: 12 }}>
            <Building2 size={14} /> Dołącz do tego klubu
          </Button>
        </div>
      )}
    </div>
  )
}

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
  const user = useAuthStore((s) => s.user)
  const isCoach = user?.role === 'coach'
  const isClubAdmin = user?.role === 'clubAdmin'

  const TABS = [
    { key: 'profile', label: 'Profil', icon: User },
    ...(isCoach ? [{ key: 'invite', label: 'Kod zaproszenia', icon: Link2 }] : []),
    ...(isCoach || isClubAdmin ? [{ key: 'club', label: 'Klub', icon: Building2 }] : []),
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
        {activeTab === 'invite' && isCoach && <TabInviteCode />}
        {activeTab === 'club' && (isCoach || isClubAdmin) && <TabClub />}
        {activeTab === 'security' && <TabSecurity />}
        {activeTab === 'notifications' && <TabNotifications />}
      </div>
    </div>
  )
}
