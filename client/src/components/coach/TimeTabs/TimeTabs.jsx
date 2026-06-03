import { NavLink } from 'react-router-dom'
import { CalendarClock, ClipboardList, Trophy } from 'lucide-react'
import './TimeTabs.css'

// One "home" for everything that lives on a date: calendar, session list, tournaments.
// Surfaced as a single "Kalendarz" entry in the sidebar; these tabs switch between views.
const TABS = [
  { to: '/coach/calendar', label: 'Kalendarz', icon: CalendarClock },
  { to: '/coach/sessions', label: 'Treningi', icon: ClipboardList },
  { to: '/coach/tournaments', label: 'Turnieje', icon: Trophy },
]

export default function TimeTabs() {
  return (
    <nav className="time-tabs">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end
          className={({ isActive }) => `time-tab${isActive ? ' active' : ''}`}
        >
          <t.icon size={16} className="time-tab-icon" />
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
