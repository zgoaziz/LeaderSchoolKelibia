"use client";
import { motion } from "framer-motion";
import { Globe2, Laptop, ChefHat, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { Dictionary } from "@/dictionaries";

const ICONS = [Globe2, Laptop, ChefHat];
const CAT_ICONS: Record<string, typeof Globe2> = { langues: Globe2, informatique: Laptop, cuisine: ChefHat };
const GRADIENTS = ["deep-gradient", "teal-gradient", "rose-gradient"];
const CAT_GRADIENTS: Record<string, string> = { langues: "deep-gradient", informatique: "teal-gradient", cuisine: "rose-gradient" };
const ACCENTS = ["#FF3B7F", "#00C9A7", "#FF3B7F"];
const CAT_ACCENTS: Record<string, string> = { langues: "#FF3B7F", informatique: "#00C9A7", cuisine: "#FF3B7F" };

export type DynamicFormation = {
  id: string;
  title: string;
  title_ar?: string | null;
  category: "langues" | "informatique" | "cuisine";
  description: string | null;
  description_ar?: string | null;
  color_class: string;
  formation_items: { id: string; name: string; name_ar?: string | null; position: number }[];
};

export function Formations({
  dict,
  dynamicFormations,
  basePath = "/fr/formations",
}: {
  dict: Dictionary;
  dynamicFormations?: DynamicFormation[];
  basePath?: string;
}) {
  const d = dict.formations;
  const safeDynamic: DynamicFormation[] = Array.isArray(dynamicFormations) ? dynamicFormations : [];
  const useDynamic = safeDynamic.length > 0;

  return (
    <section id="formations" className="py-20 md:py-28 bg-[#F5F7FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          <span className="text-[#FF3B7F] font-semibold text-sm tracking-wide uppercase">{d.tag}</span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1B3B6F]">{d.title}</h2>
          <p className="mt-4 text-gray-600">{d.subtitle}</p>
        </motion.div>

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useDynamic
            ? (() => {
                try {
                  return safeDynamic.map((f, i) => {
                const Icon = CAT_ICONS[f.category] ?? Globe2;
                const gradient = f.color_class || CAT_GRADIENTS[f.category] || GRADIENTS[i % 3];
                const accent = CAT_ACCENTS[f.category] ?? ACCENTS[i % 3];
                    const items = (f.formation_items ?? [])
                      .slice()
                      .sort((a, b) => a.position - b.position)
                      .map((it) => it.name ?? "");
                return (
                  <motion.article
                    key={f.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                    className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all"
                  >
                    <div className={`${gradient} p-7 text-white relative overflow-hidden`}>
                      <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
                      <div className="relative w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-4">
                        <Icon className="w-7 h-7" />
                      </div>
                      <h3 className="relative text-2xl font-bold">{f.title}</h3>
                    </div>
                      <div className="p-7">
                      {f.description && <p className="text-gray-600 text-sm leading-relaxed">{f.description}</p>}
                      <ul className="mt-5 space-y-2.5">
                        {items.map((it) => (
                          <li key={it} className="flex items-center gap-2.5 text-sm text-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />
                            {it}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={`${basePath}/${f.id}`}
                        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B3B6F] group/link"
                      >
                        {d.cta}
                        <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                      </Link>
                    </div>
                  </motion.article>
                );
                  });
                } catch (e) {
                  // Fallback: render nothing dynamic to avoid breaking hydration
                  console.error("Formations: error rendering dynamic formations", e);
                  return null;
                }
              })()
            : d.list.map((f, i) => {
                const Icon = ICONS[i];
                return (
                  <motion.article
                    key={f.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                    className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all"
                  >
                    <div className={`${GRADIENTS[i]} p-7 text-white relative overflow-hidden`}>
                      <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
                      <div className="relative w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-4">
                        <Icon className="w-7 h-7" />
                      </div>
                      <h3 className="relative text-2xl font-bold">{f.title}</h3>
                    </div>
                    <div className="p-7">
                      <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
                      <ul className="mt-5 space-y-2.5">
                        {f.items.map((it) => (
                          <li key={it} className="flex items-center gap-2.5 text-sm text-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ACCENTS[i] }} />
                            {it}
                          </li>
                        ))}
                      </ul>
                      <a
                        href="#inscription"
                        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B3B6F] group/link"
                      >
                        {d.cta}
                        <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                      </a>
                    </div>
                  </motion.article>
                );
              })}
        </div>
      </div>
    </section>
  );
}
