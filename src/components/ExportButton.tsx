'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Download, Loader2 } from 'lucide-react'

interface ExportButtonProps {
  type: 'planning' | 'pointage' | 'paie'
  periode?: string
  start?: string
  end?: string
  label?: string
}

export default function ExportButton({ type, periode, start, end, label }: ExportButtonProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  const role = session?.user?.role
  if (role === 'EMPLOYE') return null

  const handleExport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type })
      if (periode) params.append('periode', periode)
      if (start) params.append('start', start)
      if (end) params.append('end', end)

      const res = await fetch(`/api/exports?${params}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `export_${type}_${new Date().toISOString().split('T')[0]}.xlsx`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleExport} disabled={loading}
      className="btn-secondary flex items-center gap-2 text-sm">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {loading ? 'Export...' : (label ?? 'Export Excel / Sheets')}
    </button>
  )
}
