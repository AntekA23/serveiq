import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  User,
  Watch,
  Calendar,
  Trophy,
  CreditCard,
  MessageSquare,
  Settings,
  LogOut,
  Users,
  ClipboardList,
  FileText,
  CalendarDays,
} from 'lucide-react'
import useAuthStore from '../../../store/authStore'
import useUiStore from '../../../store/uiStore'
import useAuth from '../../../hooks/useAuth'
import Avatar from '../../ui/Avatar'
import './Sidebar.css'

const parentNav = [
  { to: '/parent/dashboard', label: 'Pulpit', icon: LayoutDashboard },
  { to: '/parent/devices', label: 'Urzadzenia', icon: Watch },
  { to: '/parent/training-plan', label: 'Plan treningowy', icon: Calendar },
  { to: '/parent/tournaments', label: 'Turnieje', icon: Trophy },
  { to: '/parent/payments', label: 'Platnosci', icon: CreditCard },
  { to: '/parent/messages', label: 'Wiadomosci', icon: MessageSquare },
  { to: '/parent/settings', label: 'Ustawienia', icon: Settings },
]

const coachNav = [
  { to: '/coach/dashboard', label: 'Pulpit', icon: LayoutDashboard },
  { to: '/coach/players', label: 'Zawodnicy', icon: Users },
  { to: '/coach/calendar', label: 'Kalendarz', icon: CalendarDays },
  { to: '/coach/sessions', label: 'Sesje', icon: ClipboardList },
  { to: '/coach/reviews', label: 'Oceny', icon: FileText },
  { to: '/coach/payments', label: 'Platnosci', icon: CreditCard },
  { to: '/coach/messages', label: 'Wiadomosci', icon: MessageSquare },
  { to: '/coach/settings', label: 'Ustawienia', icon: Settings },
]

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const navItems = user?.role === 'coach' ? coachNav : parentNav

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar()
    }
  }

  return (
    <>
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar} />
      )}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">SERVE<span style={{ color: 'var(--color-text)' }}>IQ</span><span className="sidebar-logo-dot" /></div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-nav-item${isActive ? ' active' : ''}`
              }
              onClick={handleNavClick}
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <Avatar
            firstName={user?.firstName}
            lastName={user?.lastName}
            size={32}
            role={user?.role}
            src={user?.avatar}
          />
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="sidebar-user-role">
              {user?.role === 'coach' ? 'Trener' : 'Rodzic'}
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout} title="Wyloguj">
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  )
}
