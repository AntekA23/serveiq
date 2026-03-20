import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Search } from 'lucide-react'
import api from '../../api/axios'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import Modal from '../../components/ui/Modal/Modal'
import PlayerCard from '../../components/shared/PlayerCard/PlayerCard'
import useUiStore from '../../store/uiStore'
import './Players.css'

const playerSchema = z.object({
  firstName: z.string().min(2, 'Imię musi mieć min. 2 znaki'),
  lastName: z.string().min(2, 'Nazwisko musi mieć min. 2 znaki'),
  dateOfBirth: z.string().min(1, 'Data urodzenia jest wymagana'),
  gender: z.enum(['M', 'F'], { required_error: 'Wybierz płeć' }),
  monthlyRate: z.union([z.string(), z.number()]).optional().transform((v) => (v === '' || v === undefined ? undefined : Number(v))),
  parentEmail: z.union([z.string().email('Nieprawidłowy email'), z.literal('')]).optional(),
})

export default function Players() {
  const addToast = useUiStore((s) => s.addToast)
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      monthlyRate: '',
      parentEmail: '',
    },
  })

  const fetchPlayers = useCallback(async () => {
    try {
      const res = await api.get('/players')
      setPlayers(Array.isArray(res.data) ? res.data : res.data.players || [])
    } catch (err) {
      addToast('Nie udało się pobrać zawodników', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchPlayers()
  }, [fetchPlayers])

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const payload = { ...data }
      if (!payload.monthlyRate) delete payload.monthlyRate
      if (!payload.parentEmail) delete payload.parentEmail

      await api.post('/players', payload)
      addToast('Zawodnik został dodany', 'success')
      setModalOpen(false)
      reset()
      fetchPlayers()
    } catch (err) {
      addToast(err.response?.data?.message || 'Błąd podczas dodawania zawodnika', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = players.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="page-enter">
        <h1 className="page-title">Zawodnicy</h1>
        <p className="players-loading">Ładowanie...</p>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <div className="players-header">
        <h1 className="page-title">Zawodnicy</h1>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setModalOpen(true)}>
          Dodaj zawodnika
        </Button>
      </div>

      <div className="players-search">
        <Input
          placeholder="Szukaj zawodnika..."
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="players-empty">
          {players.length === 0
            ? 'Dodaj pierwszego zawodnika, aby rozpocząć'
            : 'Nie znaleziono zawodników'}
        </div>
      ) : (
        <div className="players-grid">
          {filtered.map((player) => (
            <PlayerCard key={player._id} player={player} />
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          reset()
        }}
        title="Dodaj zawodnika"
        footer={
          <div className="modal-actions">
            <Button onClick={() => { setModalOpen(false); reset() }}>Anuluj</Button>
            <Button
              variant="primary"
              loading={submitting}
              onClick={handleSubmit(onSubmit)}
            >
              Dodaj
            </Button>
          </div>
        }
      >
        <form className="player-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="player-form-row">
            <Input
              label="Imię *"
              placeholder="Jan"
              register={register('firstName')}
              error={errors.firstName?.message}
            />
            <Input
              label="Nazwisko *"
              placeholder="Kowalski"
              register={register('lastName')}
              error={errors.lastName?.message}
            />
          </div>
          <div className="player-form-row">
            <Input
              label="Data urodzenia *"
              type="date"
              register={register('dateOfBirth')}
              error={errors.dateOfBirth?.message}
            />
            <div className="input-group">
              <label className="input-label">Płeć *</label>
              <select className="input" {...register('gender')}>
                <option value="">Wybierz...</option>
                <option value="M">Chłopiec</option>
                <option value="F">Dziewczynka</option>
              </select>
              {errors.gender && (
                <span className="input-error-text">{errors.gender.message}</span>
              )}
            </div>
          </div>
          <Input
            label="Stawka miesięczna (zł)"
            type="number"
            placeholder="500"
            register={register('monthlyRate')}
            error={errors.monthlyRate?.message}
          />
          <Input
            label="Email rodzica (wyślemy zaproszenie)"
            type="email"
            placeholder="rodzic@email.pl"
            register={register('parentEmail')}
            error={errors.parentEmail?.message}
          />
        </form>
      </Modal>
    </div>
  )
}
