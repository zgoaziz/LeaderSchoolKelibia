import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { fr } from "@/dictionaries";
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

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leader School Kélibia — Centre de formation professionnelle",
  description: "Formations en langues, informatique et cuisine à Kélibia, Tunisie.",
  alternates: { languages: { fr: "/fr", ar: "/ar" } },
};

async function fetchPublicData() {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const [formationsRes, galleryRes, testimonialsRes] = await Promise.all([
      db
        .from("formations")
        .select("id, title, category, description, color_class, formation_items(id, name, name_ar, position)")
        .eq("published", true)
        .order("position"),
      db
        .from("gallery_items")
        .select("id, title, subtitle, image_url")
        .eq("published", true)
        .order("position"),
      db
        .from("testimonials")
        .select("id, content, author_name, author_role, rating")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    const formations: DynamicFormation[] = (formationsRes.data ?? []).map((f: any) => ({
      id: f.id,
      title: f.title,
      title_ar: f.title_ar || f.title || null,
      category: f.category,
      description: f.description,
      description_ar: f.description_ar || f.description || null,
      color_class: f.color_class,
      formation_items: ((f.formation_items as { id: string; name: string | null; name_ar: string | null; position: number }[]) ?? []).map((item) => ({
        id: item.id,
        name: item.name ?? item.name_ar ?? "",
        name_ar: item.name_ar ?? null,
        position: item.position,
      })),
    }));

    return {
      formations,
      gallery: (galleryRes.data ?? []) as DynamicGalleryItem[],
      testimonials: (testimonialsRes.data ?? []) as DynamicTestimonial[],
    };
  } catch {
    return { formations: [], gallery: [], testimonials: [] };
  }
}

export default async function FrPage() {
  const { formations, gallery, testimonials } = await fetchPublicData();

  return (
    <div
      className="min-h-screen bg-white overflow-x-hidden"
      style={{ fontFamily: "'Poppins', 'Inter', system-ui, -apple-system, sans-serif" }}
    >
      <Navbar dict={fr} />
      <main>
        <Hero dict={fr} />
        <About dict={fr} />
        <Formations dict={fr} dynamicFormations={formations} />
        <Advantages dict={fr} />
        <Gallery dict={fr} dynamicGallery={gallery} />
        <Testimonials dict={fr} dynamicTestimonials={testimonials} />
        <Process dict={fr} />
        <Contact dict={fr} />
        <CtaFinal dict={fr} />
      </main>
      <Footer dict={fr} />
    </div>
  );
}
