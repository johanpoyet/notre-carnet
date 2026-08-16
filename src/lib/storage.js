import { supabase } from "./supabaseClient";

const TABLE = "couple_data";

export async function getShared(key, fallback = null) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error || !data) return fallback;
  return data.value;
}

export async function setShared(key, value) {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) console.error(`Erreur de sauvegarde (${key}) :`, error.message);
  return !error;
}

export async function deleteShared(key) {
  const { error } = await supabase.from(TABLE).delete().eq("key", key);
  return !error;
}

export function subscribeShared(onChange) {
  const channel = supabase
    .channel("couple_data_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE },
      (payload) => onChange(payload)
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export function getLocal(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

export function setLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}
