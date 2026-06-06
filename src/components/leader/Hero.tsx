"use client";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import type { Dictionary } from "@/dictionaries";

export function Hero({ dict }: { dict: Dictionary }) {
  const d = dict.hero;
  const isRtl = dict.dir === "rtl";
  return (
    <section
      id="accueil"
      className="relative hero-gradient text-white overflow-hidden pt-24 md:pt-28"
    >
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-[#FF3B7F]/20 blur-3xl animate-float-slow" />
      <div className="absolute top-1/3 -right-32 w-md h-112 rounded-full bg-[#00C9A7]/20 blur-3xl animate-float-slow" />
      <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-white/5 blur-2xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: isRtl ? 30 : -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative order-2 lg:order-1"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-4/5 max-w-md mx-auto">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&auto=format&fit=crop"
              alt={d.badge}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-linear-to-t from-[#1B3B6F]/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-2xl p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full rose-gradient flex items-center justify-center text-white shrink-0">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <div className="text-[#1B3B6F]">
                <div className="text-xs text-gray-500">{d.virtualSub}</div>
                <div className="text-sm font-semibold">{d.virtualLabel}</div>
              </div>
            </div>
          </div>
          <div className="absolute -top-4 -right-2 bg-white rounded-2xl shadow-xl px-4 py-3 hidden sm:flex items-center gap-2 text-[#1B3B6F]">
            <Sparkles className="w-5 h-5 text-[#FF3B7F]" />
            <div className="text-xs">
              <div className="font-bold">{d.badgeStudents}</div>
              <div className="text-gray-500">{d.badgeSub}</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="order-1 lg:order-2"
        >
          <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
            {d.badge}
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
            {d.title1}{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-[#FF3B7F]">{d.titleHighlight}</span>
              <span className="absolute -bottom-1 left-0 right-0 h-3 bg-[#FF3B7F]/20 rounded-full z-0" />
            </span>{" "}
            {d.title2}
          </h1>
          <p className="mt-6 text-base sm:text-lg text-white/80 max-w-xl leading-relaxed">
            {d.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#inscription"
              className="group inline-flex items-center gap-2 bg-white text-[#1B3B6F] font-semibold px-6 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              {d.cta1}
              <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${isRtl ? "rotate-180" : ""}`} />
            </a>
            <a
              href="#formations"
              className="inline-flex items-center gap-2 border-2 border-white/40 text-white font-semibold px-6 py-3.5 rounded-full hover:bg-white/10 transition-colors"
            >
              {d.cta2}
            </a>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            {d.stats.map((s) => (
              <div key={s.l} className={`${isRtl ? "border-r-2 pr-3" : "border-l-2 pl-3"} border-white/20`}>
                <div className="text-2xl sm:text-3xl font-extrabold">{s.v}</div>
                <div className="text-[11px] sm:text-xs text-white/70 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
