"use client";
import { motion } from "framer-motion";
import { ClipboardList, CreditCard, BookOpen, GraduationCap } from "lucide-react";
import type { Dictionary } from "@/dictionaries";

const ICONS = [ClipboardList, CreditCard, BookOpen, GraduationCap];

export function Process({ dict }: { dict: Dictionary }) {
  const d = dict.process;
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[#FF3B7F] font-semibold text-sm tracking-wide uppercase">{d.tag}</span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1B3B6F]">{d.title}</h2>
        </div>

        <div className="mt-16 relative">
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 border-t-2 border-dashed border-[#1B3B6F]/20" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative">
            {d.steps.map((s, i) => {
              const Icon = ICONS[i];
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.12 }}
                  className="text-center"
                >
                  <div className="relative mx-auto w-24 h-24 rounded-full bg-white border-2 border-[#1B3B6F]/10 flex items-center justify-center shadow-md">
                    <Icon className="w-10 h-10 text-[#1B3B6F]" />
                    <span className="absolute -top-2 -right-2 w-9 h-9 rounded-full rose-gradient text-white font-bold flex items-center justify-center text-sm shadow-lg">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-[#1B3B6F]">{s.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed max-w-[16rem] mx-auto">{s.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
