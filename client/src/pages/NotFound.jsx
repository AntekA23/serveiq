import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Button from '../components/ui/Button/Button'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="notfound-page">
      <div className="notfound-card">
        <div className="notfound-icon">
          <AlertTriangle size={48} strokeWidth={1.5} />
        </div>
        <h1 className="notfound-title">404</h1>
        <p className="notfound-text">Strona nie znaleziona</p>
        <Button variant="primary" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Wstecz
        </Button>
      </div>

      <style>{`
        .notfound-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg);
          padding: 20px;
        }
        .notfound-card {
          text-align: center;
          max-width: 360px;
        }
        .notfound-icon {
          color: var(--color-text-tertiary);
          margin-bottom: 16px;
        }
        .notfound-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 72px;
          color: var(--color-accent);
          margin: 0;
          line-height: 1;
          letter-spacing: 4px;
        }
        .notfound-text {
          font-size: 14px;
          color: var(--color-text-tertiary);
          margin: 8px 0 24px;
        }
      `}</style>
    </div>
  )
}
