'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { FolderOpen, Plus, Download, Trash2, FileText, Loader2, X, AlertCircle, CheckCircle, Search } from 'lucide-react'

const NAVY = '#1e3a5f'

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  CONTRAT: { label: 'Contrat', color: '#1d4ed8', bg: '#dbeafe' },
  RH: { label: 'RH', color: '#7c3aed', bg: '#ede9fe' },
  FACTURE: { label: 'Facture', color: '#16a34a', bg: '#dcfce7' },
  AUTRE: { label: 'Autre', color: '#6b7280', bg: '#f3f4f6' },
}

export default function DocumentsPage() {
  const { data: session } = useSession()
  const role = session?.user?.role ?? ''
  const isAdmin = role === 'DIRIGEANT' || role === 'SECRETARIAT'

  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filterType, setFilterType] = useState('TOUS')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [form, setForm] = useState({ nom: '', type: 'AUTRE', fichierUrl: '', employeId: '' })

  const showT = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/documents')
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents ?? [])
      }
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nom || !form.fichierUrl) { showT('Nom et URL requis', 'error'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: form.nom,
          type: form.type,
          fichierUrl: form.fichierUrl,
          ...(isAdmin && form.employeId ? { employeId: form.employeId } : {}),
        }),
      })
      if (res.ok) {
        showT('Document ajouté')
        setForm({ nom: '', type: 'AUTRE', fichierUrl: '', employeId: '' })
        setShowForm(false)
        fetchDocs()
      } else {
        const err = await res.json()
        showT(err.error || 'Erreur', 'error')
      }
    } catch { showT('Erreur réseau', 'error') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id: string, nom: string) => {
    if (!window.confirm(`Supprimer "${nom}" ?`)) return
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      if (res.ok) { showT('Document supprimé'); fetchDocs() }
      else showT('Erreur lors de la suppression', 'error')
    } catch { showT('Erreur réseau', 'error') }
  }

  const filtered = documents.filter(d => {
    const matchType = filterType === 'TOUS' || d.type === filterType
    const matchSearch = !search || d.nom.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const fmtSize = (bytes?: number | null) => {
    if (!bytes) return null
    if (bytes < 1024) return `${bytes} o`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
    return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
  }

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderOpen className="w-7 h-7" style={{ color: NAVY }} />
            Documents
          </h1>
          <p className="text-gray-500 mt-1">Stockage sécurisé de vos documents d&apos;entreprise</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Ajouter un document
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Ajouter un document</h2>
            <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nom du document *</label>
              <input type="text" className="form-input" placeholder="Contrat CDI - Jean Dupont"
                value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Type</label>
              <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">URL du fichier *</label>
              <input type="url" className="form-input" placeholder="https://..."
                value={form.fichierUrl} onChange={e => setForm({ ...form, fichierUrl: e.target.value })} required />
              <p className="text-xs text-gray-400 mt-1">Collez le lien public vers votre fichier (Google Drive, Dropbox, etc.)</p>
            </div>
            {isAdmin && (
              <div className="sm:col-span-2">
                <label className="form-label">Lier à un employé (optionnel)</label>
                <input type="text" className="form-input" placeholder="ID de l'employé"
                  value={form.employeId} onChange={e => setForm({ ...form, employeId: e.target.value })} />
              </div>
            )}
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
              <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        <div className="flex gap-1 border-b border-gray-200">
          {['TOUS', 'CONTRAT', 'RH', 'FACTURE', 'AUTRE'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                filterType === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t === 'TOUS' ? 'Tous' : TYPE_CONFIG[t]?.label ?? t}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" className="form-input pl-9 py-2 text-sm w-48"
            placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Document list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">Aucun document</h3>
          <p className="text-sm text-gray-400 mb-6">Ajoutez vos premiers documents pour les retrouver facilement</p>
          <button className="btn-primary mx-auto" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 inline mr-2" />
            Ajouter un document
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => {
            const cfg = TYPE_CONFIG[doc.type] ?? TYPE_CONFIG.AUTRE
            const size = fmtSize(doc.taille)
            return (
              <div key={doc.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                    <FileText className="w-5 h-5" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex gap-1">
                    <a href={doc.fichierUrl} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors" title="Télécharger">
                      <Download className="w-4 h-4" />
                    </a>
                    {(isAdmin || doc.uploadePar === session?.user?.id) && (
                      <button onClick={() => handleDelete(doc.id, doc.nom)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 transition-colors" title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate" title={doc.nom}>{doc.nom}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge text-xs" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  {doc.employe && (
                    <span className="text-xs text-gray-400">{doc.employe.prenom} {doc.employe.nom}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</p>
                  {size && <p className="text-xs text-gray-400">{size}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
