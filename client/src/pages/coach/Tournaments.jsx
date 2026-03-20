import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trophy } from 'lucide-react'
import api from '../../api/axios'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import Modal from '../../components/ui/Modal/Modal'
import Badge from '../../components/ui/Badge/Badge'
import useUiStore from '../../store/uiStore'
import './Tournaments.css'

const tournamentSchema = z.object({
  player: z.string().min(1, 'Wybierz zawodnika'),
  name: z.string().min(1, 'Nazwa jest wymagana'),
  location: z.string().optional(),
  surface: z.enum(['hard', 'clay', 'grass', 'indoor'], { required_error: 'Wybierz nawierzchnię' }),
  startDate: z.string().min(1, 'Data rozpoczęcia jest wymagana'),
  endDate: z.string().optional(),
  category: z.string().optional(),
  drawSize: z.union([z.string(), z.number()]).optional().transform((v) => (v === '' || v === undefined ? undefined : Number(v))),
})

const resultSchema = z.object({
  round: z.string().optional(),
  wins: z.union([z.string(), z.number()]).optional().transform((v) => (v === '' || v === undefined ? 0 : Number(v))),
  losses: z.union([z.string(), z.number()]).optional().transform((v) => (v === '' || v === undefined ? 0 : Number(v))),
  notes: z.string().optional(),
})

const surfaceBadges = {
  hard: { label: 'Twardy', variant: 'blue' },
  clay: { label: 'Mączka', variant: 'amber' },
  grass: { label: 'Trawa', variant: 'green' },
  indoor: { label: 'Hala', variant: 'neutral' },
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return dd + '.' + mm + '.' + yyyy
}

function getMonthKey(dateStr) {
  const d = new Date(dateStr)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
}

function getMonthLabel(key) {
  const [year, month] = key.split('-')
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
}

export default function Tournaments() {
  const addToast = useUiStore((s) => s.addToast)

  const [loading, setLoading] = useState(true)
  const [tournaments, setTournaments] = useState([])
  const [players, setPlayers] = useState([])
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const addForm = useForm({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      player: '',
      name: '',
      location: '',
      surface: '',
      startDate: '',
      endDate: '',
      category: '',
      drawSize: '',
    },
  })

  const resultForm = useForm({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      round: '',
      wins: '',
      losses: '',
      notes: '',
    },
  })

  const fetchTournaments = useCallback(async () => {
    try {
      const res = await api.get('/tournaments')
      setTournaments(Array.isArray(res.data) ? res.data : res.data.tournaments || [])
    } catch (err) {
      addToast('Nie udało się pobrać turniejów', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchTournaments()
    api.get('/players').then((res) => setPlayers(Array.isArray(res.data) ? res.data : res.data.players || [])).catch(() => {})
  }, [fetchTournaments])

  const onAddSubmit = async (data) => {
    setSubmitting(true)
    try {
      const payload = { ...data }
      if (!payload.location) delete payload.location
      if (!payload.endDate) delete payload.endDate
      if (!payload.category) delete payload.category
      if (!payload.drawSize) delete payload.drawSize

      await api.post('/tournaments', payload)
      addToast('Turniej został dodany', 'success')
      setAddModalOpen(false)
      addForm.reset()
      fetchTournaments()
    } catch (err) {
      addToast(err.response?.data?.message || 'Błąd podczas dodawania turnieju', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onResultSubmit = async (data) => {
    if (!selectedTournament) return
    setSubmitting(true)
    try {
      const payload = {
        result: {
          round: data.round || '',
          wins: data.wins || 0,
          losses: data.losses || 0,
          notes: data.notes || '',
        },
      }
      await api.put('/tournaments/' + selectedTournament._id, payload)
      addToast('Wynik zapisany', 'success')
      setResultModalOpen(false)
      resultForm.reset()
      setSelectedTournament(null)
      fetchTournaments()
    } catch (err) {
      addToast('Błąd podczas zapisywania wyniku', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const openResultModal = (tournament) => {
    setSelectedTournament(tournament)
    if (tournament.result) {
      resultForm.reset({
        round: tournament.result.round || '',
        wins: tournament.result.wins || '',
        losses: tournament.result.losses || '',
        notes: tournament.result.notes || '',
      })
    } else {
      resultForm.reset({ round: '', wins: '', losses: '', notes: '' })
    }
    setResultModalOpen(true)
  }

  // Group tournaments by month
  const grouped = {}
  const sorted = [...tournaments].sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
  sorted.forEach((t) => {
    const key = getMonthKey(t.startDate)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(t)
  })

  if (loading) {
    return (
      <div className="page-enter">
        <h1 className="page-title">Turnieje</h1>
        <p className="tournaments-loading">Ładowanie...</p>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <div className="tournaments-header">
        <h1 className="page-title">Turnieje</h1>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setAddModalOpen(true)}>
          Dodaj turniej
        </Button>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <p className="tournaments-empty">Brak turniejów</p>
      ) : (
        Object.entries(grouped).map(([monthKey, items]) => (
          <div key={monthKey} className="tournaments-month">
            <div className="tournaments-month-title">{getMonthLabel(monthKey)}</div>
            <div className="card">
              {items.map((t) => {
                const surface = surfaceBadges[t.surface] || surfaceBadges.hard
                const playerName = t.player?.firstName
                  ? t.player.firstName + ' ' + t.player.lastName
                  : ''
                return (
                  <div
                    key={t._id}
                    className="tournament-item"
                    onClick={() => openResultModal(t)}
                  >
                    <div className="tournament-dates">
                      {formatDate(t.startDate)}
                      {t.endDate && (<><br />{formatDate(t.endDate)}</>)}
                    </div>
                    <div className="tournament-info">
                      <div className="tournament-name">{t.name}</div>
                      <div className="tournament-meta">
                        {playerName && <span>{playerName}</span>}
                        {t.location && <span>{t.location}</span>}
                        {t.category && <span>{t.category}</span>}
                        <Badge variant={surface.variant}>{surface.label}</Badge>
                      </div>
                    </div>
                    {t.result && (
                      <div className="tournament-result">
                        {t.result.round && <span>{t.result.round} </span>}
                        <span>{t.result.wins}W-{t.result.losses}L</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {/* Modal dodawania turnieju */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false)
          addForm.reset()
        }}
        title="Dodaj turniej"
        footer={
          <div className="modal-actions">
            <Button onClick={() => { setAddModalOpen(false); addForm.reset() }}>Anuluj</Button>
            <Button
              variant="primary"
              loading={submitting}
              onClick={addForm.handleSubmit(onAddSubmit)}
            >
              Dodaj
            </Button>
          </div>
        }
      >
        <form className="tournament-form" onSubmit={addForm.handleSubmit(onAddSubmit)}>
          <div className="input-group">
            <label className="input-label">Zawodnik *</label>
            <select className="input" {...addForm.register('player')}>
              <option value="">Wybierz zawodnika...</option>
              {players.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
            {addForm.formState.errors.player && (
              <span className="input-error-text">{addForm.formState.errors.player.message}</span>
            )}
          </div>
          <Input
            label="Nazwa turnieju *"
            placeholder="np. Warsaw Junior Open"
            register={addForm.register('name')}
            error={addForm.formState.errors.name?.message}
          />
          <Input
            label="Lokalizacja"
            placeholder="np. Warszawa"
            register={addForm.register('location')}
          />
          <div className="input-group">
            <label className="input-label">Nawierzchnia *</label>
            <select className="input" {...addForm.register('surface')}>
              <option value="">Wybierz...</option>
              <option value="hard">Twardy</option>
              <option value="clay">Mączka</option>
              <option value="grass">Trawa</option>
              <option value="indoor">Hala</option>
            </select>
            {addForm.formState.errors.surface && (
              <span className="input-error-text">{addForm.formState.errors.surface.message}</span>
            )}
          </div>
          <div className="tournament-form-row">
            <Input
              label="Data rozpoczęcia *"
              type="date"
              register={addForm.register('startDate')}
              error={addForm.formState.errors.startDate?.message}
            />
            <Input
              label="Data zakończenia"
              type="date"
              register={addForm.register('endDate')}
            />
          </div>
          <div className="tournament-form-row">
            <Input
              label="Kategoria"
              placeholder="np. ITF Junior, PZT U16"
              register={addForm.register('category')}
            />
            <Input
              label="Wielkość drabinki"
              type="number"
              placeholder="32"
              register={addForm.register('drawSize')}
            />
          </div>
        </form>
      </Modal>

      {/* Modal wyniku turnieju */}
      <Modal
        isOpen={resultModalOpen}
        onClose={() => {
          setResultModalOpen(false)
          setSelectedTournament(null)
          resultForm.reset()
        }}
        title={selectedTournament ? 'Wynik: ' + selectedTournament.name : 'Wynik turnieju'}
        footer={
          <div className="modal-actions">
            <Button onClick={() => { setResultModalOpen(false); setSelectedTournament(null); resultForm.reset() }}>
              Anuluj
            </Button>
            <Button
              variant="primary"
              loading={submitting}
              onClick={resultForm.handleSubmit(onResultSubmit)}
            >
              Zapisz
            </Button>
          </div>
        }
      >
        <form className="tournament-form" onSubmit={resultForm.handleSubmit(onResultSubmit)}>
          <Input
            label="Runda"
            placeholder="np. Ćwierćfinał, Półfinał, Finał"
            register={resultForm.register('round')}
          />
          <div className="tournament-form-row">
            <Input
              label="Wygrane"
              type="number"
              placeholder="0"
              register={resultForm.register('wins')}
            />
            <Input
              label="Przegrane"
              type="number"
              placeholder="0"
              register={resultForm.register('losses')}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Notatki</label>
            <textarea
              className="input tournament-notes-textarea"
              placeholder="Notatki z turnieju..."
              {...resultForm.register('notes')}
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
