'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Brain, Send, Loader2 } from 'lucide-react'
import { USE_FIXTURES } from '@/lib/fixtures/index'
import { cn } from '@/lib/utils'

export function CopilotPanel() {
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'ai'; text: string }>>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentStreamText, setCurrentStreamText] = useState('')
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, currentStreamText])

  const quickPrompts = [
    "What is today's main bottleneck?",
    "Which doctor has lowest workload?",
    "Is ICU near capacity?",
    "Summarize current alerts."
  ]

  const send = async (message: string) => {
    if (!message.trim() || isStreaming) return
    const userMsg = { id: Date.now().toString(), role: 'user' as const, text: message }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsStreaming(true)
    setCurrentStreamText('')

    if (USE_FIXTURES) {
      await new Promise(r => setTimeout(r, 800))
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'ai',
        text: 'Fixture mode active. Connect backend to enable real AI responses.' 
      }])
      setIsStreaming(false)
      return
    }

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ??
        (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000')
      const res = await fetch(`${baseUrl}/api/ai/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      if (!res.ok) throw new Error('Copilot unavailable')
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n')
        buffer = parts.pop() || ''
        for (const line of parts) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data || data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.chunk) {
              fullText += parsed.chunk
              setCurrentStreamText(fullText)
            }
          } catch (err) {
            if (err instanceof Error && err.message !== 'Unexpected end of JSON input') {
              // Only rethrow intentional API errors, not JSON parse noise
              if (!err.message.includes('JSON')) throw err
            }
          }
        }
      }

      if (!fullText.trim()) throw new Error('Copilot returned an empty answer')
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'ai', text: fullText }])
    } catch (e) {
      const err = e instanceof Error ? e.message : 'Copilot temporarily unavailable.'
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'ai', text: err }])
    } finally {
      setIsStreaming(false)
      setCurrentStreamText('')
    }
  }

  return (
    <div className="card h-full flex flex-col">
      <div className="flex-shrink-0 p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-ai flex-shrink-0" />
          <h3 className="font-semibold text-text-primary whitespace-nowrap">AI Copilot</h3>
          <span className="text-[10px] bg-ai-100 text-ai px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">AI</span>
        </div>
        <span className="text-xs text-text-secondary leading-tight">Answers from live hospital snapshot</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <span className="text-text-tertiary text-sm">Ask anything about current hospital status.</span>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={cn("flex flex-col", msg.role === 'user' ? 'items-end' : 'items-start')}>
              {msg.role === 'ai' && <span className="text-[10px] font-bold text-ai mb-1 ml-1">AI</span>}
              <div className={cn(
                "max-w-[85%] text-sm px-3 py-2 rounded-2xl",
                msg.role === 'user' ? "bg-brand text-white rounded-br-sm" : "bg-ai-50 text-text-primary border border-ai-100 rounded-bl-sm whitespace-pre-wrap leading-relaxed"
              )}>
                {msg.text}
              </div>
            </div>
          ))
        )}

        {isStreaming && currentStreamText && (
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-bold text-ai mb-1 ml-1">AI</span>
            <div className="max-w-[85%] text-sm px-3 py-2 rounded-2xl bg-ai-50 text-text-primary border border-ai-100 rounded-bl-sm whitespace-pre-wrap leading-relaxed">
              {currentStreamText}
              <span className="inline-block w-1 h-3 ml-1 bg-ai animate-pulse" />
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 px-3 py-2 flex gap-2 overflow-x-auto border-t border-border bg-bg-page/50 hide-scrollbar">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => send(prompt)}
            disabled={isStreaming}
            className="flex-shrink-0 text-xs bg-bg-page border border-border rounded-chip px-2.5 py-1.5 cursor-pointer hover:bg-ai-50 hover:border-ai hover:text-ai transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-text-secondary"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="flex-shrink-0 p-3 border-t border-border flex gap-2 bg-white">
        <textarea
          rows={1}
          className="resize-none text-sm flex-1 border border-border rounded-button px-3 py-2 focus:outline-none focus:border-ai transition-colors"
          placeholder="Ask about patients, resources, alerts..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          disabled={isStreaming}
        />
        <button
          onClick={() => send(input)}
          disabled={isStreaming || !input.trim()}
          className="bg-ai hover:bg-ai/90 text-white rounded-button p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-10 h-10 flex-shrink-0 shadow-sm"
        >
          {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
