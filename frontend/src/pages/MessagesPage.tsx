import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMyConversations, getConversation, sendMessage, markRead } from '../api/conversations'
import type { Conversation, Message } from '../api/conversations'
import { useAuth } from '../context/AuthContext'
import { Send } from 'lucide-react'

export default function MessagesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { conversationId } = useParams<{ conversationId?: string }>()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [active, setActive] = useState<Conversation | null>(null)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    getMyConversations().then(convs => {
      setConversations(convs)
      if (conversationId) {
        const found = convs.find(c => c.ConversationID === Number(conversationId))
        if (found) selectConversation(found)
      }
    })
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active?.messages])

  const selectConversation = async (conv: Conversation) => {
    const full = await getConversation(conv.ConversationID)
    setActive(full)
    markRead(conv.ConversationID)
  }

  const handleSend = async () => {
    if (!active || !input.trim()) return
    const msg = await sendMessage(active.ConversationID, input)
    setActive(prev => prev ? { ...prev, messages: [...prev.messages, msg] } : prev)
    setInput('')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Messages</h1>
      <div className="flex h-[600px] bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-slate-200 overflow-y-auto flex-shrink-0">
          {conversations.length === 0 && (
            <p className="text-sm text-slate-400 p-4">No conversations yet</p>
          )}
          {conversations.map(conv => (
            <button
              key={conv.ConversationID}
              onClick={() => selectConversation(conv)}
              className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 ${active?.ConversationID === conv.ConversationID ? 'bg-blue-50' : ''}`}
            >
              <div className="text-sm font-medium text-slate-900">Listing #{conv.ListingID}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {conv.BuyerID === user?.UserID ? 'You → Seller' : 'Buyer → You'}
              </div>
            </button>
          ))}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 px-4 py-3">
                <span className="font-medium text-sm text-slate-900">Listing #{active.ListingID}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {active.messages.map((msg: Message) => {
                  const isMine = msg.SenderID === user?.UserID
                  return (
                    <div key={msg.MessageID} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${isMine ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                        {msg.Content}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              <div className="border-t border-slate-200 p-3 flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
                  placeholder="Type a message..."
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={handleSend} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
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
