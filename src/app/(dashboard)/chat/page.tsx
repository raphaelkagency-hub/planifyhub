'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { hasFeature } from '@/lib/subscription'
import { formatDateTime } from '@/lib/utils'
import { MessageSquare, Send, Lock, AlertTriangle, Loader2 } from 'lucide-react'

interface ChatMessage {
  id: string
  auteurId: string
  auteurNom: string
  auteurRole: string
  contenu: string
  type: string
  createdAt: string
}

export default function ChatPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [messageType, setMessageType] = useState('TEXT')
  const bottomRef = useRef<HTMLDivElement>(null)

  const role = session?.user?.role
  const abonnement = session?.user?.abonnement as any
  const canSend = role === 'DIRIGEANT' || role === 'SECRETARIAT'
  const hasAccess = hasFeature(abonnement, 'chatLectureSeule') || hasFeature(abonnement, 'messagerie')

  useEffect(() => {
    if (hasAccess) {
      fetchMessages()
      const interval = setInterval(fetchMessages, 30000) // Refresh every 30s
      return () => clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/chat')
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !canSend) return

    setSending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: newMessage.trim(), type: messageType }),
      })
      if (res.ok) {
        setNewMessage('')
        setMessageType('TEXT')
        fetchMessages()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="card max-w-md text-center py-12">
          <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Fonctionnalité non disponible</h2>
          <p className="text-gray-600">
            Le chat interne est disponible à partir du plan <strong>Standard</strong>.
          </p>
          <a href="/abonnement" className="btn-primary mt-4 inline-block">
            Voir les plans
          </a>
        </div>
      </div>
    )
  }

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'ANNONCE': return 'border-l-4 border-blue-500 bg-blue-50'
      case 'URGENT': return 'border-l-4 border-red-500 bg-red-50'
      default: return 'bg-gray-50'
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'ANNONCE': return <span className="badge bg-blue-100 text-blue-700 text-xs mr-2">Annonce</span>
      case 'URGENT': return <span className="badge bg-red-100 text-red-700 text-xs mr-2">Urgent</span>
      default: return null
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'DIRIGEANT': return 'text-purple-700 bg-purple-100'
      case 'SECRETARIAT': return 'text-blue-700 bg-blue-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat interne</h1>
          <p className="text-gray-500 mt-1">
            {canSend
              ? 'Envoyez des messages et annonces à votre équipe'
              : 'Lecture seule — Seuls les dirigeants et secrétaires peuvent écrire'
            }
          </p>
        </div>
        {!canSend && (
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
            <Lock className="w-4 h-4" />
            Lecture seule
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 card overflow-y-auto mb-4 p-4 space-y-4 min-h-0">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun message pour l'instant</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.auteurId === session?.user?.id
            return (
              <div key={msg.id} className={`rounded-xl p-4 ${getTypeStyle(msg.type)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getRoleColor(msg.auteurRole)}`}>
                      {msg.auteurNom.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {getTypeBadge(msg.type)}
                        <span className="font-semibold text-gray-900 text-sm">
                          {msg.auteurNom}
                          {isMe && <span className="text-gray-400 font-normal"> (moi)</span>}
                        </span>
                        <span className={`badge text-xs ${getRoleColor(msg.auteurRole)}`}>
                          {msg.auteurRole}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatDateTime(msg.createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-gray-800 text-sm leading-relaxed ml-10">{msg.contenu}</p>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Send form */}
      {canSend ? (
        <form onSubmit={handleSend} className="card p-4">
          <div className="flex gap-3 mb-3">
            {['TEXT', 'ANNONCE', 'URGENT'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setMessageType(type)}
                className={`badge cursor-pointer px-3 py-1 transition-colors ${
                  messageType === type
                    ? type === 'URGENT' ? 'bg-red-500 text-white' : type === 'ANNONCE' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type === 'TEXT' ? 'Message' : type === 'ANNONCE' ? 'Annonce' : '🚨 Urgent'}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              className="form-input flex-1"
              placeholder="Tapez votre message..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="btn-primary px-4 flex items-center gap-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Envoyer
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">{newMessage.length}/500 caractères</p>
        </form>
      ) : (
        <div className="card p-4 bg-gray-50 text-center text-gray-500 text-sm">
          <Lock className="w-4 h-4 inline mr-2" />
          Vous êtes en mode lecture seule. Seuls les dirigeants et secrétaires peuvent envoyer des messages.
        </div>
      )}
    </div>
  )
}
