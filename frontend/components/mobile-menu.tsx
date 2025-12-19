"use client"

import { cn } from "@/lib/utils"
import * as Dialog from "@radix-ui/react-dialog"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

interface MobileMenuProps {
  className?: string
}

export const MobileMenu = ({ className }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { name: "About", href: "#about" },
    { name: "Listening Space", href: "#listening-space" },
    { name: "Your Mood Map", href: "/mood-map" },
    { name: "Showing Up", href: "#showing-up" },
    { name: "Quiet Connections", href: "#quiet-connections" },
    { name: "Privacy & Control", href: "#privacy-control" },
  ]

  const handleLinkClick = () => {
    setIsOpen(false)
  }

  return (
    <Dialog.Root modal={false} open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          className={cn("group lg:hidden p-2 text-foreground transition-colors", className)}
          aria-label="Open menu"
        >
          <Menu className="group-[[data-state=open]]:hidden" size={24} />
          <X className="hidden group-[[data-state=open]]:block" size={24} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <div data-overlay="true" className="fixed z-30 inset-0 bg-black/50 backdrop-blur-sm" />

        <Dialog.Content
          onInteractOutside={(e) => {
            if (e.target instanceof HTMLElement && e.target.dataset.overlay !== "true") {
              e.preventDefault()
            }
          }}
          className="fixed top-0 left-0 w-full z-40 py-28 md:py-40"
        >
          <Dialog.Title className="sr-only">Menu</Dialog.Title>

          <nav className="flex flex-col space-y-4 container mx-auto">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className="text-base font-mono uppercase text-foreground/60 transition-colors ease-out duration-150 hover:text-foreground/100 py-1"
              >
                {item.name}
              </Link>
            ))}

            <div className="mt-12 pt-4">
              <Link
                href="/#sign-in"
                onClick={handleLinkClick}
                className="inline-block text-base font-mono uppercase text-[#D4AF37] transition-colors ease-out duration-150 hover:text-[#C5A028] py-1"
              >
                Sign In
              </Link>
            </div>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
