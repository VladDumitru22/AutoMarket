import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getMyConversations, getConversation, sendMessage, markRead,
} from '../api/conversations'
import type { ConversationSummary, Conversation, Message } from '../api/conversations'
import { useAuth } from '../context/AuthContext'
import { Send, Car, User, MessageSquare } from 'lucide-react'

function UnreadDot({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
      {count > 9 ? '9+' : count}
    </span>
  )
}

export default function MessagesPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const { conversationId } = useParams<{ conversationId?: string }>()

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [active, setActive] = useState<Conversation | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const seenIds = useRef<Set<number>>(new Set())
  const userIdRef = useRef<number | undefined>(user?.UserID)
  useEffect(() => { userIdRef.current = user?.UserID }, [user])

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    loadConversations()
    return () => wsRef.current?.close()
  }, [user])

  useEffect(() => {
    if (conversationId) loadConversation(Number(conversationId))
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active?.messages.length])

  const openWebSocket = useCallback((convId: number) => {
    wsRef.current?.close()
    if (!token) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/conversations/${convId}?token=${token}`)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (
          data.type === 'message' &&
          data.SenderID !== userIdRef.current &&
          !seenIds.current.has(data.MessageID)
        ) {
          seenIds.current.add(data.MessageID)
          const msg: Message = {
            MessageID: data.MessageID,
            ConversationID: data.ConversationID,
            SenderID: data.SenderID,
            Content: data.Content,
            SentAt: data.SentAt,
            IsRead: data.IsRead,
          }
          setActive(prev =>
            prev?.ConversationID === convId
              ? { ...prev, messages: [...prev.messages, msg] }
              : prev
          )
          setConversations(prev =>
            prev.map(c => c.ConversationID === convId
              ? { ...c, last_message: msg.Content }
              : c
            )
          )
          markRead(convId)
        }
      } catch { /* ignore */ }
    }

    ws.onerror = () => ws.close()
    wsRef.current = ws
  }, [token])

  const loadConversations = async () => {
    const convs = await getMyConversations()
    setConversations(convs)
    if (conversationId) loadConversation(Number(conversationId))
  }

  const loadConversation = async (id: number) => {
    wsRef.current?.close()
    seenIds.current.clear()
    const full = await getConversation(id)
    full.messages.forEach(m => seenIds.current.add(m.MessageID))
    setActive(full)
    markRead(id)
    setConversations(prev =>
      prev.map(c => c.ConversationID === id ? { ...c, unread_count: 0 } : c)
    )
    openWebSocket(id)
  }

  const handleSend = async () => {
    if (!active || !input.trim() || sending) return
    setSending(true)
    try {
      const msg = await sendMessage(active.ConversationID, input.trim())
      seenIds.current.add(msg.MessageID)
      setActive(prev => prev ? { ...prev, messages: [...prev.messages, msg] } : prev)
      setInput('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
          <MessageSquare size={18} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Messages</h1>
      </div>

      <div className="flex h-[600px] bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/25">
        {/* Conversation list */}
        <div className="w-72 border-r border-slate-100 dark:border-white/[0.06] overflow-y-auto flex-shrink-0 bg-slate-50/60 dark:bg-slate-950/30">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600 text-sm gap-2 px-4 text-center">
              <Car size={32} className="text-slate-300 dark:text-slate-700" />
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.ConversationID}
                onClick={() => loadConversation(conv.ConversationID)}
                className={`w-full text-left p-4 border-b border-slate-100 dark:border-white/[0.04] hover:bg-white/80 dark:hover:bg-white/[0.03] transition-all ${
                  active?.ConversationID === conv.ConversationID
                    ? 'bg-white dark:bg-white/[0.05] border-l-2 border-l-orange-500'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Car size={12} className="text-orange-500 flex-shrink-0" />
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {conv.listing_title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User size={11} className="text-slate-400 flex-shrink-0" />
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{conv.other_party_name}</span>
                    </div>
                    {conv.last_message && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-1 ml-4">{conv.last_message}</p>
                    )}
                  </div>
                  <UnreadDot count={conv.unread_count} />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-2">
              <MessageSquare size={40} className="text-slate-300 dark:text-slate-700" />
              <p className="text-sm">Select a conversation</p>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 dark:border-white/[0.06] px-5 py-3 bg-white/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <Car size={15} className="text-orange-500" />
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{active.listing_title}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <User size={11} className="text-slate-400" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{active.other_party_name}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/40 dark:bg-slate-950/20">
                {active.messages.length === 0 && (
                  <div className="text-center text-sm text-slate-400 dark:text-slate-600 py-8">
                    No messages yet. Be the first to write!
                  </div>
                )}
                {active.messages.map((msg: Message) => {
                  const isMine = msg.SenderID === user?.UserID
                  return (
                    <div key={msg.MessageID} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                          isMine
                            ? 'bg-gradient-to-br from-orange-500 to-rose-500 text-white rounded-br-sm shadow-orange-500/20'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-100 dark:border-white/10 rounded-bl-sm'
                        }`}
                      >
                        <p className="break-words">{msg.Content}</p>
                        {msg.SentAt && (
                          <p className={`text-[10px] mt-1 ${isMine ? 'text-orange-100' : 'text-slate-400 dark:text-slate-500'}`}>
                            {new Date(msg.SentAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-slate-100 dark:border-white/[0.06] p-3 bg-white/50 dark:bg-white/[0.02] flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Write a message…"
                  className="flex-1 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white p-2.5 rounded-xl disabled:opacity-40 transition-all shadow-lg shadow-orange-500/25"
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
