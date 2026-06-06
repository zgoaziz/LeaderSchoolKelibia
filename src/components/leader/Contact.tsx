"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Send } from "lucide-react";
import type { Dictionary } from "@/dictionaries";

const CARD_ICONS = [MapPin, Phone, Mail];

export function Contact({ dict }: { dict: Dictionary }) {
  const d = dict.contact;
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    nom: "", prenom: "", tel: "", email: "", formation: "", niveau: "", message: "", consent: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consent) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.prenom,
          last_name: form.nom,
          email: form.email,
          tel: form.tel,
          formation_name: form.formation,
          niveau: form.niveau,
          notes: form.message,
        }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      setForm({ nom: "", prenom: "", tel: "", email: "", formation: "", niveau: "", message: "", consent: false });
      setTimeout(() => setSent(false), 6000);
    } catch {
      setErrorMsg("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const cards = [
    { label: d.cardLabels.address, value: d.address },
    { label: d.cardLabels.phone, value: d.phone },
    { label: d.cardLabels.email, value: d.email },
  ];

  return (
    <section id="contact" className="py-20 md:py-28 bg-[#F5F7FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[#FF3B7F] font-semibold text-sm tracking-wide uppercase">{d.tag}</span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1B3B6F]">{d.title}</h2>
          <p className="mt-4 text-gray-600">{d.subtitle}</p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {cards.map((c, i) => {
            const Icon = CARD_ICONS[i];
            return (
              <div key={c.label} className="bg-white rounded-2xl p-6 shadow-sm flex gap-4 items-start hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl deep-gradient flex items-center justify-center text-white shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-[#1B3B6F]">{c.label}</div>
                  <div className="text-sm text-gray-600 mt-1 wrap-break-word">{c.value}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-6">
          <div className="rounded-3xl overflow-hidden shadow-md min-h-[400px] bg-white">
            <iframe
              title={d.mapTitle}
              src="https://www.google.com/maps?q=Kelibia,+Tunisia&output=embed"
              loading="lazy"
              className="w-full h-full min-h-[400px] border-0"
            />
          </div>

          <motion.form
            id="inscription"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl p-6 sm:p-8 shadow-md space-y-4"
          >
            <h3 className="text-xl font-bold text-[#1B3B6F]">{d.formTitle}</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <input required maxLength={60} placeholder={d.placeholders.prenom} value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3B6F] focus:ring-2 focus:ring-[#1B3B6F]/10 outline-none transition" />
              <input required maxLength={60} placeholder={d.placeholders.nom} value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3B6F] focus:ring-2 focus:ring-[#1B3B6F]/10 outline-none transition" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input required type="tel" maxLength={20} placeholder={d.placeholders.tel} value={form.tel}
                onChange={(e) => setForm({ ...form, tel: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3B6F] focus:ring-2 focus:ring-[#1B3B6F]/10 outline-none transition" />
              <input required type="email" maxLength={120} placeholder={d.placeholders.email} value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3B6F] focus:ring-2 focus:ring-[#1B3B6F]/10 outline-none transition" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <select required value={form.formation}
                onChange={(e) => setForm({ ...form, formation: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3B6F] focus:ring-2 focus:ring-[#1B3B6F]/10 outline-none transition bg-white">
                <option value="">{d.placeholders.formation}</option>
                {d.formations.map((f) => <option key={f}>{f}</option>)}
              </select>
              <select required value={form.niveau}
                onChange={(e) => setForm({ ...form, niveau: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3B6F] focus:ring-2 focus:ring-[#1B3B6F]/10 outline-none transition bg-white">
                <option value="">{d.placeholders.niveau}</option>
                {d.levels.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <textarea rows={4} maxLength={600} placeholder={d.placeholders.message} value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3B6F] focus:ring-2 focus:ring-[#1B3B6F]/10 outline-none transition resize-none" />
            <label className="flex items-start gap-2.5 text-sm text-gray-600">
              <input required type="checkbox" checked={form.consent}
                onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                className="mt-0.5 accent-[#00C9A7]" />
              <span>{d.consent}</span>
            </label>
            <button type="submit" disabled={submitting}
              className="w-full teal-gradient text-white font-semibold py-3.5 rounded-full flex items-center justify-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Send className="w-4 h-4" />}
              {submitting ? "Envoi..." : d.submit}
            </button>
            {sent && <p className="text-sm text-[#00A98E] text-center font-medium">{d.success}</p>}
            {errorMsg && <p className="text-sm text-red-500 text-center">{errorMsg}</p>}
          </motion.form>
        </div>

        <div className="mt-12 text-center">
          <div className="text-sm font-semibold text-[#1B3B6F] uppercase tracking-wide">{d.social}</div>
          <div className="mt-4 flex justify-center gap-3">
            <a href="https://facebook.com/leader-school-kelibia" target="_blank" rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-11 h-11 rounded-full bg-white text-[#1877F2] flex items-center justify-center shadow-sm hover:scale-110 hover:shadow-md transition">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/></svg>
            </a>
            <a href="https://instagram.com/leader-school-kelibia" target="_blank" rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-11 h-11 rounded-full bg-white text-[#E1306C] flex items-center justify-center shadow-sm hover:scale-110 hover:shadow-md transition">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.71 3.71 0 0 1-1.38-.9 3.71 3.71 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 5.18A4.66 4.66 0 1 0 12 16.66 4.66 4.66 0 0 0 12 7.34zm0 7.69a3.03 3.03 0 1 1 0-6.06 3.03 3.03 0 0 1 0 6.06zm5.92-7.86a1.09 1.09 0 1 1-2.18 0 1.09 1.09 0 0 1 2.18 0z"/></svg>
            </a>
            <a href="https://tiktok.com/@leader-school-kelibia" target="_blank" rel="noopener noreferrer"
              aria-label="TikTok"
              className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-sm hover:scale-110 hover:shadow-md transition">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
