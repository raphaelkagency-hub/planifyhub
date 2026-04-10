'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard, Calendar, Clock, FileText, MessageSquare,
  Settings, Users, Building2, LogOut, ChevronDown, BarChart3, CreditCard,
  CalendarOff, Receipt, FolderOpen
} from 'lucide-react'
import { getRoleBadgeColor, getRoleLabel } from '@/lib/utils'
import { useState } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)

  const role = session?.user?.role ?? ''
  const planId = (session?.user as any)?.planId ?? ''
  const planName = planId === 'STARTER' ? 'Starter'
    : planId === 'BUSINESS' ? 'Business'
    : planId === 'ENTERPRISE' ? 'Enterprise'
    : 'Tout inclus'

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  const navItems = [
    { href: '/dashboard',    icon: LayoutDashboard, label: 'Tableau de bord',      show: true },
    { href: '/planning',     icon: Calendar,        label: 'Planning',              show: true },
    { href: '/pointage',     icon: Clock,           label: 'Pointage',              show: true },
    { href: '/paie',         icon: FileText,        label: 'Fiches de paie',        show: true },
    { href: '/conges',       icon: CalendarOff,     label: 'Congés & Absences',     show: true },
    { href: '/chat',         icon: MessageSquare,   label: 'Chat interne',          show: true },
    { href: '/employes',     icon: Users,           label: 'Employés',              show: role === 'DIRIGEANT' || role === 'SECRETARIAT' },
    { href: '/facturation',  icon: Receipt,         label: 'Facturation',           show: role === 'DIRIGEANT' || role === 'SECRETARIAT' },
    { href: '/documents',    icon: FolderOpen,      label: 'Documents',             show: true },
    { href: '/rapports',     icon: BarChart3,       label: 'Rapports',              show: role === 'DIRIGEANT' || role === 'SECRETARIAT' },
    { href: '/abonnement',   icon: CreditCard,      label: 'Abonnement',            show: role === 'DIRIGEANT' },
    { href: '/settings',     icon: Settings,        label: 'Paramètres',            show: role === 'DIRIGEANT' || role === 'SECRETARIAT' },
  ]

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} text-white flex flex-col transition-all duration-300 min-h-screen`} style={{ background: '#0f2340' }}>

      {/* Logo */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#1e3a5f' }}>
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg truncate">PlanifyHub</span>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto" style={{ background: '#1e3a5f' }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white p-1 rounded ml-auto"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-90' : '-rotate-90'}`} />
        </button>
      </div>

      {/* Nom de l'entreprise */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-gray-800">
          <p className="text-sm font-medium text-white truncate">{session?.user?.entrepriseNom}</p>
          <p className="text-xs text-gray-400 mt-0.5">Plan {planName}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.filter(item => item.show).map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                active
                  ? 'text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
              style={active ? { background: '#1e3a5f' } : {}}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Utilisateur connecté */}
      <div className="border-t border-gray-800 p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold" style={{ background: '#1e3a5f' }}>
              {session?.user?.name?.charAt(0) ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
              <span className={`badge text-xs ${getRoleBadgeColor(role)}`}>
                {getRoleLabel(role)}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={collapsed ? 'Déconnexion' : undefined}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors w-full ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Déconnexion</span>}
        </button>
      </div>
    </aside>
  )
}
