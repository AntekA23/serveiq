import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, User, CalendarDays, CalendarClock, ClipboardList,
  Mail, MessageCircle, Settings, LogOut, Baby, Link2,
  Newspaper, Dumbbell,
} from 'lucide-react'
import useAuthStore from '../../../store/authStore'
import useUiStore from '../../../store/uiStore'
import useAuth from '../../../hooks/useAuth'
import Avatar from '../../ui/Avatar'
import './Sidebar.css'

const coachNav = [
  { to: '/coach/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/coach/calendar', label: 'Kalendarz', icon: CalendarClock },
  { to: '/groups', label: 'Grupy', icon: Users },
  { to: '/players', label: 'Zawodnicy', icon: User },
  { to: '/activities', label: 'Aktywnosci', icon: CalendarDays },
  { to: '/reviews', label: 'Przeglady', icon: ClipboardList },
  { to: '/coach/requests', label: 'Prosby', icon: Mail },
  { to: '/messages', label: 'Wiadomosci', icon: MessageCircle },
  { to: '/settings', label: 'Ustawienia', icon: Settings },
]

const parentNav = [
  { to: '/parent/dashboard', label: 'Panel', icon: LayoutDashboard },
  { to: '/my-children', label: 'Moje dzieci', icon: Baby },
  { to: '/parent/add-coach', label: 'Dodaj trenera', icon: Link2 },
  { to: '/calendar', label: 'Kalendarz', icon: CalendarDays },
  { to: '/reviews', label: 'Przeglady', icon: ClipboardList },
  { to: '/timeline', label: 'Timeline', icon: Newspaper },
  { to: '/messages', label: 'Wiadomosci', icon: MessageCircle },
  { to: '/settings', label: 'Ustawienia', icon: Settings },
]

const clubAdminNav = [
  { to: '/club/dashboard', label: 'Panel Klubu', icon: LayoutDashboard },
  { to: '/groups', label: 'Grupy', icon: Users },
  { to: '/players', label: 'Zawodnicy', icon: User },
  { to: '/coaches', label: 'Trenerzy', icon: Dumbbell },
  { to: '/activities', label: 'Aktywnosci', icon: CalendarDays },
  { to: '/reviews', label: 'Przeglady', icon: ClipboardList },
  { to: '/settings', label: 'Ustawienia', icon: Settings },
]

const roleLabels = {
  coach: 'Trener',
  parent: 'Rodzic',
  clubAdmin: 'Admin klubu',
}

function getNavItems(role) {
  if (role === 'coach') return coachNav
  if (role === 'clubAdmin') return clubAdminNav
  return parentNav
}

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const navItems = getNavItems(user?.role)

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
        <div className="sidebar-logo">
          SERVE<span style={{ color: 'var(--color-text)' }}>IQ</span>
          <span className="sidebar-logo-dot" />
        </div>

        {/* Club name if user belongs to a club */}
        {user?.club?.name && (
          <div className="sidebar-club-name">{user.club.name}</div>
        )}

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
              <item.icon size={18} className="sidebar-nav-icon" />
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
              {roleLabels[user?.role] || user?.role}
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
