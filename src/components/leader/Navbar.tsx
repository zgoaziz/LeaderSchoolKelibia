"use client";
import { useState, useEffect } from "react";
import { Menu, X, Globe } from "lucide-react";
import Image from "next/image";
import type { Dictionary } from "@/dictionaries";

export function Navbar({ dict }: { dict: Dictionary }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 bg-white border-b transition-shadow ${
        scrolled ? "shadow-md border-gray-100" : "border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
        <a href="#accueil" className="flex items-center gap-3">
          <Image
            src="/logoleaderschool.png"
            alt="Leader School Kelibia"
            width={68}
            height={68}
            className="h-16 w-16 object-contain shrink-0"
            priority
          />
          <div className="leading-tight">
            <div className="font-extrabold text-[#1B3B6F] text-base md:text-lg tracking-tight">Leader School Kelibia</div>
          </div>
        </a>

        <nav className="hidden lg:flex items-center gap-7">
          {dict.navbar.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-gray-700 hover:text-[#1B3B6F] transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={dict.navbar.cta === "سجّل الآن" ? "#inscription" : "#inscription"}
            className="hidden sm:inline-flex teal-gradient text-white font-semibold text-sm px-5 py-2.5 rounded-full shadow-sm hover:shadow-lg hover:scale-105 transition-all"
          >
            {dict.navbar.cta}
          </a>
          <a
            href={dict.navbar.langHref}
            className="hidden sm:flex items-center gap-1.5 text-sm font-bold border-2 border-[#1B3B6F]/25 text-[#1B3B6F] px-3 py-1.5 rounded-full hover:bg-[#1B3B6F] hover:text-white hover:border-[#1B3B6F] transition-all"
          >
            <Globe className="w-3.5 h-3.5" />
            {dict.navbar.langLabel}
          </a>
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 text-[#1B3B6F]"
            aria-label="Menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <nav className="px-4 py-4 flex flex-col gap-1">
            {dict.navbar.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                {l.label}
              </a>
            ))}
            <div className="flex gap-2 mt-2">
              <a
                href="#inscription"
                onClick={() => setOpen(false)}
                className="flex-1 teal-gradient text-white font-semibold text-sm px-5 py-3 rounded-full text-center"
              >
                {dict.navbar.cta}
              </a>
              <a
                href={dict.navbar.langHref}
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 font-bold text-sm border-2 border-[#1B3B6F]/25 text-[#1B3B6F] px-4 py-3 rounded-full"
              >
                <Globe className="w-4 h-4" />
                {dict.navbar.langLabel}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
