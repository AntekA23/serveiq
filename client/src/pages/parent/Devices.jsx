import { useState, useEffect } from 'react'
import {
  Watch,
  RefreshCw,
  Unlink,
  Plus,
  Battery,
  Wifi,
  WifiOff,
  CheckCircle2,
  X,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import Button from '../../components/ui/Button/Button'
import './Devices.css'

const PROVIDERS = {
  whoop: {
    name: 'WHOOP',
    color: 'var(--color-whoop)',
    bg: 'var(--color-whoop-bg)',
    devices: ['WHOOP 4.0', 'WHOOP 3.0'],
    description: 'Monitoruj regeneracje, obciazenie i sen z opaski WHOOP.',
  },
  garmin: {
    name: 'Garmin',
    color: 'var(--color-garmin)',
    bg: 'var(--color-garmin-bg)',
    devices: ['Garmin Venu 3', 'Garmin Forerunner 265', 'Garmin Vivoactive 5'],
    description: 'Sledz aktywnosc, Body Battery i stres z zegarka Garmin.',
  },
}

function ConnectModal({ provider, children, onConnect, onClose }) {
  const [step, setStep] = useState('select') // select, auth, connecting, done
  const [selectedDevice, setSelectedDevice] = useState('')
  const [selectedChild, setSelectedChild] = useState('')

  const providerInfo = PROVIDERS[provider]

  const handleAuth = () => {
    setStep('connecting')
    setTimeout(() => {
      onConnect(provider, selectedDevice, selectedChild)
      setStep('done')
    }, 2000)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="connect-modal" onClick={(e) => e.stopPropagation()}>
        <button className="connect-modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        {step === 'select' && (
          <>
            <div className="connect-modal-header" style={{ '--provider-color': providerInfo.color }}>
              <Watch size={24} />
              <h2>Polacz {providerInfo.name}</h2>
            </div>
            <p className="connect-modal-desc">{providerInfo.description}</p>

            <div className="connect-modal-section">
              <label className="connect-modal-label">Wybierz dziecko</label>
              <div className="connect-modal-options">
                {children.map((child) => (
                  <button
                    key={child._id}
                    className={`connect-modal-option ${selectedChild === child._id ? 'active' : ''}`}
                    onClick={() => setSelectedChild(child._id)}
                  >
                    {child.firstName} {child.lastName}
                  </button>
                ))}
              </div>
            </div>

            <div className="connect-modal-section">
              <label className="connect-modal-label">Wybierz urzadzenie</label>
              <div className="connect-modal-options">
                {providerInfo.devices.map((device) => (
                  <button
                    key={device}
                    className={`connect-modal-option ${selectedDevice === device ? 'active' : ''}`}
                    onClick={() => setSelectedDevice(device)}
                  >
                    {device}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleAuth}
              disabled={!selectedDevice || !selectedChild}
              style={{ width: '100%', marginTop: 16 }}
            >
              Autoryzuj dostepu
            </Button>
          </>
        )}

        {step === 'connecting' && (
          <div className="connect-modal-status">
            <div className="connect-modal-spinner" />
            <h3>Laczenie z {providerInfo.name}...</h3>
            <p>Autoryzacja dostepu i synchronizacja danych</p>
          </div>
        )}

        {step === 'done' && (
          <div className="connect-modal-status">
            <div className="connect-modal-success">
              <CheckCircle2 size={48} />
            </div>
            <h3>Polaczono z {providerInfo.name}!</h3>
            <p>Dane historyczne zostaly zsynchronizowane (30 dni)</p>
            <Button variant="primary" onClick={onClose} style={{ marginTop: 16 }}>
              Gotowe
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Nigdy'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Teraz'
  if (mins < 60) return `${mins} min temu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h temu`
  return `${Math.floor(hours / 24)} dni temu`
}

export default function Devices() {
  const user = useAuthStore((s) => s.user)
  const [devices, setDevices] = useState([])
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncingId, setSyncingId] = useState(null)
  const [connectProvider, setConnectProvider] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [{ data: devicesData }, { data: playersRaw }] = await Promise.all([
        api.get('/wearables/devices'),
        api.get('/players'),
      ])
      setDevices(Array.isArray(devicesData) ? devicesData : devicesData.devices || [])
      const players = Array.isArray(playersRaw) ? playersRaw : playersRaw.players || []
      const childIds = user?.parentProfile?.children || []
      setChildren(
        childIds.length > 0
          ? players.filter((p) => childIds.includes(p._id))
          : players
      )
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  const handleSync = async (deviceId) => {
    setSyncingId(deviceId)
    try {
      await api.post(`/wearables/devices/${deviceId}/sync`)
      await fetchData()
    } catch {
      // silent
    } finally {
      setSyncingId(null)
    }
  }

  const handleDisconnect = async (deviceId) => {
    try {
      await api.delete(`/wearables/devices/${deviceId}`)
      await fetchData()
    } catch {
      // silent
    }
  }

  const handleConnect = async (provider, deviceName, playerId) => {
    try {
      await api.post('/wearables/connect', { provider, deviceName, playerId })
      await fetchData()
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="devices-page">
        <h1 className="page-title">Urzadzenia</h1>
        <div className="devices-loading">Ladowanie...</div>
      </div>
    )
  }

  return (
    <div className="devices-page">
      <h1 className="page-title">Urzadzenia</h1>

      {/* Connected devices */}
      {devices.length > 0 && (
        <div className="devices-section">
          <div className="devices-section-title">Polaczone urzadzenia</div>
          <div className="devices-list">
            {devices.map((device) => {
              const providerInfo = PROVIDERS[device.provider] || {}
              const child = children.find(c => c._id === device.player || c._id === device.player?._id)

              return (
                <div key={device._id} className="device-card">
                  <div className="device-card-header">
                    <div
                      className="device-card-logo"
                      style={{ background: providerInfo.bg, color: providerInfo.color }}
                    >
                      <Watch size={20} />
                    </div>
                    <div className="device-card-info">
                      <div className="device-card-name">{device.deviceName}</div>
                      <div className="device-card-provider">{providerInfo.name}</div>
                      {child && (
                        <div className="device-card-child">
                          {child.firstName} {child.lastName}
                        </div>
                      )}
                    </div>
                    <div className={`device-card-status ${device.connected ? 'online' : 'offline'}`}>
                      {device.connected ? <Wifi size={14} /> : <WifiOff size={14} />}
                      {device.connected ? 'Online' : 'Offline'}
                    </div>
                  </div>

                  <div className="device-card-meta">
                    <div className="device-card-meta-item">
                      <RefreshCw size={12} />
                      Ostatnia sync: {formatTimeAgo(device.lastSyncAt)}
                    </div>
                    {device.battery != null && (
                      <div className="device-card-meta-item">
                        <Battery size={12} />
                        Bateria: {device.battery}%
                      </div>
                    )}
                  </div>

                  <div className="device-card-actions">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSync(device._id)}
                      loading={syncingId === device._id}
                    >
                      <RefreshCw size={14} />
                      Synchronizuj
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(device._id)}
                    >
                      <Unlink size={14} />
                      Odlacz
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add device */}
      <div className="devices-section">
        <div className="devices-section-title">Dodaj urzadzenie</div>
        <div className="devices-add-grid">
          {Object.entries(PROVIDERS).map(([key, info]) => (
            <button
              key={key}
              className="device-add-card"
              onClick={() => setConnectProvider(key)}
              style={{ '--provider-color': info.color, '--provider-bg': info.bg }}
            >
              <div className="device-add-icon">
                <Plus size={20} />
              </div>
              <div className="device-add-name">{info.name}</div>
              <div className="device-add-desc">{info.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Connect modal */}
      {connectProvider && (
        <ConnectModal
          provider={connectProvider}
          children={children}
          onConnect={handleConnect}
          onClose={() => setConnectProvider(null)}
        />
      )}
    </div>
  )
}
