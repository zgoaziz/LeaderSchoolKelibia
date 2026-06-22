"use client";
import { useEffect, useRef, useState } from "react";

type GalleryItem = {
  id: string;
  title: string;
  title_ar: string | null;
  subtitle: string | null;
  subtitle_ar: string | null;
  image_url: string;
  category: string | null;
  position: number;
  published: boolean;
};

const inp =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-brand-400";

const emptyForm = () => ({
  title: "",
  title_ar: "",
  subtitle: "",
  subtitle_ar: "",
  image_url: "",
  category: "",
  position: 0,
  published: true,
});

export default function GalleryManager() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [langTab, setLangTab] = useState<"fr" | "ar">("fr");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/gallery")
      .then((r) => r.json())
      .then((d) => { setItems(Array.isArray(d) ? d : []); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setLangTab("fr");
    setError("");
    setShowModal(true);
  };

  const openEdit = (item: GalleryItem) => {
    setEditing(item);
    setForm({
      title: item.title,
      title_ar: item.title_ar ?? "",
      subtitle: item.subtitle ?? "",
      subtitle_ar: item.subtitle_ar ?? "",
      image_url: item.image_url,
      category: item.category ?? "",
      position: item.position,
      published: item.published,
    });
    setLangTab("fr");
    setError("");
    setShowModal(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "gallery");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) setForm((f) => ({ ...f, image_url: data.url }));
    else setError(data.error ?? "Erreur d'upload");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = {
      ...form,
      title_ar: form.title_ar || null,
      subtitle: form.subtitle || null,
      subtitle_ar: form.subtitle_ar || null,
      category: form.category || null,
    };
    const url = editing ? `/api/gallery/${editing.id}` : "/api/gallery";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette photo ?")) return;
    await fetch(`/api/gallery/${id}`, { method: "DELETE" });
    load();
  };

  const togglePublish = async (item: GalleryItem) => {
    await fetch(`/api/gallery/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !item.published }) });
    load();
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start gap-3 justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Galerie</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Photos affichées sur le site public (FR + AR)</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Ajouter une photo
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 dark:text-white text-sm truncate">{item.title}</p>
                    {item.title_ar && <p className="text-xs text-gray-400 truncate" dir="rtl">{item.title_ar}</p>}
                    {item.subtitle && <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>}
                    {item.category && (
                      <span className="mt-1 inline-block text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">{item.category}</span>
                    )}
                  </div>
                  <button onClick={() => togglePublish(item)} className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full ${item.published ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}>
                    {item.published ? "Publié" : "Masqué"}
                  </button>
                </div>
                <div className="flex gap-1 mt-2 justify-end">
                  <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-3 text-center py-20 text-gray-400 text-sm">Aucune photo. Ajoutez la première !</div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white">
                {editing ? "Modifier la photo" : "Ajouter une photo"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {/* Lang tabs */}
            <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
              <button type="button" onClick={() => setLangTab("fr")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${langTab === "fr" ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                🇫🇷 Français
              </button>
              <button type="button" onClick={() => setLangTab("ar")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${langTab === "ar" ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                🇹🇳 عربي
              </button>
            </div>

            {error && <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</div>}

            <form onSubmit={handleSave} className="space-y-3">
              {langTab === "fr" ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Titre (FR) *</label>
                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inp} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Sous-titre (FR)</label>
                    <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className={inp} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">العنوان بالعربية</label>
                    <input dir="rtl" value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} className={`${inp} text-right`} placeholder="مثال: دروس اللغات" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">العنوان الفرعي بالعربية</label>
                    <input dir="rtl" value={form.subtitle_ar} onChange={(e) => setForm({ ...form, subtitle_ar: e.target.value })} className={`${inp} text-right`} placeholder="وصف قصير..." />
                  </div>
                </>
              )}

              {/* Image — always visible */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Image *</label>
                <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://... ou télécharger ci-dessous" className={inp} required />
                <div className="mt-2 flex items-center gap-2">
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60">
                    {uploading ? "Envoi en cours..." : "Télécharger une image"}
                  </button>
                  {form.image_url && <span className="text-xs text-green-600 dark:text-green-400">✓ Prête</span>}
                </div>
                {form.image_url && <img src={form.image_url} alt="preview" className="mt-2 h-28 w-full object-cover rounded-lg" />}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Catégorie</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: langues, cuisine, evenement..." className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Position</label>
                <input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} className={inp} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Publier sur le site</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60">{saving ? "Enregistrement..." : "Enregistrer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
