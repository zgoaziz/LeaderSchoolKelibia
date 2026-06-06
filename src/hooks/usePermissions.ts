"use client";
import { useEffect, useState } from "react";

export type ModulePerm = {
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};
export type Permissions = Record<string, ModulePerm>;

// Module-level cache shared across all hook instances
let _cache: Permissions | null = null;
let _promise: Promise<Permissions> | null = null;

async function fetchPerms(): Promise<Permissions> {
  if (_cache) return _cache;
  if (!_promise) {
    _promise = fetch("/api/roles/me")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => { _cache = data; return data; })
      .catch(() => ({}));
  }
  return _promise;
}

export function clearPermissionsCache() {
  _cache = null;
  _promise = null;
}

export function usePermissions() {
  const [perms, setPerms] = useState<Permissions>(_cache ?? {});
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    fetchPerms().then((p) => { setPerms(p); setLoading(false); });
  }, []);

  // Resolution order:
  // 1. If not loading: use real perms (deny by default if module missing)
  // 2. If loading but cache exists (re-navigation): use cached value to avoid flash
  // 3. If loading and no cache (first page load): deny — prevents unauthorized items
  //    flashing briefly before permissions arrive
  const resolve = (mod: string, key: keyof ModulePerm): boolean => {
    if (!loading) return perms[mod]?.[key] ?? false;
    if (_cache)   return _cache[mod]?.[key] ?? false;
    return false;
  };

  const canView   = (mod: string) => resolve(mod, "can_view");
  const canCreate = (mod: string) => resolve(mod, "can_create");
  const canEdit   = (mod: string) => resolve(mod, "can_edit");
  const canDelete = (mod: string) => resolve(mod, "can_delete");

  return { perms, loading, canView, canCreate, canEdit, canDelete };
}
