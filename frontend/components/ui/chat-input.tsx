"use client"

import * as React from "react"
import { Loader2, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface ChatInputContextValue {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: () => void
  loading: boolean
  onStop: () => void
  rows?: number
  isDayMode?: boolean
}

const ChatInputContext = React.createContext<ChatInputContextValue | undefined>(undefined)

function useChatInput() {
  const context = React.useContext(ChatInputContext)
  if (!context) {
    throw new Error("ChatInput components must be used within ChatInput")
  }
  return context
}

interface ChatInputProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "minimal"
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: () => void
  loading?: boolean
  onStop?: () => void
  rows?: number
  isDayMode?: boolean
}

export function ChatInput({
  children,
  className,
  variant = "default",
  value,
  onChange,
  onSubmit,
  loading = false,
  onStop = () => {},
  rows = 1,
  isDayMode = false,
  ...props
}: ChatInputProps) {
  return (
    <ChatInputContext.Provider value={{ value, onChange, onSubmit, loading, onStop, rows, isDayMode }}>
      <div
        className={cn(
          "flex items-end gap-2 p-4 rounded-2xl transition-all duration-300",
          variant === "default" &&
            (isDayMode
              ? "bg-white/80 border border-neutral-200"
              : "bg-neutral-900/60 border border-neutral-800"),
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </ChatInputContext.Provider>
  )
}

interface ChatInputTextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {}

export function ChatInputTextArea({ className, ...props }: ChatInputTextAreaProps) {
  const { value, onChange, onSubmit, rows, isDayMode } = useChatInput()
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      rows={rows}
      className={cn(
        "flex-1 resize-none bg-transparent outline-none font-mono text-sm transition-colors duration-300",
        isDayMode ? "text-neutral-800 placeholder:text-neutral-400" : "text-neutral-100 placeholder:text-neutral-500",
        className,
      )}
      {...props}
    />
  )
}

export function ChatInputSubmit() {
  const { onSubmit, loading, onStop, value, isDayMode } = useChatInput()

  return (
    <Button
      onClick={loading ? onStop : onSubmit}
      disabled={!loading && !value.trim()}
      size="icon"
      className={cn(
        "rounded-full transition-all duration-300 flex-shrink-0",
        isDayMode
          ? "bg-neutral-800 hover:bg-neutral-700 text-white"
          : "bg-primary hover:bg-primary/80 text-primary-foreground",
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
    </Button>
  )
}
