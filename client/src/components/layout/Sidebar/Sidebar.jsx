import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, User, CalendarDays, CalendarClock, ClipboardList,
  MessageCircle, Settings, LogOut, Baby, Link2,
  Newspaper, Dumbbell, Building2, BarChart3, CreditCard, Cog,
  FileText, Trophy,
} from 'lucide-react'
import api from '../../../api/axios'
import useAuthStore from '../../../store/authStore'
import useUiStore from '../../../store/uiStore'
import useAuth from '../../../hooks/useAuth'
import Avatar from '../../ui/Avatar'
import './Sidebar.css'

const coachNav = [
  { to: '/coach/dashboard', label: 'Panel', icon: LayoutDashboard },
  { to: '/coach/calendar', label: 'Kalendarz', icon: CalendarClock },
  { to: '/players', label: 'Zawodnicy', icon: User },
  { to: '/messages', label: 'Wiadomości', icon: MessageCircle },
  { section: 'Zarządzanie' },
  { to: '/coach/sessions', label: 'Treningi', icon: ClipboardList },
  { to: '/coach/reviews', label: 'Oceny', icon: FileText },
  { to: '/coach/payments', label: 'Płatności', icon: CreditCard },
  { to: '/coach/tournaments', label: 'Turnieje', icon: Trophy },
  { to: '/settings', label: 'Ustawienia', icon: Settings },
]

const clubAdminNav = [
  { to: '/club/dashboard', label: 'Panel', icon: LayoutDashboard },
  { to: '/club/facility', label: 'Infrastruktura', icon: Building2 },
  { to: '/club/players', label: 'Zawodnicy', icon: User },
  { to: '/coaches', label: 'Trenerzy', icon: Dumbbell },
  { to: '/club/payments', label: 'Płatności', icon: CreditCard },
  { to: '/messages', label: 'Wiadomości', icon: MessageCircle },
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
  return [] // parent nav is built dynamically
}

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [children, setChildren] = useState([])

  // Fetch children names for parent sidebar
  useEffect(() => {
    if (user?.role !== 'parent') return

    // Try populated data from store first
    const storeChildren = user.parentProfile?.children || []
    const alreadyPopulated = storeChildren.length > 0 && typeof storeChildren[0] === 'object' && storeChildren[0].firstName
    if (alreadyPopulated) {
      setChildren(storeChildren)
      return
    }

    // Otherwise fetch from API
    if (storeChildren.length > 0) {
      api.get('/players')
        .then(({ data }) => {
          const players = Array.isArray(data) ? data : data.players || []
          const ids = storeChildren.map((c) => typeof c === 'object' ? c._id : c)
          const myChildren = players.filter((p) => ids.includes(p._id))
          setChildren(myChildren)
        })
        .catch(() => {})
    }
  }, [user])

  // Build parent nav dynamically with children names
  const buildParentNav = () => {
    const items = [
      { to: '/parent/dashboard', label: 'Panel', icon: LayoutDashboard },
    ]

    if (children.length > 0) {
      children.forEach((child) => {
        items.push({
          to: `/parent/child/${child._id}`,
          label: child.firstName,
          icon: User,
          childPath: true,
        })
      })
    } else {
      items.push({ to: '/my-children', label: 'Zawodnicy', icon: Users })
    }

    items.push(
      { to: '/parent/add-coach', label: 'Dodaj trenera', icon: Link2 },
      { to: '/messages', label: 'Wiadomości', icon: MessageCircle },
      { to: '/settings', label: 'Ustawienia', icon: Settings },
    )

    return items
  }

  const navItems = user?.role === 'parent' ? buildParentNav() : getNavItems(user?.role)

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
          {navItems.map((item, idx) =>
            item.section ? (
              <div key={item.section} className="sidebar-section-label">
                {item.section}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={!item.childPath}
                className={({ isActive }) =>
                  `sidebar-nav-item${isActive ? ' active' : ''}`
                }
                onClick={handleNavClick}
              >
                <item.icon size={18} className="sidebar-nav-icon" />
                {item.label}
              </NavLink>
            )
          )}
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
