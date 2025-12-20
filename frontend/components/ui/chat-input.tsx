"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button1 } from "./button-1"

const ArrowUp = () => (
  <svg
    height="16"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width="16"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.70711 1.39644C8.31659 1.00592 7.68342 1.00592 7.2929 1.39644L2.21968 6.46966L1.68935 6.99999L2.75001 8.06065L3.28034 7.53032L7.25001 3.56065V14.25V15H8.75001V14.25V3.56065L12.7197 7.53032L13.25 8.06065L14.3107 6.99999L13.7803 6.46966L8.70711 1.39644Z"
    />
  </svg>
)

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

interface ChatInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
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
  const { onSubmit, loading, onStop, value } = useChatInput()

  return (
    <Button1
      onClick={loading ? onStop : onSubmit}
      disabled={!loading && !value.trim()}
      type="golden"
      shape="rounded"
      size="medium"
      svgOnly
      loading={loading}
      aria-label="Send message"
    >
      <ArrowUp />
    </Button1>
  )
}
