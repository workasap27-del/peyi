import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Tableau de bord', icon: '📊' },
  { to: '/journal', label: 'Journal', icon: '📝' },
  { to: '/parametres', label: 'Réglages', icon: '⚙️' },
]

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-10 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${
                isActive ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            <span className="text-lg leading-none">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
