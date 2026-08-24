import { supabase } from "@/integrations/supabase/client";

export async function listCheckpoints() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return { checkpoints: [] };

  const { data, error } = await supabase
    .from("checkpoints")
    .select("id, place_id, name, address, lat, lng, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return { checkpoints: data ?? [] };
}

export async function addCheckpoint({
  data,
}: {
  data: {
    placeId?: string | null;
    name: string;
    address?: string | null;
    lat: number;
    lng: number;
  };
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Unauthorized");

  if (data.placeId) {
    const { data: existing } = await supabase
      .from("checkpoints")
      .select("id, place_id, name, address, lat, lng, created_at")
      .eq("place_id", data.placeId)
      .maybeSingle();
    if (existing) return { checkpoint: existing };
  }

  const { data: inserted, error } = await supabase
    .from("checkpoints")
    .insert({
      user_id: session.user.id,
      place_id: data.placeId ?? null,
      name: data.name,
      address: data.address ?? null,
      lat: data.lat,
      lng: data.lng,
    })
    .select("id, place_id, name, address, lat, lng, created_at")
    .single();

  if (error) throw new Error(error.message);
  return { checkpoint: inserted };
}

export async function removeCheckpoint({ data }: { data: { id: string } }) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const { error } = await supabase.from("checkpoints").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}
