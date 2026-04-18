import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.icon}>
            <AlertTriangle size={48} strokeWidth={1.5} />
          </div>
          <h1 style={styles.title}>Coś poszło nie tak</h1>
          <p style={styles.text}>
            Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę.
          </p>
          <div style={styles.actions}>
            <button style={styles.btn} onClick={this.handleReset}>
              <RotateCcw size={14} /> Spróbuj ponownie
            </button>
            <button
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={() => window.location.reload()}
            >
              Odśwież stronę
            </button>
          </div>
        </div>
      </div>
    )
  }
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg, #0f1923)',
    padding: 20,
  },
  card: {
    textAlign: 'center',
    maxWidth: 400,
  },
  icon: {
    color: 'var(--color-warning, #f59e0b)',
    marginBottom: 16,
  },
  title: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 32,
    color: 'var(--color-text, #e2e8f0)',
    margin: '0 0 8px',
    letterSpacing: 2,
  },
  text: {
    fontSize: 14,
    color: 'var(--color-text-tertiary, #94a3b8)',
    margin: '0 0 24px',
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    background: 'var(--color-accent, #06b6d4)',
    color: '#fff',
  },
  btnSecondary: {
    background: 'var(--color-surface, #1e293b)',
    color: 'var(--color-text-secondary, #cbd5e1)',
    border: '1px solid var(--color-border, #334155)',
  },
}
