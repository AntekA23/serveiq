import { Menu, Moon, Sun, Bell } from 'lucide-react'
import useUiStore from '../../../store/uiStore'
import useAuthStore from '../../../store/authStore'
import Avatar from '../../ui/Avatar'
import './Topbar.css'

export default function Topbar() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const user = useAuthStore((s) => s.user)

  return (
    <header className="topbar">
      <button className="topbar-menu" onClick={toggleSidebar}>
        <Menu size={20} />
      </button>

      <div className="topbar-title" />

      <div className="topbar-actions">
        <button className="topbar-icon-btn" onClick={toggleTheme} title="Zmien motyw">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button className="topbar-icon-btn" title="Powiadomienia">
          <Bell size={18} />
        </button>
        <Avatar
          firstName={user?.firstName}
          lastName={user?.lastName}
          size={28}
          role={user?.role}
          src={user?.avatar}
        />
      </div>
    </header>
  )
}
