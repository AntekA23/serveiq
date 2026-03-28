import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Moon, Zap, TrendingUp, UserPlus, Watch, BarChart3,
  Activity, Bell, LineChart, Calendar, FileText, Mail,
  ChevronDown, ArrowRight, Play, Check, X, Star, Crown, Menu, XIcon,
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import { getDemoUser, DEMO_TOKEN } from '../services/demoData'
import './Landing.css'

// ── Intersection Observer hook for scroll animations ──
function useScrollReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

function Section({ children, className = '', id }) {
  const { ref, visible } = useScrollReveal()
  return (
    <section
      ref={ref}
      id={id}
      className={`landing-section ${visible ? 'visible' : ''} ${className}`}
    >
      {children}
    </section>
  )
}

// ── FAQ Item ──
function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="landing-faq-item">
      <button className="landing-faq-question" onClick={() => setOpen(!open)}>
        {question}
        <ChevronDown size={18} className={`landing-faq-chevron ${open ? 'open' : ''}`} />
      </button>
      <div className={`landing-faq-answer ${open ? 'open' : ''}`}>
        <p>{answer}</p>
      </div>
    </div>
  )
}

// ── Data ──

const PROBLEMS = [
  {
    icon: Moon,
    title: 'Brak wgladu w regeneracje',
    desc: 'Nie wiesz, czy Twoje dziecko odpowiednio sie regeneruje po treningach i turniejach.',
  },
  {
    icon: Zap,
    title: 'Nie wiesz czy trening jest za intensywny',
    desc: 'Brak danych o obciazeniu treningowym moze prowadzic do przetrenowania.',
  },
  {
    icon: TrendingUp,
    title: 'Brakuje pelnego obrazu rozwoju',
    desc: 'Fragmentaryczne informacje nie pozwalaja podejmowac dobrych decyzji.',
  },
]

const STEPS = [
  {
    icon: UserPlus,
    title: 'Zaloz konto',
    desc: 'Zarejestruj sie w 30 sekund. Bez karty kredytowej.',
  },
  {
    icon: Watch,
    title: 'Polacz urzadzenie',
    desc: 'WHOOP, Garmin i wiecej. Dane synchronizuja sie automatycznie.',
  },
  {
    icon: BarChart3,
    title: 'Monitoruj rozwoj',
    desc: 'Dane zdrowotne, alerty, raporty - wszystko w jednym miejscu.',
  },
]

const FEATURES = [
  {
    icon: Activity,
    title: 'Dashboard zdrowia',
    desc: 'HR, HRV, sen, regeneracja w jednym miejscu. Kompletny obraz zdrowia dziecka.',
  },
  {
    icon: Bell,
    title: 'Inteligentne alerty',
    desc: 'Powiadomienia gdy regeneracja jest niska lub sen niewystarczajacy.',
  },
  {
    icon: LineChart,
    title: 'Historia postepu',
    desc: 'Wykresy i trendy w czasie. Porownuj okresy i sledz postepy.',
  },
  {
    icon: Calendar,
    title: 'Plan treningowy',
    desc: 'Kalendarz, cele, kamienie milowe. Organizuj trening dziecka.',
  },
  {
    icon: FileText,
    title: 'Raporty PDF',
    desc: 'Eksportuj raport dla trenera lub lekarza jednym kliknieciem.',
  },
  {
    icon: Mail,
    title: 'Tygodniowe podsumowanie',
    desc: 'Email z podsumowaniem tygodnia. Badz na biezaco bez logowania.',
  },
]

const PRICING = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: 'na zawsze',
    icon: Zap,
    features: [
      { text: '1 dziecko', included: true },
      { text: 'Dashboard zdrowia', included: true },
      { text: 'Historia 7 dni', included: true },
      { text: 'Podstawowe alerty', included: true },
      { text: 'Wykresy i porownania', included: false },
      { text: 'Email tygodniowy', included: false },
      { text: 'Eksport PDF', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '39',
    period: 'zl / mies.',
    icon: Star,
    popular: true,
    trial: '14 dni za darmo',
    features: [
      { text: 'Do 3 dzieci', included: true },
      { text: 'Dashboard zdrowia', included: true },
      { text: 'Pelna historia', included: true },
      { text: 'Pelne alerty', included: true },
      { text: 'Wykresy i porownania', included: true },
      { text: 'Email tygodniowy', included: true },
      { text: 'Eksport PDF', included: true },
    ],
  },
  {
    id: 'family',
    name: 'Family',
    price: '59',
    period: 'zl / mies.',
    icon: Crown,
    features: [
      { text: 'Do 5 dzieci', included: true },
      { text: 'Wszystko z Premium', included: true },
      { text: 'Pelna historia', included: true },
      { text: 'Pelne alerty', included: true },
      { text: 'Push notifications', included: true },
      { text: 'Priorytetowy support', included: true },
      { text: 'Eksport PDF', included: true },
    ],
  },
]

const FAQ_DATA = [
  {
    q: 'Czy moje dziecko musi miec WHOOP lub Garmin?',
    a: 'Nie, aplikacja dziala rowniez bez urzadzenia wearable. Mozesz recznie sledzic postepy i cele treningowe. Urzadzenie dodaje automatyczne dane zdrowotne takie jak tetno, HRV, sen i regeneracje.',
  },
  {
    q: 'Jak dziala darmowy trial?',
    a: '14 dni Premium za darmo dla kazdego nowego uzytkownika. Nie wymagamy karty kredytowej. Po zakonczeniu trialu Twoje konto automatycznie przejdzie na plan Free.',
  },
  {
    q: 'Czy moje dane sa bezpieczne?',
    a: 'Tak. Wszystkie dane sa szyfrowane. Dzialamy zgodnie z RODO/GDPR. Dane zdrowotne dzieci sa szczegolnie chronione. Nigdy nie udostepniamy danych osobom trzecim.',
  },
  {
    q: 'Czy moge monitorowac wiecej niz jedno dziecko?',
    a: 'Tak. Plan Free pozwala na 1 dziecko, Premium do 3, a Family do 5 dzieci w jednym koncie.',
  },
  {
    q: 'Jak anulowac subskrypcje?',
    a: 'W dowolnym momencie w ustawieniach konta. Twoja subskrypcja bedzie aktywna do konca oplaconego okresu. Bez ukrytych oplat.',
  },
  {
    q: 'Jakie dane zdrowotne beda widoczne?',
    a: 'Tetno spoczynkowe, zmiennosc tetna (HRV), jakosc i dlugosc snu, wynik regeneracji, obciazenie treningowe (strain) oraz trendy w czasie.',
  },
]

// ── Main Component ──

export default function Landing() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleDemo = useCallback(() => {
    const demoUser = getDemoUser()
    useAuthStore.getState().setAuth(demoUser, DEMO_TOKEN)
    navigate('/parent/dashboard')
  }, [navigate])

  const scrollTo = useCallback((id) => {
    setMobileMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <div className="landing">
      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div className="landing-nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          SERVE<span>IQ</span>
        </div>

        <div className="landing-nav-links">
          <button className="landing-nav-link" onClick={() => scrollTo('features')}>Funkcje</button>
          <button className="landing-nav-link" onClick={() => scrollTo('pricing')}>Cennik</button>
          <button className="landing-nav-link" onClick={() => scrollTo('faq')}>FAQ</button>
          <Link to="/login" className="landing-nav-link">Zaloguj</Link>
          <Link to="/register" className="landing-nav-cta">Rejestracja</Link>
        </div>

        <button className="landing-nav-mobile-toggle" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
      </nav>

      {/* Mobile nav overlay */}
      <div className={`landing-nav-mobile ${mobileMenuOpen ? 'open' : ''}`}>
        <button
          className="landing-nav-mobile-toggle"
          onClick={() => setMobileMenuOpen(false)}
          style={{ position: 'absolute', top: 16, right: 20 }}
        >
          <XIcon size={28} />
        </button>
        <button className="landing-nav-link" onClick={() => scrollTo('features')}>Funkcje</button>
        <button className="landing-nav-link" onClick={() => scrollTo('pricing')}>Cennik</button>
        <button className="landing-nav-link" onClick={() => scrollTo('faq')}>FAQ</button>
        <Link to="/login" className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>Zaloguj</Link>
        <Link to="/register" className="landing-nav-cta" onClick={() => setMobileMenuOpen(false)}>Rejestracja</Link>
      </div>

      {/* ── Hero ── */}
      <div className="landing-hero landing-section visible">
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <Activity size={14} />
            Platforma dla rodzicow mlodych tenisistow
          </div>

          <h1>
            MONITORUJ ROZWOJ<br />
            <span className="accent">MLODEGO TENISISTY</span>
          </h1>

          <p className="landing-hero-sub">
            Polacz WHOOP lub Garmin i sledz zdrowie, regeneracje i postepy dziecka w jednym miejscu.
          </p>

          <div className="landing-hero-actions">
            <Link to="/register" className="landing-btn-primary">
              Rozpocznij za darmo
              <ArrowRight size={18} />
            </Link>
            <button className="landing-btn-secondary" onClick={handleDemo}>
              <Play size={16} />
              Zobacz demo
            </button>
          </div>
        </div>

        <div className="landing-hero-stats">
          <div className="landing-hero-stat">
            <div className="landing-hero-stat-value">24/7</div>
            <div className="landing-hero-stat-label">Monitoring</div>
          </div>
          <div className="landing-hero-stat">
            <div className="landing-hero-stat-value">2+</div>
            <div className="landing-hero-stat-label">Integracje</div>
          </div>
          <div className="landing-hero-stat">
            <div className="landing-hero-stat-value">100%</div>
            <div className="landing-hero-stat-label">Bezpieczenstwo</div>
          </div>
        </div>
      </div>

      {/* ── Problem ── */}
      <Section className="landing-problem" id="problem">
        <div className="landing-section-label">Problem</div>
        <h2 className="landing-section-title">
          Nie wiesz co dzieje sie z Twoim dzieckiem na treningu?
        </h2>
        <p className="landing-section-subtitle" style={{ margin: '0 auto' }}>
          Wiekszosci rodzicow brakuje narzedzi do monitorowania zdrowia i rozwoju mlodych sportowcow.
        </p>

        <div className="landing-problem-grid">
          {PROBLEMS.map((item, i) => (
            <div className="landing-problem-card" key={i}>
              <div className="landing-problem-icon">
                <item.icon size={24} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── How it works ── */}
      <Section className="landing-steps" id="how-it-works">
        <div className="landing-section-label">Jak to dziala</div>
        <h2 className="landing-section-title">3 kroki do pelnej kontroli</h2>

        <div className="landing-steps-grid">
          {STEPS.map((step, i) => (
            <div className="landing-step" key={i}>
              <div className="landing-step-number">{i + 1}</div>
              <div className="landing-step-icon">
                <step.icon size={28} />
              </div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Features ── */}
      <Section className="landing-features" id="features">
        <div className="landing-section-label">Funkcje</div>
        <h2 className="landing-section-title">Wszystko czego potrzebujesz</h2>
        <p className="landing-section-subtitle" style={{ margin: '0 auto' }}>
          Kompletna platforma do monitorowania zdrowia i rozwoju mlodego tenisisty.
        </p>

        <div className="landing-features-grid">
          {FEATURES.map((feature, i) => (
            <div className="landing-feature-card" key={i}>
              <div className="landing-feature-icon">
                <feature.icon size={20} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Integrations ── */}
      <Section className="landing-integrations" id="integrations">
        <div className="landing-section-label">Integracje</div>
        <h2 className="landing-section-title">Integrujemy sie z</h2>

        <div className="landing-integrations-list">
          <div className="landing-integration">
            <div className="landing-integration-icon whoop">W</div>
            <div className="landing-integration-name">WHOOP</div>
            <div className="landing-integration-status">Dostepne</div>
          </div>
          <div className="landing-integration">
            <div className="landing-integration-icon garmin">G</div>
            <div className="landing-integration-name">Garmin</div>
            <div className="landing-integration-status">Dostepne</div>
          </div>
        </div>

        <p className="landing-integrations-coming">
          Wkrotce: <span>Apple Health, Polar, Suunto</span>
        </p>
      </Section>

      {/* ── Pricing ── */}
      <Section className="landing-pricing" id="pricing">
        <div className="landing-section-label">Cennik</div>
        <h2 className="landing-section-title">Wybierz plan dla siebie</h2>
        <p className="landing-section-subtitle" style={{ margin: '0 auto' }}>
          Zacznij za darmo. Ulepsz kiedy bedziesz gotowy.
        </p>

        <div className="landing-pricing-grid">
          {PRICING.map((plan) => (
            <div
              key={plan.id}
              className={`landing-pricing-card ${plan.popular ? 'popular' : ''}`}
            >
              {plan.popular && (
                <div className="landing-pricing-badge">Najpopularniejszy</div>
              )}

              <div className="landing-pricing-icon">
                <plan.icon size={22} />
              </div>
              <div className="landing-pricing-name">{plan.name}</div>
              <div className="landing-pricing-price">
                {plan.price} <span className="currency">zl</span>
              </div>
              <div className="landing-pricing-period">{plan.period}</div>
              {plan.trial && (
                <div className="landing-pricing-trial">{plan.trial}</div>
              )}

              <ul className="landing-pricing-features">
                {plan.features.map((f, i) => (
                  <li key={i} className="landing-pricing-feature">
                    {f.included
                      ? <Check size={16} className="check" />
                      : <X size={16} className="x-icon" />
                    }
                    {f.text}
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={`landing-pricing-cta ${plan.popular ? 'primary' : 'secondary'}`}
              >
                {plan.id === 'free' ? 'Rozpocznij za darmo' : 'Wybierz plan'}
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section className="landing-faq" id="faq">
        <div className="landing-section-label">FAQ</div>
        <h2 className="landing-section-title">Czeste pytania</h2>

        <div className="landing-faq-list">
          {FAQ_DATA.map((item, i) => (
            <FaqItem key={i} question={item.q} answer={item.a} />
          ))}
        </div>
      </Section>

      {/* ── Final CTA ── */}
      <div className="landing-cta-section landing-section visible">
        <div className="landing-cta-content">
          <h2>Zacznij monitorowac rozwoj dziecka juz dzis</h2>
          <p>Dolacz do ServeIQ i zyskaj pelny obraz zdrowia i postepu Twojego mlodego tenisisty.</p>
          <Link to="/register" className="landing-btn-primary">
            Rozpocznij za darmo
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-logo">SERVE<span>IQ</span></div>
          <div className="landing-footer-links">
            <Link to="/terms" className="landing-footer-link">Regulamin</Link>
            <Link to="/privacy" className="landing-footer-link">Polityka prywatnosci</Link>
            <a href="mailto:kontakt@serveiq.pl" className="landing-footer-link">Kontakt</a>
          </div>
          <div className="landing-footer-copy">&copy; 2026 ServeIQ. Wszelkie prawa zastrzezone.</div>
        </div>
      </footer>
    </div>
  )
}
