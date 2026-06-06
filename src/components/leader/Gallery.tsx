"use client";
import { motion } from "framer-motion";
import type { Dictionary } from "@/dictionaries";

const STATIC_SRCS = [
  "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop",
];

export type DynamicGalleryItem = {
  id: string;
  title: string;
  title_ar?: string | null;
  subtitle: string | null;
  subtitle_ar?: string | null;
  image_url: string;
};

export function Gallery({
  dict,
  dynamicGallery,
}: {
  dict: Dictionary;
  dynamicGallery?: DynamicGalleryItem[];
}) {
  const d = dict.gallery;
  const useDynamic = dynamicGallery && dynamicGallery.length > 0;

  return (
    <section id="galerie" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[#FF3B7F] font-semibold text-sm tracking-wide uppercase">{d.tag}</span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1B3B6F]">{d.title}</h2>
          <p className="mt-4 text-gray-600">{d.subtitle}</p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {useDynamic
            ? dynamicGallery.map((item, i) => (
                <motion.figure
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: (i % 3) * 0.1 }}
                  className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-shadow"
                >
                  <div className="aspect-4/3 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 bg-linear-to-t from-[#1B3B6F]/85 via-[#1B3B6F]/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                  <figcaption className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <div className="text-lg font-bold">{item.title}</div>
                    {item.subtitle && <div className="text-sm text-white/80">{item.subtitle}</div>}
                  </figcaption>
                </motion.figure>
              ))
            : d.photos.map((p, i) => (
                <motion.figure
                  key={STATIC_SRCS[i]}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: (i % 3) * 0.1 }}
                  className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-shadow"
                >
                  <div className="aspect-4/3 overflow-hidden">
                    <img
                      src={STATIC_SRCS[i]}
                      alt={p.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 bg-linear-to-t from-[#1B3B6F]/85 via-[#1B3B6F]/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                  <figcaption className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <div className="text-lg font-bold">{p.title}</div>
                    <div className="text-sm text-white/80">{p.desc}</div>
                  </figcaption>
                </motion.figure>
              ))}
        </div>
      </div>
    </section>
  );
}
