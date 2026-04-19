"use client"

import { useEffect, useMemo, useRef, useState } from "react"

const GOLD = "#C9A84C"
const MUTED = "#888888"
const MAX_PREVIEW_LENGTH = 200

type Phase = "display" | "shred" | "particles" | "confirm"

interface VentShredderProps {
  ventText: string
  onComplete: () => void
}

interface Strip {
  id: number
  offsetX: number
  offsetY: number
  skew: number
  delay: number
  duration: number
}

interface Particle {
  id: number
  x: number
  y: number
  size: number
  delay: number
  duration: number
  rotate: number
  scale: number
  borderRadius: string
}

function truncateVentText(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim()

  if (normalized.length <= MAX_PREVIEW_LENGTH) {
    return normalized
  }

  return `${normalized.slice(0, MAX_PREVIEW_LENGTH).trimEnd()}...`
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function VentShredder({ ventText, onComplete }: VentShredderProps) {
  const displayText = useMemo(() => truncateVentText(ventText), [ventText])
  const stripCount = useMemo(() => 8 + (displayText.length % 5), [displayText.length])

  const measureRef = useRef<HTMLParagraphElement>(null)
  const timeoutsRef = useRef<number[]>([])
  const rafsRef = useRef<number[]>([])
  const isDoneRef = useRef(false)

  const [phase, setPhase] = useState<Phase>("display")
  const [textVisible, setTextVisible] = useState(false)
  const [shredActive, setShredActive] = useState(false)
  const [particlesActive, setParticlesActive] = useState(false)
  const [showGone, setShowGone] = useState(false)
  const [showNothing, setShowNothing] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [textBox, setTextBox] = useState({ width: 0, height: 0 })

  const strips = useMemo<Strip[]>(
    () =>
      Array.from({ length: stripCount }, (_, index) => {
        const direction = index % 2 === 0 ? -1 : 1

        return {
          id: index,
          offsetX: direction * randomBetween(24, 56),
          offsetY: randomBetween(-16, 16),
          skew: direction * randomBetween(3, 6),
          delay: index * 120,
          duration: randomBetween(850, 1200),
        }
      }),
    [stripCount]
  )

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 72 }, (_, index) => {
        const angle = randomBetween(0, Math.PI * 2)
        const distance = randomBetween(38, 168)

        return {
          id: index,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          size: randomBetween(2, 4),
          delay: randomBetween(0, 180),
          duration: randomBetween(900, 1250),
          rotate: randomBetween(-120, 120),
          scale: randomBetween(0.35, 0.85),
          borderRadius: Math.random() > 0.55 ? "999px" : "1px",
        }
      }),
    []
  )

  const scheduleTimeout = (callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(callback, delay)
    timeoutsRef.current.push(timeoutId)
  }

  const scheduleFrame = (callback: () => void) => {
    const frameId = window.requestAnimationFrame(callback)
    rafsRef.current.push(frameId)
  }

  const complete = () => {
    if (isDoneRef.current) {
      return
    }

    isDoneRef.current = true
    onComplete()
  }

  useEffect(() => {
    scheduleFrame(() => setTextVisible(true))

    scheduleTimeout(() => setPhase("shred"), 1500)
    scheduleTimeout(() => setPhase("particles"), 3500)
    scheduleTimeout(() => setPhase("confirm"), 5000)

    return () => {
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      rafsRef.current.forEach((frameId) => window.cancelAnimationFrame(frameId))
    }
  }, [])

  useEffect(() => {
    const node = measureRef.current

    if (!node) {
      return
    }

    const updateSize = () => {
      setTextBox({
        width: node.offsetWidth,
        height: node.offsetHeight,
      })
    }

    updateSize()

    const observer = new ResizeObserver(updateSize)
    observer.observe(node)

    return () => observer.disconnect()
  }, [displayText])

  useEffect(() => {
    if (phase !== "shred") {
      return
    }

    setShredActive(false)
    scheduleFrame(() => setShredActive(true))
  }, [phase])

  useEffect(() => {
    if (phase !== "particles") {
      return
    }

    setParticlesActive(false)
    scheduleFrame(() => setParticlesActive(true))
  }, [phase])

  useEffect(() => {
    if (phase !== "confirm") {
      return
    }

    setShowGone(true)
    scheduleTimeout(() => setShowNothing(true), 400)
    scheduleTimeout(() => setShowClose(true), 1500)
    scheduleTimeout(() => complete(), 3000)
  }, [phase])

  const stripHeight = textBox.height > 0 ? textBox.height / stripCount : 0

  return (
    <div
      className="fixed inset-0 z-[80] overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(10, 10, 10, 0.72) 0%, rgba(10, 10, 10, 0.84) 100%)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 44%, rgba(201, 168, 76, 0.1) 0%, rgba(201, 168, 76, 0) 42%)",
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="relative flex min-h-screen w-full items-center justify-center">
          <p
            ref={measureRef}
            aria-hidden="true"
            className="pointer-events-none invisible absolute m-0 whitespace-pre-wrap text-center font-sentient text-[16px] leading-7 text-white"
            style={{
              width: "min(520px, calc(100vw - 3rem))",
            }}
          >
            {displayText}
          </p>

          {phase === "display" && (
            <p
              className="m-0 whitespace-pre-wrap text-center font-sentient text-[16px] leading-7 text-white transition-opacity duration-[600ms]"
              style={{
                opacity: textVisible ? 1 : 0,
                width: "min(520px, calc(100vw - 3rem))",
              }}
            >
              {displayText}
            </p>
          )}

          {phase !== "display" && textBox.width > 0 && textBox.height > 0 && (
            <div
              className="pointer-events-none absolute left-1/2 top-1/2"
              style={{
                width: textBox.width,
                height: textBox.height,
                transform: "translate(-50%, -50%)",
              }}
            >
              {strips.map((strip, index) => {
                const top = stripHeight * index
                const stripIsActive = phase === "shred" || phase === "particles" || phase === "confirm"

                return (
                  <div
                    key={strip.id}
                    className="absolute left-0 overflow-hidden"
                    style={{
                      top,
                      height: stripHeight,
                      width: "100%",
                    }}
                  >
                    <p
                      className="absolute left-0 m-0 whitespace-pre-wrap text-center font-sentient text-[16px] leading-7"
                      style={{
                        top: -top,
                        width: textBox.width,
                        color: stripIsActive && shredActive ? GOLD : "#FFFFFF",
                        opacity: stripIsActive && shredActive ? 0 : 1,
                        transform: stripIsActive && shredActive
                          ? `translate3d(${strip.offsetX}px, ${strip.offsetY}px, 0) skewX(${strip.skew}deg)`
                          : "translate3d(0, 0, 0) skewX(0deg)",
                        transformOrigin: strip.offsetX < 0 ? "left center" : "right center",
                        transition: `transform ${strip.duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${strip.delay}ms, opacity ${Math.max(
                          strip.duration - 120,
                          520
                        )}ms ease ${strip.delay}ms, color 220ms ease ${strip.delay}ms`,
                      }}
                    >
                      {displayText}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {phase === "particles" && (
            <div className="pointer-events-none absolute inset-0">
              {particles.map((particle) => (
                <span
                  key={particle.id}
                  className="absolute left-1/2 top-1/2 block"
                  style={{
                    width: particle.size,
                    height: particle.size,
                    marginLeft: particle.size / -2,
                    marginTop: particle.size / -2,
                    borderRadius: particle.borderRadius,
                    backgroundColor: GOLD,
                    opacity: particlesActive ? 0 : 0.95,
                    transform: particlesActive
                      ? `translate3d(${particle.x}px, ${particle.y}px, 0) rotate(${particle.rotate}deg) scale(${particle.scale})`
                      : "translate3d(0, 0, 0) rotate(0deg) scale(1)",
                    transition: `transform ${particle.duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${particle.delay}ms, opacity ${particle.duration}ms ease ${particle.delay}ms`,
                    boxShadow: "0 0 10px rgba(201, 168, 76, 0.22)",
                  }}
                />
              ))}
            </div>
          )}

          {phase === "confirm" && (
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
              <p
                className="m-0 font-mono text-[13px] tracking-[0.22em] transition-opacity duration-700"
                style={{
                  color: GOLD,
                  opacity: showGone ? 0.82 : 0,
                }}
              >
                gone.
              </p>

              <p
                className="mt-3 m-0 font-mono text-[10px] tracking-[0.18em] transition-opacity duration-700"
                style={{
                  color: MUTED,
                  opacity: showNothing ? 1 : 0,
                }}
              >
                nothing was kept.
              </p>

              <button
                type="button"
                onClick={complete}
                className="mt-10 font-mono text-[11px] tracking-[0.24em] transition-opacity duration-500 hover:opacity-100 focus:outline-none"
                style={{
                  color: GOLD,
                  opacity: showClose ? 0.88 : 0,
                  pointerEvents: showClose ? "auto" : "none",
                  textDecoration: "underline",
                  textUnderlineOffset: "8px",
                  textDecorationThickness: "0.5px",
                }}
              >
                [ close ]
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
