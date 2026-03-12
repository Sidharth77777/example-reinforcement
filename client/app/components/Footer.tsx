import { Check } from "lucide-react"
import Link from "next/link"

export default function Footer() {

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/features" },
    { name: "Dashboard", href: "/dashboard" },
  ]

  const supportLinks = [
    { name: "Help Center", href: "#" },
    { name: "Documentation", href: "#" },
    { name: "Privacy Policy", href: "#" },
  ]

  const contactLinks = [
    { name: "Contact Us", href: "/contact" },
    { name: "saafproject80@gmail.com", href: "#" },
  ]

  return (
    <footer className="w-full bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#2c5364] text-gray-200">

      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">

        {/* LOGO */}
        <div className="flex items-start gap-2">

          <div className="bg-green-600 text-white p-1.5 rounded-full">
            <Check size={18} />
          </div>

          <h1 className="text-green-400 font-bold text-xl tracking-wide">
            SAAF
          </h1>

        </div>

        {/* QUICK LINKS */}
        <div>
          <h3 className="font-semibold mb-4 text-white">
            Quick Links
          </h3>

          <div className="flex flex-col gap-2 text-sm">
            {quickLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="hover:text-green-400 transition"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* SUPPORT */}
        <div>
          <h3 className="font-semibold mb-4 text-white">
            Support
          </h3>

          <div className="flex flex-col gap-2 text-sm">
            {supportLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="hover:text-green-400 transition"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* CONTACT */}
        <div>
          <h3 className="font-semibold mb-4 text-white">
            Contact
          </h3>

          <div className="flex flex-col gap-2 text-sm">
            {contactLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="hover:text-green-400 transition"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* BOTTOM COPYRIGHT */}
      <div className="border-t border-white/10 py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} SAAF Technologies. All rights reserved.
      </div>

    </footer>
  )
}