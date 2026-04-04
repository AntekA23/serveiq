import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import useAuthStore from '../../../store/authStore'
import useUiStore from '../../../store/uiStore'
import useAuth from '../../../hooks/useAuth'
import Avatar from '../../ui/Avatar'
import './Sidebar.css'

const coachNav = [
  { to: '/coach/dashboard', label: 'Dashboard', icon: '\u{1F3E0}' },
  { to: '/groups', label: 'Grupy', icon: '\u{1F465}' },
  { to: '/players', label: 'Zawodnicy', icon: '\u{1F464}' },
  { to: '/activities', label: 'Aktywno\u015Bci', icon: '\u{1F4C5}' },
  { to: '/reviews', label: 'Recenzje', icon: '\u{1F4CB}' },
  { to: '/coach/requests', label: 'Pro\u015Bby', icon: '\u{1F4E9}' },
  { to: '/messages', label: 'Wiadomo\u015Bci', icon: '\u{1F4AC}' },
  { to: '/settings', label: 'Ustawienia', icon: '\u2699\uFE0F' },
]

const parentNav = [
  { to: '/parent/dashboard', label: 'Panel', icon: '\u{1F3E0}' },
  { to: '/my-children', label: 'Moje dzieci', icon: '\u{1F476}' },
  { to: '/parent/add-coach', label: 'Dodaj trenera', icon: '\u{1F517}' },
  { to: '/calendar', label: 'Kalendarz', icon: '\u{1F4C5}' },
  { to: '/timeline', label: 'Timeline', icon: '\u{1F4F0}' },
  { to: '/messages', label: 'Wiadomo\u015Bci', icon: '\u{1F4AC}' },
  { to: '/settings', label: 'Ustawienia', icon: '\u2699\uFE0F' },
]

const clubAdminNav = [
  { to: '/club/dashboard', label: 'Panel Klubu', icon: '\u{1F3E0}' },
  { to: '/groups', label: 'Grupy', icon: '\u{1F465}' },
  { to: '/players', label: 'Zawodnicy', icon: '\u{1F464}' },
  { to: '/coaches', label: 'Trenerzy', icon: '\u{1F3CB}\uFE0F' },
  { to: '/activities', label: 'Aktywno\u015Bci', icon: '\u{1F4C5}' },
  { to: '/reviews', label: 'Recenzje', icon: '\u{1F4CB}' },
  { to: '/settings', label: 'Ustawienia', icon: '\u2699\uFE0F' },
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
              <span className="sidebar-nav-icon">{item.icon}</span>
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
