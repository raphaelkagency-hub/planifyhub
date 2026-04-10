import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate, formatHours, formatCurrency } from '@/lib/utils'
import { Users, Clock, Calendar, FileText, TrendingUp, CheckCircle, AlertCircle, CalendarOff, Receipt, FolderOpen } from 'lucide-react'

async function getDashboardData(entrepriseId: string, userId: string, role: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  if (role === 'EMPLOYE') {
    const [monPointagesMois, monPlanning, mesPaies] = await Promise.all([
      prisma.pointage.findMany({
        where: { employeId: userId, date: { gte: startOfMonth } },
        select: { heuresTravaillees: true, heuresSupp: true, date: true },
      }),
      prisma.planning.findMany({
        where: { employeId: userId, date: { gte: today, lt: new Date(today.getTime() + 7 * 86400000) } },
        orderBy: { date: 'asc' },
      }),
      prisma.paie.findMany({
        where: { employeId: userId },
        orderBy: { periode: 'desc' },
        take: 3,
      }),
    ])
    const heuresMois = monPointagesMois.reduce((s, p) => s + (p.heuresTravaillees ?? 0), 0)
    const heuressSupMois = monPointagesMois.reduce((s, p) => s + (p.heuresSupp ?? 0), 0)
    const monPointageAujourdHui = monPointagesMois.find(p => new Date(p.date).toDateString() === today.toDateString())
    return { monPointageAujourdHui, monPlanning, mesPaies, heuresMois, heuressSupMois, type: 'employe' as const }
  }

  const entreprise = await prisma.entreprise.findUnique({
    where: { id: entrepriseId },
    select: { heuresContractuelles: true, heuresSupPayees: true, tauxHeuresSuppMultiplier: true },
  })

  const [totalEmployes, presentAujourdHui, congesEnCours, heuresCeMois, dernierPointages, prochainsPlannings, employesAvecSalaires, congesEnAttente, facturesStats, totalDocuments] = await Promise.all([
    prisma.employe.count({ where: { entrepriseId, actif: true } }),
    prisma.pointage.count({ where: { entrepriseId, date: { gte: today, lt: tomorrow }, statut: 'PRESENT' } }),
    prisma.pointage.count({ where: { entrepriseId, statut: 'CONGE', date: { gte: today } } }),
    prisma.pointage.aggregate({ where: { entrepriseId, date: { gte: startOfMonth } }, _sum: { heuresTravaillees: true } }),
    prisma.pointage.findMany({
      where: { entrepriseId, date: { gte: today, lt: tomorrow } },
      include: { employe: true },
      orderBy: { heureArrivee: 'desc' },
      take: 8,
    }),
    prisma.planning.findMany({
      where: { entrepriseId, date: { gte: today, lt: new Date(today.getTime() + 7 * 86400000) } },
      include: { employe: true },
      orderBy: { date: 'asc' },
      take: 8,
    }),
    // Salary calculation per employee for current month
    prisma.employe.findMany({
      where: { entrepriseId, actif: true },
      select: {
        id: true, prenom: true, nom: true, tauxHoraire: true, poste: true,
        heuresContractuelles: true,
        pointages: {
          where: { date: { gte: startOfMonth } },
          select: { heuresTravaillees: true, heuresSupp: true },
        },
      },
      take: 10,
      orderBy: { nom: 'asc' },
    }),
    // New KPIs
    prisma.congeAbsence.count({ where: { entrepriseId, statut: 'EN_ATTENTE' } }),
    prisma.facture.findMany({
      where: { entrepriseId, statut: { in: ['ENVOYEE', 'EN_RETARD'] } },
      select: { montantTTC: true },
    }),
    prisma.document.count({ where: { entrepriseId } }),
  ])

  const heuresContratDefaut = entreprise?.heuresContractuelles ?? 35
  const heuresSupPayees = entreprise?.heuresSupPayees ?? true
  const TAUX_SUPP = entreprise?.tauxHeuresSuppMultiplier ?? 1.25
  const CHARGES_SALARIALES = 0.22
  const CHARGES_PATRONALES = 0.42

  const salaires = employesAvecSalaires.map(emp => {
    const heuresTravaillees = emp.pointages.reduce((s, p) => s + (p.heuresTravaillees ?? 0), 0)
    const heuresSupp = emp.pointages.reduce((s, p) => s + (p.heuresSupp ?? 0), 0)
    const tauxHoraire = emp.tauxHoraire
    const salaireBrut = heuresTravaillees * tauxHoraire + (heuresSupPayees ? heuresSupp * tauxHoraire * TAUX_SUPP : 0)
    const cotisationsSalariales = salaireBrut * CHARGES_SALARIALES
    const salaireNet = salaireBrut - cotisationsSalariales
    return { ...emp, heuresTravaillees, heuresSupp, salaireBrut, cotisationsSalariales, salaireNet }
  })

  const totalImpayes = facturesStats.reduce((sum, f) => sum + f.montantTTC, 0)

  return {
    totalEmployes, presentAujourdHui, congesEnCours,
    heuresCeMois: heuresCeMois._sum.heuresTravaillees ?? 0,
    dernierPointages, prochainsPlannings, salaires,
    heuresSupPayees,
    congesEnAttente,
    totalImpayes,
    totalDocuments,
    type: 'admin' as const,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null
  const { user } = session
  const data = await getDashboardData(user.entrepriseId, user.id, user.role)

  if (data.type === 'employe') {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Bonjour, {user.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 mt-1">{formatDate(new Date())}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-6">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#e8f0fe' }}>
                <Clock className="w-5 h-5" style={{ color: '#1e3a5f' }} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pointage aujourd'hui</p>
                <p className="font-semibold text-gray-900">
                  {data.monPointageAujourdHui ? 'Pointé' : 'Non pointé'}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#e8f0fe' }}>
                <TrendingUp className="w-5 h-5" style={{ color: '#1e3a5f' }} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Heures ce mois</p>
                <p className="font-semibold text-gray-900">{formatHours(data.heuresMois)}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${data.heuressSupMois > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <AlertCircle className={`w-5 h-5 ${data.heuressSupMois > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Heures supp. ce mois</p>
                <p className={`font-semibold ${data.heuressSupMois > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                  {formatHours(data.heuressSupMois)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Dernière fiche de paie</h2>
            </div>
            {data.mesPaies[0] ? (
              <div>
                <p className="text-3xl font-bold mt-2" style={{ color: '#1e3a5f' }}>{formatCurrency(data.mesPaies[0].salaireNet)}</p>
                <p className="text-sm text-gray-500 mt-1">{data.mesPaies[0].periode}</p>
              </div>
            ) : <p className="text-gray-500 text-sm mt-2">Aucune fiche de paie</p>}
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Planning cette semaine</h2>
            </div>
            {data.monPlanning.length > 0 ? (
              <div className="space-y-2">
                {data.monPlanning.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{formatDate(p.date)}</p>
                      <p className="text-xs text-gray-500">{p.heureDebut} — {p.heureFin}</p>
                    </div>
                    <span className="badge bg-blue-100 text-blue-700">{p.statut}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-500 text-sm">Aucun planning cette semaine</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">{user.entrepriseNom} · {formatDate(new Date())}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-4">
        {[
          { label: 'Employés actifs', value: data.totalEmployes, icon: Users, color: '#1e3a5f', bg: '#e8f0fe' },
          { label: 'Présents aujourd\'hui', value: data.presentAujourdHui, icon: CheckCircle, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Congés en cours', value: data.congesEnCours, icon: AlertCircle, color: '#ca8a04', bg: '#fef9c3' },
          { label: 'Heures ce mois', value: formatHours(data.heuresCeMois), icon: Clock, color: '#7c3aed', bg: '#ede9fe' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: stat.bg }}>
                <Icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* Additional KPI Cards */}
      <div className="grid sm:grid-cols-3 gap-5 mb-6">
        <div className="card">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: '#fff7ed' }}>
            <CalendarOff className="w-5 h-5" style={{ color: '#ea580c' }} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{data.congesEnAttente}</div>
          <div className="text-sm text-gray-500 mt-1">Congés en attente</div>
        </div>
        <div className="card">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: '#fef2f2' }}>
            <Receipt className="w-5 h-5" style={{ color: '#dc2626' }} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{formatCurrency(data.totalImpayes)}</div>
          <div className="text-sm text-gray-500 mt-1">Factures impayées</div>
        </div>
        <div className="card">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: '#eff6ff' }}>
            <FolderOpen className="w-5 h-5" style={{ color: '#2563eb' }} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{data.totalDocuments}</div>
          <div className="text-sm text-gray-500 mt-1">Documents</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Présences */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Présences du jour</h2>
            <span className="badge bg-green-100 text-green-700">{data.presentAujourdHui} présents</span>
          </div>
          {data.dernierPointages.length > 0 ? (
            <div className="space-y-3">
              {data.dernierPointages.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ background: '#1e3a5f' }}>
                      {p.employe.prenom.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.employe.prenom} {p.employe.nom}</p>
                      <p className="text-xs text-gray-500">{p.employe.poste}</p>
                    </div>
                  </div>
                  <span className={`badge text-xs ${p.statut === 'PRESENT' ? 'bg-green-100 text-green-700' : p.statut === 'ABSENT' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {p.statut}
                  </span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500 text-sm">Aucun pointage aujourd'hui</p>}
        </div>

        {/* Planning */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Planning cette semaine</h2>
            <span className="badge bg-blue-100 text-blue-700">{data.prochainsPlannings.length} créneaux</span>
          </div>
          {data.prochainsPlannings.length > 0 ? (
            <div className="space-y-3">
              {data.prochainsPlannings.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {p.employe ? `${p.employe.prenom} ${p.employe.nom}` : 'Tous'}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(p.date)}</p>
                  </div>
                  <p className="text-sm text-gray-700">{p.heureDebut} — {p.heureFin}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500 text-sm">Aucun planning cette semaine</p>}
        </div>
      </div>

      {/* Salary Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Salaires du mois en cours</h2>
          {!data.heuresSupPayees && (
            <span className="badge bg-yellow-100 text-yellow-800 text-xs">H. supp non payées</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Employé</th>
                <th className="table-header">Heures trav.</th>
                <th className="table-header">H. supp.</th>
                <th className="table-header">Taux horaire</th>
                <th className="table-header">Salaire brut</th>
                <th className="table-header">Charges sal.</th>
                <th className="table-header">Salaire net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.salaires.length === 0 ? (
                <tr><td colSpan={7} className="table-cell text-center text-gray-400 py-6">Aucun pointage ce mois</td></tr>
              ) : (
                data.salaires.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#1e3a5f' }}>
                          {emp.prenom.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{emp.prenom} {emp.nom}</p>
                          {emp.poste && <p className="text-xs text-gray-400">{emp.poste}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell font-medium">{formatHours(emp.heuresTravaillees)}</td>
                    <td className="table-cell">
                      {emp.heuresSupp > 0 ? (
                        <span className="font-medium text-orange-600">{formatHours(emp.heuresSupp)}</span>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="table-cell">{formatCurrency(emp.tauxHoraire)}/h</td>
                    <td className="table-cell font-semibold">{formatCurrency(emp.salaireBrut)}</td>
                    <td className="table-cell text-red-600">-{formatCurrency(emp.cotisationsSalariales)}</td>
                    <td className="table-cell">
                      <span className="font-bold text-green-700">{formatCurrency(emp.salaireNet)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">Charges salariales estimées à 22% · Basé sur les pointages validés du mois</p>
      </div>
    </div>
  )
}
