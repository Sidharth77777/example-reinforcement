"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Header() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/features" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ]

  /* Prevent body scroll when sidebar open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
  }, [open])

  /* Close sidebar on ESC key */
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }

    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [])

  return (
    <>
      <header className="w-full border-b bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="bg-green-600 text-white p-1.5 rounded-full">
              <Check size={18} />
            </div>
            <h1 className="text-green-600 font-bold text-xl tracking-wide">
              SAAF
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-gray-700 font-medium">
            {navLinks.map((link) => {
              const isActive = pathname === link.href

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative pb-1 transition-all duration-200 ${
                    isActive ? "text-green-600" : "hover:text-green-600"
                  }`}
                >
                  {link.name}

                  <span
                    className={`absolute left-0 -bottom-1 h-[2px] bg-green-600 transition-all duration-300 ${
                      isActive ? "w-full" : "w-0"
                    }`}
                  />
                </Link>
              )
            })}
          </nav>

          {/* Admin Button Desktop */}
          <div className="hidden md:block">
            <Button className="text-lg cursor-pointer text-black border border-[#e7d8d8] bg-white hover:scale-[1.02] transition">
              Admin Panel
            </Button>
          </div>

          {/* Mobile Hamburger */}
          <button
            aria-label="Open menu"
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            onClick={() => setOpen(true)}
          >
            <Menu size={26} className="text-black" />
          </button>

        </div>
      </header>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-50 flex transition-all duration-300 ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >

        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />

        {/* Sidebar */}
        <div
          className={`relative w-64 bg-white h-full shadow-lg p-6 flex flex-col gap-6 transform transition-transform duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >

          {/* Sidebar Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-green-600 font-bold text-lg">Menu</h2>

            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <X />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`text-lg px-2 py-2 rounded-lg transition ${
                    isActive
                      ? "text-green-600 font-semibold bg-gray-50"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </div>

          {/* Admin Button */}
          <Button className="mt-4 text-xl text-black border border-[#e7d8d8] bg-white hover:scale-[1.02] transition">
            Admin Panel
          </Button>

        </div>
      </div>
    </>
  )
}