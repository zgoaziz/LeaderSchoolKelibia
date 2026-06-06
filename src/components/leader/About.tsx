"use client";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import type { Dictionary } from "@/dictionaries";

export function About({ dict }: { dict: Dictionary }) {
  const d = dict.about;
  const isRtl = dict.dir === "rtl";
  return (
    <section id="apropos" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-block text-[#FF3B7F] font-semibold text-sm tracking-wide uppercase">
            {d.tag}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1B3B6F] leading-tight">
            {d.title}
          </h2>
          <p className="mt-5 text-gray-600 leading-relaxed">{d.p1}</p>
          <p className="mt-4 text-gray-600 leading-relaxed">{d.p2}</p>
          <a
            href="#contact"
            className="group mt-8 inline-flex items-center gap-2 bg-[#1B3B6F] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#112849] transition-colors"
          >
            {d.cta}
            <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${isRtl ? "rotate-180" : ""}`} />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="absolute -inset-4 deep-gradient rounded-3xl rotate-3 opacity-20" />
          <div className="relative deep-gradient rounded-3xl p-8 md:p-10 text-white shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF3B7F]/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#00C9A7]/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
            <h3 className="relative text-2xl md:text-3xl font-bold mb-3">{d.missionTitle}</h3>
            <p className="relative text-white/80 leading-relaxed">{d.missionText}</p>
            <ul className="relative mt-8 space-y-4">
              {d.advantages.map((a) => (
                <li key={a} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#00C9A7] flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </span>
                  <span className="font-medium">{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
