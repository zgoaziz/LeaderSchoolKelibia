import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { createClient } from "@supabase/supabase-js";
import { ar } from "@/dictionaries";
import { Navbar } from "@/components/leader/Navbar";
import { Hero } from "@/components/leader/Hero";
import { About } from "@/components/leader/About";
import { Formations } from "@/components/leader/Formations";
import { Advantages } from "@/components/leader/Advantages";
import { Gallery } from "@/components/leader/Gallery";
import { Testimonials } from "@/components/leader/Testimonials";
import { Process } from "@/components/leader/Process";
import { Contact } from "@/components/leader/Contact";
import { CtaFinal, Footer } from "@/components/leader/CtaFooter";
import type { DynamicFormation } from "@/components/leader/Formations";
import type { DynamicGalleryItem } from "@/components/leader/Gallery";
import type { DynamicTestimonial } from "@/components/leader/Testimonials";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ليدر سكول قليبية — مركز التكوين المهني",
  description: "تكوين في اللغات والمعلوميات والطبخ في قليبية، تونس.",
  alternates: { languages: { fr: "/fr", ar: "/ar" } },
};

async function fetchPublicDataAr(): Promise<{
  formations: DynamicFormation[];
  gallery: DynamicGalleryItem[];
  testimonials: DynamicTestimonial[];
}> {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const [formationsRes, galleryRes, testimonialsRes] = await Promise.all([
      db
        .from("formations")
        .select("id, title, title_ar, category, description, description_ar, color_class, formation_items(id, name, name_ar, position)")
        .eq("published", true)
        .order("position"),
      db
        .from("gallery_items")
        .select("id, title, title_ar, subtitle, subtitle_ar, image_url")
        .eq("published", true)
        .order("position"),
      db
        .from("testimonials")
        .select("id, content, author_name, author_role, rating")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    // Map Arabic fields: use AR value if present, fall back to French
    const formations: DynamicFormation[] = (formationsRes.data ?? []).map((f) => ({
      id: f.id,
      title: f.title_ar || f.title,
      category: f.category,
      description: f.description_ar || f.description,
      color_class: f.color_class,
      formation_items: ((f.formation_items as { id: string; name: string | null; name_ar: string | null; position: number }[]) ?? []).map((item) => ({
        id: item.id,
        name: item.name_ar ?? item.name ?? "",
        name_ar: item.name_ar ?? null,
        position: item.position,
      })),
    }));

    const gallery: DynamicGalleryItem[] = (galleryRes.data ?? []).map((g) => ({
      id: g.id,
      title: g.title_ar || g.title,
      subtitle: g.subtitle_ar || g.subtitle,
      image_url: g.image_url,
    }));

    return {
      formations,
      gallery,
      testimonials: (testimonialsRes.data ?? []) as DynamicTestimonial[],
    };
  } catch {
    return { formations: [], gallery: [], testimonials: [] };
  }
}

export default async function ArPage() {
  const { formations, gallery, testimonials } = await fetchPublicDataAr();

  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen bg-white overflow-x-hidden"
      style={{ fontFamily: `${cairo.style.fontFamily}, system-ui, sans-serif` }}
    >
      <Navbar dict={ar} />
      <main>
        <Hero dict={ar} />
        <About dict={ar} />
        <Formations
          dict={ar}
          dynamicFormations={formations}
          basePath="/ar/formations"
        />
        <Advantages dict={ar} />
        <Gallery dict={ar} dynamicGallery={gallery} />
        <Testimonials dict={ar} dynamicTestimonials={testimonials} />
        <Process dict={ar} />
        <Contact dict={ar} />
        <CtaFinal dict={ar} />
      </main>
      <Footer dict={ar} />
    </div>
  );
}
