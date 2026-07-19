'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFanChat } from '../../hooks/useApi'
import { LanguageCode } from '../../lib/api'

const LANGUAGES: { code: LanguageCode; name: string; flag: string }[] = [
  { code: 'en', name: 'English',   flag: '🇺🇸' },
  { code: 'es', name: 'Español',   flag: '🇪🇸' },
  { code: 'fr', name: 'Français',  flag: '🇫🇷' },
  { code: 'ar', name: 'العربية',   flag: '🇸🇦' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'zh', name: '中文',       flag: '🇨🇳' },
]

const QUICK_QUESTIONS = [
  'Where is Gate A?',
  'How do I get to Section 101?',
  "Where's the nearest sensory room?",
  'What transit options are available?',
]

interface Message {
  role: 'user' | 'assistant'
  content: string
  language: LanguageCode
  timestamp: Date
}

interface ChatWidgetProps {
  fabOnly?: boolean
}

export function ChatWidget({ fabOnly = false }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [language, setLanguage] = useState<LanguageCode>('en')
  const [isOpen, setIsOpen]     = useState(!fabOnly)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLInputElement>(null)
  const chatMutation   = useFanChat()

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (isOpen) inputRef.current?.focus() }, [isOpen])

  const handleSend = async (e: React.FormEvent, overrideText?: string) => {
    e.preventDefault()
    const text = overrideText ?? input
    if (!text.trim() || isLoading) return

    const userMsg: Message = { role: 'user', content: text, language, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await chatMutation.mutateAsync({
        message: text,
        language,
        context: { history: messages.slice(-4).map(m => ({ role: m.role, content: m.content })) },
      }) as any
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.response,
        language: res.language as LanguageCode,
        timestamp: new Date(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting. Please try again or visit the nearest info booth.",
        language,
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const chatPanel = (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col overflow-hidden"
      style={{
        backgroundColor: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        borderRadius: 16,
        height: fabOnly ? 520 : '100%',
        minHeight: fabOnly ? undefined : 480,
        ...(fabOnly ? {
          position: 'fixed',
          bottom: 88,
          right: 24,
          width: 380,
          zIndex: 50,
          boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
        } : {}),
      }}
      role="dialog"
      aria-label="Stadium Assistant"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--c-border)', backgroundColor: 'var(--c-surface2)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.2)' }}
          >
            <svg className="w-4.5 h-4.5" style={{ color: 'var(--c-accent)', width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-sm" style={{ color: 'var(--c-text-primary)' }}>
              Stadium Assistant
            </h3>
            <p className="text-[10px]" style={{ color: 'var(--c-accent)' }}>Powered by Gemini AI</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language selector */}
          <select
            value={language}
            onChange={e => setLanguage(e.target.value as LanguageCode)}
            className="text-xs px-2 py-1 rounded-md"
            style={{
              backgroundColor: 'var(--c-surface)',
              border: '1px solid var(--c-border)',
              color: 'var(--c-text-primary)',
              outline: 'none',
            }}
            aria-label="Language"
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
            ))}
          </select>

          {fabOnly && (
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--c-text-muted)' }}
              aria-label="Close chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}
            >
              <svg className="w-7 h-7" style={{ color: 'var(--c-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--c-text-primary)' }}>
              Ask me anything!
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--c-text-muted)' }}>
              I can help with navigation, transport, accessibility & more
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {QUICK_QUESTIONS.map((q, i) => (
                <motion.button
                  key={q}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={e => handleSend(e as any, q)}
                  className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                  style={{
                    backgroundColor: 'var(--c-surface2)',
                    border: '1px solid var(--c-border)',
                    color: 'var(--c-text-secondary)',
                  }}
                >
                  {q}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={`${msg.timestamp.getTime()}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={msg.role === 'user' ? {
                  backgroundColor: 'var(--c-accent)',
                  color: '#0D1117',
                  borderBottomRightRadius: 4,
                  fontWeight: 500,
                } : {
                  backgroundColor: 'var(--c-surface2)',
                  border: '1px solid var(--c-border)',
                  color: 'var(--c-text-primary)',
                  borderBottomLeftRadius: 4,
                }}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className="text-[10px] mt-1 opacity-60">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div
              className="px-4 py-3 rounded-2xl"
              style={{
                backgroundColor: 'var(--c-surface2)',
                border: '1px solid var(--c-border)',
                borderBottomLeftRadius: 4,
              }}
            >
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map(delay => (
                  <span
                    key={delay}
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ backgroundColor: 'var(--c-accent)', animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="px-4 py-3"
        style={{ borderTop: '1px solid var(--c-border)', backgroundColor: 'var(--c-surface2)' }}
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your question…"
            className="input-field text-sm flex-1"
            disabled={isLoading}
            aria-label="Chat input"
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!input.trim() || isLoading}
            className="btn-primary px-3 py-2 rounded-lg"
            aria-label="Send message"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </motion.button>
        </div>
        <p className="text-[10px] mt-2 text-center" style={{ color: 'var(--c-text-muted)' }}>
          EN · ES · FR · AR · PT · ZH
        </p>
      </form>
    </motion.div>
  )

  if (!fabOnly) return chatPanel

  return (
    <>
      {/* FAB button */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: 'var(--c-accent)',
          boxShadow: '0 0 20px rgba(0,212,255,0.5)',
          color: '#0D1117',
        }}
        aria-label={isOpen ? 'Close chat' : 'Open Stadium Assistant'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.svg key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>{isOpen && chatPanel}</AnimatePresence>
    </>
  )
}