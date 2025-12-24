"use client"

import { cn } from "@/lib/utils"
import * as Dialog from "@radix-ui/react-dialog"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs"

interface MobileMenuProps {
  className?: string
}

export const MobileMenu = ({ className }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { name: "About", href: "/about" },
    { name: "Listening Space", href: "/listening-space" },
    { name: "Your Mood Map", href: "/mood-map" },
    { name: "Showing Up", href: "/showing-up" },
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

            {/* Auth Section */}
            <div className="mt-12 pt-4 border-t border-foreground/10">
              <SignedOut>
                <div className="flex flex-col space-y-3">
                  <SignInButton mode="modal">
                    <button
                      onClick={handleLinkClick}
                      className="text-base font-mono uppercase transition-colors ease-out duration-150 hover:opacity-80 py-1 text-left"
                      style={{ color: "#FFC700" }}
                    >
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button
                      onClick={handleLinkClick}
                      className="text-sm font-mono uppercase text-foreground/60 transition-colors ease-out duration-150 hover:text-foreground/100 py-1 text-left"
                    >
                      Create Account
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center gap-4">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10"
                      }
                    }}
                  />
                  <span className="text-base font-mono text-foreground/60">My Account</span>
                </div>
              </SignedIn>
            </div>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
