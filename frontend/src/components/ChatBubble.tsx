import { motion } from 'framer-motion'

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
  language?: string
  citations?: string[]
  timestamp?: Date
}

export function ChatBubble({ role, content, language, citations, timestamp }: ChatBubbleProps) {
  const isUser = role === 'user'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-fifaBlue text-white rounded-br-md'
            : 'bg-white border border-neutral-200 rounded-bl-md shadow-sm'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{content}</p>
        
        {(citations && citations.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {citations.slice(0, 3).map((citation, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-0.5 rounded ${isUser ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-700'}`}
              >
                {citation}
              </span>
            ))}
            {citations.length > 3 && (
              <span className="text-xs text-neutral-500">
                +{citations.length - 3} more
              </span>
            )}
          </div>
        )}
        
        <div className="mt-1 flex items-center gap-2 text-[10px] opacity-70">
          {timestamp && (
            <span>{timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          )}
          {language && language !== 'en' && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-neutral-200">
              {language.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}