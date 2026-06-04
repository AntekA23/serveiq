import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles, Zap, TrendingUp, UserPlus, Users, BarChart3,
  MessageCircle, LineChart, Calendar, FileText, Trophy, Target,
  ChevronDown, ArrowRight, Check, X, Star, Crown, Menu, XIcon,
} from 'lucide-react'
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
    icon: MessageCircle,
    title: 'Chaos w komunikacji',
    desc: 'Plan, terminy i ustalenia giną w WhatsAppie, SMS-ach i mailach.',
  },
  {
    icon: TrendingUp,
    title: 'Nie widać postępu',
    desc: 'Wyniki meczów to nie wszystko — brakuje obrazu rozwoju i tego, nad czym dziecko pracuje.',
  },
  {
    icon: Target,
    title: 'Brak jasnej ścieżki',
    desc: 'Co po Tennis 10? Trudno zobaczyć, jaki jest następny krok dziecka.',
  },
]

const STEPS = [
  {
    icon: UserPlus,
    title: 'Załóż konto',
    desc: 'Rejestracja w 30 sekund. Bez karty kredytowej.',
  },
  {
    icon: Users,
    title: 'Połącz się z trenerem',
    desc: 'Trener prowadzi plan, oceny i postępy — Ty masz wszystko w telefonie.',
  },
  {
    icon: BarChart3,
    title: 'Śledź rozwój',
    desc: 'Plan, postępy, oceny i kolejny krok ścieżki — wszystko w jednym miejscu.',
  },
]

const FEATURES = [
  {
    icon: Calendar,
    title: 'Plan treningowy',
    desc: 'Tygodniowy plan, cele i kalendarz. Wiesz, co i kiedy trenuje dziecko.',
  },
  {
    icon: MessageCircle,
    title: 'Kontakt z trenerem',
    desc: 'Wiadomości i ustalenia w jednym miejscu, nie w pięciu czatach.',
  },
  {
    icon: LineChart,
    title: 'Postępy i umiejętności',
    desc: 'Rozwój umiejętności w czasie — nie tylko wyniki meczów.',
  },
  {
    icon: FileText,
    title: 'Oceny trenera',
    desc: 'Okresowe oceny: co poszło dobrze, nad czym pracować i co dalej.',
  },
  {
    icon: TrendingUp,
    title: 'Ścieżka rozwoju',
    desc: 'Od Tennis 10 po zawodnika — widoczny następny krok dziecka.',
  },
  {
    icon: Trophy,
    title: 'Turnieje i odznaki',
    desc: 'Kalendarz turniejów, wyniki i motywujące odznaki dla dziecka.',
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
      { text: 'Plan treningowy i kalendarz', included: true },
      { text: 'Postępy i umiejętności', included: true },
      { text: 'Kontakt z trenerem', included: true },
      { text: 'Oceny trenera', included: false },
      { text: 'Turnieje i odznaki', included: false },
      { text: 'Tygodniowe podsumowanie', included: false },
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
      { text: 'Plan, postępy, kalendarz', included: true },
      { text: 'Pełna historia rozwoju', included: true },
      { text: 'Oceny trenera', included: true },
      { text: 'Turnieje i odznaki', included: true },
      { text: 'Tygodniowe podsumowanie', included: true },
      { text: 'Ścieżka rozwoju', included: true },
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
      { text: 'Profil rodzinny', included: true },
      { text: 'Pełna historia rozwoju', included: true },
      { text: 'Powiadomienia', included: true },
      { text: 'Priorytetowy support', included: true },
      { text: 'Ścieżka rozwoju', included: true },
    ],
  },
]

const FAQ_DATA = [
  {
    q: 'Czy ServeIQ działa dla małych dzieci (Tennis 10)?',
    a: 'Tak — od pierwszych zajęć Tennis 10. Rodzic widzi plan, postępy i oceny, a dziecko zbiera motywujące odznaki. Ten sam system rośnie z dzieckiem aż po poważną ścieżkę zawodniczą.',
  },
  {
    q: 'Jak działa darmowy trial?',
    a: '14 dni Premium za darmo dla każdego nowego użytkownika. Nie wymagamy karty kredytowej. Po zakończeniu trialu konto automatycznie przejdzie na plan Free.',
  },
  {
    q: 'Czy muszę mieć trenera w ServeIQ?',
    a: 'Najwięcej zyskujesz, gdy trener prowadzi plan i oceny — ale możesz też samodzielnie śledzić plan, turnieje i postępy dziecka. Trenera dodasz kodem zaproszenia w dowolnym momencie.',
  },
  {
    q: 'Czy moje dane są bezpieczne?',
    a: 'Tak. Wszystkie dane są szyfrowane. Działamy zgodnie z RODO/GDPR. Dane dzieci są szczególnie chronione i nigdy nie udostępniamy ich osobom trzecim.',
  },
  {
    q: 'Czy mogę prowadzić więcej niż jedno dziecko?',
    a: 'Tak. Plan Free obejmuje 1 dziecko, Premium do 3, a Family do 5 dzieci na jednym koncie.',
  },
  {
    q: 'Jak anulować subskrypcję?',
    a: 'W dowolnym momencie w ustawieniach konta. Subskrypcja pozostaje aktywna do końca opłaconego okresu. Bez ukrytych opłat.',
  },
]

// ── Main Component ──

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
            <Sparkles size={14} />
            Rozwój juniora tenisa — od Tennis 10 wzwyż
          </div>

          <h1>
            CAŁY ROZWÓJ DZIECKA<br />
            <span className="accent">W JEDNYM MIEJSCU</span>
          </h1>

          <p className="landing-hero-sub">
            Plan treningowy, postępy, oceny trenera i kontakt — bez chaosu w WhatsAppie.
            Od pierwszych zajęć Tennis 10 po poważną ścieżkę zawodniczą.
          </p>

          <div className="landing-hero-actions">
            <Link to="/register" className="landing-btn-primary">
              Rozpocznij za darmo
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        <div className="landing-hero-stats">
          <div className="landing-hero-stat">
            <div className="landing-hero-stat-value">1</div>
            <div className="landing-hero-stat-label">miejsce na wszystko</div>
          </div>
          <div className="landing-hero-stat">
            <div className="landing-hero-stat-value">0</div>
            <div className="landing-hero-stat-label">chaosu w WhatsAppie</div>
          </div>
          <div className="landing-hero-stat">
            <div className="landing-hero-stat-value">100%</div>
            <div className="landing-hero-stat-label">jasności dla rodzica</div>
          </div>
        </div>
      </div>

      {/* ── Problem ── */}
      <Section className="landing-problem" id="problem">
        <div className="landing-section-label">Problem</div>
        <h2 className="landing-section-title">
          Rozwój dziecka rozsypany po pięciu aplikacjach?
        </h2>
        <p className="landing-section-subtitle" style={{ margin: '0 auto' }}>
          Plan w głowie trenera, ustalenia w WhatsAppie, wyniki w zeszycie. Trudno o spokój i jasność.
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
        <h2 className="landing-section-title">3 kroki do jasności</h2>

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
          Jeden system na całą drogę: plan, komunikacja, postępy, oceny i kolejny krok.
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
          <h2>Zobacz rozwój dziecka jaśniej — już dziś</h2>
          <p>Dołącz do ServeIQ i miej cały rozwój dziecka — plan, postępy i kontakt z trenerem — w jednym miejscu.</p>
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
