import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getMyConversations, getConversation, sendMessage, markRead,
} from '../api/conversations'
import type { ConversationSummary, Conversation, Message } from '../api/conversations'
import { useAuth } from '../context/AuthContext'
import { Send, Car, User } from 'lucide-react'

function UnreadDot({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
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
  // Stable ref to current user ID to avoid stale closures in WS handler
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
          data.SenderID !== userIdRef.current &&   // skip own messages (they come from HTTP response)
          !seenIds.current.has(data.MessageID)     // dedup guard
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
          // Mark as read immediately so Navbar notification count stays accurate
          markRead(convId)
        }
      } catch { /* ignore malformed frames */ }
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
      // Add to seenIds first so the WS echo (if it races ahead) is ignored
      seenIds.current.add(msg.MessageID)
      setActive(prev => prev ? { ...prev, messages: [...prev.messages, msg] } : prev)
      setInput('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Messages</h1>

      <div className="flex h-[600px] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* Conversation list */}
        <div className="w-72 border-r border-slate-200 overflow-y-auto flex-shrink-0 bg-slate-50">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm gap-2">
              <Car size={32} className="text-slate-300" />
              <p>No conversations</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.ConversationID}
                onClick={() => loadConversation(conv.ConversationID)}
                className={`w-full text-left p-4 border-b border-slate-200 hover:bg-white transition-colors ${
                  active?.ConversationID === conv.ConversationID ? 'bg-white border-l-2 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Car size={13} className="text-blue-500 flex-shrink-0" />
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {conv.listing_title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User size={12} className="text-slate-400 flex-shrink-0" />
                      <span className="text-xs text-slate-500 truncate">{conv.other_party_name}</span>
                    </div>
                    {conv.last_message && (
                      <p className="text-xs text-slate-400 truncate mt-1 ml-4">{conv.last_message}</p>
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
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Car size={40} className="text-slate-300" />
              <p className="text-sm">Select a conversation</p>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 px-5 py-3 bg-white">
                <div className="flex items-center gap-2">
                  <Car size={16} className="text-blue-500" />
                  <span className="font-semibold text-sm text-slate-900">{active.listing_title}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <User size={12} className="text-slate-400" />
                  <span className="text-xs text-slate-500">{active.other_party_name}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50">
                {active.messages.length === 0 && (
                  <div className="text-center text-sm text-slate-400 py-8">
                    No messages yet. Be the first to write!
                  </div>
                )}
                {active.messages.map((msg: Message) => {
                  const isMine = msg.SenderID === user?.UserID
                  return (
                    <div key={msg.MessageID} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                          isMine
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-white text-slate-900 border border-slate-200 rounded-bl-sm'
                        }`}
                      >
                        <p className="break-words">{msg.Content}</p>
                        {msg.SentAt && (
                          <p className={`text-[10px] mt-1 ${isMine ? 'text-blue-200' : 'text-slate-400'}`}>
                            {new Date(msg.SentAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-slate-200 p-3 bg-white flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Write a message…"
                  className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
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
