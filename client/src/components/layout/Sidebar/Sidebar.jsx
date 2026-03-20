import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  Trophy,
  MessageSquare,
  TrendingUp,
  LogOut,
} from 'lucide-react'
import useAuthStore from '../../../store/authStore'
import useUiStore from '../../../store/uiStore'
import useAuth from '../../../hooks/useAuth'
import Avatar from '../../ui/Avatar'
import './Sidebar.css'

const coachNav = [
  { to: '/coach/dashboard', label: 'Pulpit', icon: LayoutDashboard },
  { to: '/coach/players', label: 'Zawodnicy', icon: Users },
  { to: '/coach/sessions', label: 'Treningi', icon: Calendar },
  { to: '/coach/payments', label: 'Platnosci', icon: CreditCard },
  { to: '/coach/tournaments', label: 'Turnieje', icon: Trophy },
  { to: '/coach/messages', label: 'Wiadomosci', icon: MessageSquare },
]

const parentNav = [
  { to: '/parent/dashboard', label: 'Pulpit', icon: LayoutDashboard },
  { to: '/parent/progress', label: 'Postepy', icon: TrendingUp },
  { to: '/parent/payments', label: 'Platnosci', icon: CreditCard },
  { to: '/parent/messages', label: 'Wiadomosci', icon: MessageSquare },
]

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const navItems = user?.role === 'parent' ? parentNav : coachNav

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
        <div className="sidebar-logo">ServeIQ</div>

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
