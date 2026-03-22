"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navItems = [
    { name: "HOME", href: "/" },
    { name: "DASHBOARD", href: "/dashboard" },
    { name: "ABOUT", href: "/about" },
    { name: "SERVICES", href: "/services" },
    { name: "CONTACT", href: "/contact" }
  ];

  return (
    <>
      <header className="bg-black text-white border-b border-white/10 sticky top-0 z-50">

        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">

          {/* LEFT - Logo */}
          <div className="flex items-center gap-3">
            <Link href="/">
              <Image
                src="/images/logo-bg-removed.png"
                alt="Logo"
                width={80}
                height={80}
              />
            </Link>
          </div>

          {/* CENTER - Desktop Nav */}
          <nav className="hidden md:flex gap-8 text-sm tracking-widest [font-family:var(--font-imprima)]">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative transition-all duration-300 group ${
                    isActive ? "opacity-100" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {item.name}

                  {/* Underline — always visible when active, animates in on hover */}
                  <span
                    className={`absolute left-0 -bottom-1 h-[1px] bg-gradient-to-r from-[#6c6c6c] via-[#ffffff] to-[#000000] transition-all duration-300 ease-out ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* RIGHT */}
          <div className="flex items-center gap-4">

            <div className="hidden md:block">
              <button className="relative px-4 py-2 text-xs tracking-widest border border-white/20 rounded-md overflow-hidden group transition-all duration-300">
                <span onClick={() => router.push("/admin")} className="relative cursor-pointer z-10 [font-family:var(--font-imprima)]">
                  ADMIN PANEL
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-[#6c6c6c] via-[#ffffff] to-[#6c6c6c] opacity-0 group-hover:opacity-20 transition duration-300"></span>
              </button>
            </div>

            {/* Hamburger */}
            <button className="md:hidden" onClick={() => setOpen(true)}>
              <Menu />
            </button>
          </div>
        </div>
      </header>

      {/* SIDEBAR OVERLAY */}
      <div
        className={`fixed inset-0 z-50 transition ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        {/* Background blur */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />

        {/* Sidebar */}
        <div
          className={`absolute right-0 top-0 h-full w-[70%] max-w-[300px] bg-black border-l border-white/10 p-6 transform transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Close */}
          <div className="flex justify-end mb-6 text-white">
            <button onClick={() => setOpen(false)}>
              <X />
            </button>
          </div>

          {/* Links */}
          <nav className="flex flex-col gap-6 text-lg tracking-widest text-white [font-family:var(--font-imprima)]">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`relative w-fit transition ${
                    isActive ? "opacity-100" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute left-0 -bottom-1 w-full h-[1px] bg-gradient-to-r from-[#6c6c6c] via-[#ffffff] to-[#000000]" />
                  )}
                </Link>
              );
            })}

            <div className="pt-6 border-t border-white/10">
              <button
                onClick={() => router.push("/admin")}
                className="w-full py-3 text-sm tracking-widest border border-white/20 rounded-md hover:border-white/40 transition-all duration-300 [font-family:var(--font-imprima)]"
              >
                ADMIN PANEL
              </button>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}