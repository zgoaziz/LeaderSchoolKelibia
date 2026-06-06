"use client";
import { useEffect, useState } from "react";

type FormationItem = { id: string; name: string; name_ar: string | null; position: number };
type Formation = {
  id: string;
  title: string;
  title_ar: string | null;
  category: "langues" | "informatique" | "cuisine";
  description: string | null;
  description_ar: string | null;
  image_url: string | null;
  color_class: string;
  position: number;
  published: boolean;
  created_at: string;
  formation_items: FormationItem[];
};

const CAT_LABELS: Record<string, string> = {
  langues: "Langues",
  informatique: "Informatique",
  cuisine: "Cuisine",
};
const CAT_COLORS: Record<string, string> = {
  langues: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  informatique: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  cuisine: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};
const inp =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-brand-400";

const emptyForm = () => ({
  title: "",
  title_ar: "",
  category: "langues" as "langues" | "informatique" | "cuisine",
  description: "",
  description_ar: "",
  image_url: "",
  color_class: "deep-gradient",
  position: 0,
  published: true,
  items: "",
  items_ar: "",
});

export default function FormationsManager() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Formation | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [langTab, setLangTab] = useState<"fr" | "ar">("fr");
  const [uploadingImage, setUploadingImage] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/formations")
      .then((r) => r.json())
      .then((d) => { setFormations(Array.isArray(d) ? d : []); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setLangTab("fr");
    setError("");
    setShowModal(true);
  };

  const openEdit = (f: Formation) => {
    setEditing(f);
    const sorted = f.formation_items.sort((a, b) => a.position - b.position);
    setForm({
      title: f.title,
      title_ar: f.title_ar ?? "",
      category: f.category,
      description: f.description ?? "",
      description_ar: f.description_ar ?? "",
      image_url: f.image_url ?? "",
      color_class: f.color_class,
      position: f.position,
      published: f.published,
      items: sorted.map((i) => i.name).join("\n"),
      items_ar: sorted.map((i) => i.name_ar ?? "").join("\n"),
    });
    setLangTab("fr");
    setError("");
    setShowModal(true);
  };

  const COLOR_TO_CATEGORY: Record<string, "langues" | "informatique" | "cuisine"> = {
    "deep-gradient": "langues",
    "teal-gradient": "informatique",
    "rose-gradient": "cuisine",
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const items = form.items.split("\n").map((s) => s.trim()).filter(Boolean);
    const items_ar = form.items_ar.split("\n").map((s) => s.trim());
    const body = {
      title: form.title,
      title_ar: form.title_ar || null,
      category: COLOR_TO_CATEGORY[form.color_class] ?? form.category,
      description: form.description || null,
      description_ar: form.description_ar || null,
      image_url: form.image_url || null,
      color_class: form.color_class,
      position: form.position,
      published: form.published,
      items,
      items_ar,
    };
    const url = editing ? `/api/formations/${editing.id}` : "/api/formations";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette formation ?")) return;
    await fetch(`/api/formations/${id}`, { method: "DELETE" });
    load();
  };

  const togglePublish = async (f: Formation) => {
    await fetch(`/api/formations/${f.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !f.published }) });
    load();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "formations");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploadingImage(false);
    if (res.ok && data.url) {
      setForm((prev) => ({ ...prev, image_url: data.url }));
    } else {
      setError(data.error || "Erreur lors de l'upload de l'image");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Formations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Gérez les formations affichées sur le site public (FR + AR)</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Nouvelle formation
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Formation</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">Catégorie</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">Modules</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {formations.map((f) => (
                <tr key={f.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 dark:text-white">{f.title}</p>
                    {f.title_ar && <p className="text-xs text-gray-400 mt-0.5" dir="rtl">{f.title_ar}</p>}
                    {f.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{f.description}</p>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CAT_COLORS[f.category]}`}>{CAT_LABELS[f.category]}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {f.formation_items.slice(0, 3).map((i) => (
                        <span key={i.id} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{i.name}</span>
                      ))}
                      {f.formation_items.length > 3 && <span className="text-xs text-gray-400">+{f.formation_items.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublish(f)} className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${f.published ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}>
                      {f.published ? "Publié" : "Masqué"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {formations.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">Aucune formation. Créez la première !</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white">
                {editing ? "Modifier la formation" : "Nouvelle formation"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {/* Lang tabs */}
            <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => setLangTab("fr")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${langTab === "fr" ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
              >
                🇫🇷 Français
              </button>
              <button
                type="button"
                onClick={() => setLangTab("ar")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${langTab === "ar" ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
              >
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
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description (FR)</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={`${inp} resize-none`} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Modules en français (un par ligne)</label>
                    <textarea value={form.items} onChange={(e) => setForm({ ...form, items: e.target.value })} rows={5} placeholder={"Français\nAnglais\nAllemand"} className={`${inp} resize-none font-mono`} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">العنوان بالعربية</label>
                    <input dir="rtl" value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} className={`${inp} text-right`} placeholder="مثال: اللغات الحية" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">الوصف بالعربية</label>
                    <textarea dir="rtl" value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} rows={2} className={`${inp} resize-none text-right`} placeholder="وصف قصير للتكوين..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">الوحدات بالعربية (واحدة في كل سطر — نفس ترتيب الفرنسية)</label>
                    <textarea dir="rtl" value={form.items_ar} onChange={(e) => setForm({ ...form, items_ar: e.target.value })} rows={5} placeholder={"الفرنسية\nالإنجليزية\nالألمانية"} className={`${inp} resize-none font-mono text-right`} />
                    {form.items && (
                      <p className="text-xs text-gray-400 mt-1">
                        Modules FR : {form.items.split("\n").filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Common fields (always visible) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Couleur de carte</label>
                <select value={form.color_class} onChange={(e) => setForm({ ...form, color_class: e.target.value })} className={inp}>
                  <option value="deep-gradient">Rose/Violet — Langues</option>
                  <option value="teal-gradient">Teal/Vert — Informatique</option>
                  <option value="rose-gradient">Rose/Orange — Cuisine</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Image (optionnel)</label>
                {form.image_url && (
                  <div className="relative mb-2 w-full h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img src={form.image_url} alt="aperçu" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image_url: "" })}
                      className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white text-sm leading-none hover:bg-red-600"
                    >×</button>
                  </div>
                )}
                <label className={`flex items-center gap-2 cursor-pointer ${inp} ${uploadingImage ? "opacity-50 pointer-events-none" : ""}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span className="text-gray-500 dark:text-gray-400">{uploadingImage ? "Envoi en cours…" : "Choisir une image"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Position</label>
                  <input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} className={inp} />
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="w-4 h-4 rounded" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Publier sur le site</span>
                  </label>
                </div>
              </div>
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
