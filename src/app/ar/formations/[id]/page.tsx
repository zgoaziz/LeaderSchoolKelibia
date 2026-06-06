import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Cairo } from "next/font/google";
import { Globe2, Laptop, ChefHat, ArrowRight, CheckCircle } from "lucide-react";
import { Navbar } from "@/components/leader/Navbar";
import { Footer } from "@/components/leader/CtaFooter";
import { ar } from "@/dictionaries";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

type Params = Promise<{ id: string }>;

const CAT_ICONS: Record<string, typeof Globe2> = {
  langues: Globe2,
  informatique: Laptop,
  cuisine: ChefHat,
};
const CAT_GRADIENTS: Record<string, string> = {
  langues: "deep-gradient",
  informatique: "teal-gradient",
  cuisine: "rose-gradient",
};
const CAT_LABELS_AR: Record<string, string> = {
  langues: "اللغات الحية",
  informatique: "الإعلامية والتصميم",
  cuisine: "الطبخ والحلويات",
};

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data } = await db.from("formations").select("title, description").eq("id", id).single();
  if (!data) return { title: "تكوين — ليدر سكول" };
  return {
    title: `${data.title} — ليدر سكول قليبية`,
    description: data.description ?? undefined,
  };
}

export default async function ArFormationDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: formation } = await db
    .from("formations")
    .select("*, formation_items(id, name, position)")
    .eq("id", id)
    .eq("published", true)
    .single();

  if (!formation) notFound();

  const items = (formation.formation_items ?? []).sort(
    (a: { position: number }, b: { position: number }) => a.position - b.position,
  );
  const Icon = CAT_ICONS[formation.category] ?? Globe2;
  const gradient = formation.color_class || CAT_GRADIENTS[formation.category] || "deep-gradient";

  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen bg-[#F5F7FA]"
      style={{ fontFamily: `${cairo.style.fontFamily}, system-ui, sans-serif` }}
    >
      <Navbar dict={ar} />

      <main className="pt-20">
        {/* Hero banner */}
        <div className={`${gradient} py-20 px-4 text-white`}>
          <div className="max-w-4xl mx-auto">
            <Link
              href="/ar#formations"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              جميع التكوينات
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                <Icon className="w-8 h-8" />
              </div>
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                {CAT_LABELS_AR[formation.category] ?? formation.category}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold">{formation.title}</h1>
            {formation.description && (
              <p className="mt-4 text-lg text-white/85 max-w-2xl">{formation.description}</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Program */}
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold text-[#1B3B6F] mb-6">برنامج التكوين</h2>
              {items.length > 0 ? (
                <div className="space-y-3">
                  {items.map((item: { id: string; name: string }) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-white rounded-xl px-5 py-4 shadow-sm"
                    >
                      <CheckCircle className="w-5 h-5 text-[#FF3B7F] shrink-0" />
                      <span className="font-medium text-gray-800">{item.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">اتصل بنا للحصول على البرنامج التفصيلي.</p>
              )}
            </div>

            {/* CTA card */}
            <div>
              <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                <h3 className="font-bold text-[#1B3B6F] text-lg mb-2">هل أنت مهتم؟</h3>
                <p className="text-sm text-gray-500 mb-5">
                  سجّل الآن أو اتصل بنا لمزيد من المعلومات.
                </p>
                <a
                  href="/ar#inscription"
                  className="block w-full text-center py-3 rounded-xl deep-gradient text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  سجّل الآن
                </a>
                <a
                  href="/ar#contact"
                  className="block w-full text-center py-3 rounded-xl border-2 border-[#1B3B6F] text-[#1B3B6F] font-semibold mt-3 hover:bg-[#1B3B6F] hover:text-white transition-colors"
                >
                  اتصل بنا
                </a>
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-center">
                    ليدر سكول قليبية · تونس
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer dict={ar} />
    </div>
  );
}
