import { ArrowRight } from "lucide-react";
import Image from "next/image";
import type { Dictionary } from "@/dictionaries";

export function CtaFinal({ dict }: { dict: Dictionary }) {
  const d = dict.cta;
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 blue-soft-gradient" />
      <div className="absolute -top-10 left-1/4 w-72 h-72 bg-[#FF3B7F]/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 right-1/4 w-72 h-72 bg-[#00C9A7]/20 rounded-full blur-3xl" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">{d.title}</h2>
        <p className="mt-5 text-base sm:text-lg text-white/80 max-w-2xl mx-auto">{d.subtitle}</p>
        <a
          href="#inscription"
          className="group mt-8 inline-flex items-center gap-2 bg-white text-[#1B3B6F] font-semibold px-7 py-4 rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
        >
          {d.cta}
          <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${dict.dir === "rtl" ? "rotate-180" : ""}`} />
        </a>
      </div>
    </section>
  );
}

export function Footer({ dict }: { dict: Dictionary }) {
  const d = dict.footer;
  return (
    <footer className="bg-[#111827] text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Image
              src="/logoleaderschool.png"
              alt="Leader School Kelibia"
              width={140}
              height={44}
              className="h-11 w-auto object-contain brightness-0 invert"
            />
            <p className="mt-4 text-sm text-gray-400 leading-relaxed">{d.tagline}</p>
          </div>
          <div>
            <div className="text-sm font-semibold mb-4">{d.about}</div>
            <ul className="space-y-2 text-sm text-gray-400">
              {d.aboutLinks.map((l) => (
                <li key={l}><a href="#apropos" className="hover:text-white transition">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold mb-4">{d.formations}</div>
            <ul className="space-y-2 text-sm text-gray-400">
              {d.formationLinks.map((l) => (
                <li key={l}><a href="#formations" className="hover:text-white transition">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold mb-4">{d.contact}</div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>{dict.contact.address}</li>
              <li><a href={`tel:${dict.contact.phone.replace(/\s/g, "")}`} className="hover:text-white transition">{dict.contact.phone}</a></li>
              <li><a href={`mailto:${dict.contact.email}`} className="hover:text-white transition break-all">{dict.contact.email}</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/10 text-center text-xs text-gray-500">
          {d.copyright}
        </div>
      </div>
    </footer>
  );
}
