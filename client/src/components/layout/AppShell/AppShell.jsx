import Sidebar from '../Sidebar'
import Topbar from '../Topbar'
import './AppShell.css'

export default function AppShell({ children }) {
  return (
    <div className="app-shell">
      {/* Sidebar: left navigation, hidden on mobile (slides in via overlay) */}
      <Sidebar />
      <div className="app-shell-main">
        <Topbar />
        <main className="app-shell-content">{children}</main>
      </div>
      {/* TODO: Mobile bottom tab bar — implement in a future sprint */}
    </div>
  )
}
