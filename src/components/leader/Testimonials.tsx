"use client";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import type { Dictionary } from "@/dictionaries";

export type DynamicTestimonial = {
  id: string;
  content: string;
  author_name: string;
  author_role: string | null;
  rating: number;
};

export function Testimonials({
  dict,
  dynamicTestimonials,
}: {
  dict: Dictionary;
  dynamicTestimonials?: DynamicTestimonial[];
}) {
  const d = dict.testimonials;
  const useDynamic = dynamicTestimonials && dynamicTestimonials.length > 0;

  return (
    <section id="temoignages" className="py-20 md:py-28 bg-[#F5F7FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[#FF3B7F] font-semibold text-sm tracking-wide uppercase">{d.tag}</span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1B3B6F]">{d.title}</h2>
          <p className="mt-4 text-gray-600">{d.subtitle}</p>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {useDynamic
            ? dynamicTestimonials.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="relative bg-white rounded-3xl p-7 shadow-sm hover:shadow-xl transition-shadow"
                >
                  <Quote className="absolute top-5 right-5 w-10 h-10 text-[#1B3B6F]/10" />
                  <div className="flex gap-0.5 text-[#FF3B7F]">
                    {Array.from({ length: r.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-current" />
                    ))}
                    {Array.from({ length: 5 - r.rating }).map((_, j) => (
                      <Star key={`e${j}`} className="w-4 h-4 text-gray-200" />
                    ))}
                  </div>
                  <p className="mt-4 text-gray-700 leading-relaxed">&ldquo;{r.content}&rdquo;</p>
                  <div className="mt-6 flex items-center gap-3 pt-5 border-t border-gray-100">
                    <div className="w-11 h-11 rounded-full deep-gradient text-white flex items-center justify-center font-bold shrink-0">
                      {r.author_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-[#1B3B6F]">{r.author_name}</div>
                      {r.author_role && <div className="text-xs text-gray-500">{r.author_role}</div>}
                    </div>
                  </div>
                </motion.div>
              ))
            : d.reviews.map((r, i) => (
                <motion.div
                  key={r.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="relative bg-white rounded-3xl p-7 shadow-sm hover:shadow-xl transition-shadow"
                >
                  <Quote className="absolute top-5 right-5 w-10 h-10 text-[#1B3B6F]/10" />
                  <div className="flex gap-0.5 text-[#FF3B7F]">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 text-gray-700 leading-relaxed">&ldquo;{r.text}&rdquo;</p>
                  <div className="mt-6 flex items-center gap-3 pt-5 border-t border-gray-100">
                    <div className="w-11 h-11 rounded-full deep-gradient text-white flex items-center justify-center font-bold shrink-0">
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-[#1B3B6F]">{r.name}</div>
                      <div className="text-xs text-gray-500">{r.course}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
        </div>
      </div>
    </section>
  );
}
