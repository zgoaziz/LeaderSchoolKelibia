"use client";
import { motion } from "framer-motion";
import { Target, Briefcase, Award, Users } from "lucide-react";
import type { Dictionary } from "@/dictionaries";

const ICONS = [Target, Briefcase, Award, Users];

export function Advantages({ dict }: { dict: Dictionary }) {
  const d = dict.advantages;
  return (
    <section id="avantages" className="relative py-20 md:py-28 hero-gradient text-white overflow-hidden">
      <div className="absolute top-10 right-10 w-72 h-72 bg-[#FF3B7F]/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00C9A7]/15 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[#00C9A7] font-semibold text-sm tracking-wide uppercase">{d.tag}</span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold">{d.title}</h2>
          <p className="mt-4 text-white/75">{d.subtitle}</p>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {d.items.map((it, i) => {
            const Icon = ICONS[i];
            return (
              <motion.div
                key={it.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-7 hover:bg-white/15 hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-white text-[#1B3B6F] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold">{it.title}</h3>
                <p className="mt-2 text-sm text-white/75 leading-relaxed">{it.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
