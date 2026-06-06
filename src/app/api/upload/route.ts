import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
  const API_KEY    = process.env.CLOUDINARY_API_KEY!;
  const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

  const formData = await req.formData();
  const file   = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "gallery";
  if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto.createHash("sha1").update(paramsToSign + API_SECRET).digest("hex");

  const uploadForm = new FormData();
  uploadForm.append("file", file);
  uploadForm.append("api_key", API_KEY);
  uploadForm.append("timestamp", String(timestamp));
  uploadForm.append("signature", signature);
  uploadForm.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: uploadForm });
  const result = await res.json();
  if (!res.ok || result.error) return NextResponse.json({ error: result.error?.message ?? "Upload échoué" }, { status: 500 });
  return NextResponse.json({ url: result.secure_url as string });
}
