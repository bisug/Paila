import {
  checkRateLimit,
  getClientKey,
  isDemoEnabled,
  isDemoMode,
  isSupabaseConfigured,
} from "@/lib/server/guardrails";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  // Only enforce Supabase session auth when a real project is wired.
  // In demo mode the app auth is client-mocked, so there is no server session cookie.
  if (isSupabaseConfigured()) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      },
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!checkRateLimit(getClientKey(request, "scan"), 10, 60_000)) {
    return Response.json({ error: "Too many scan requests." }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image");
    if (!(image instanceof File)) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return Response.json({ error: "Image must be 5 MB or smaller" }, { status: 413 });
    }
    if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
      return Response.json(
        { error: "Only JPG, PNG, and WebP images are supported" },
        { status: 415 },
      );
    }
    if (!isDemoEnabled("ENABLE_DEMO_SCAN") && !isDemoMode()) {
      return Response.json(
        { error: "Image recognition is not configured for production use." },
        { status: 501 },
      );
    }

    await new Promise((r) => setTimeout(r, 800));
    return Response.json({
      name: "Jal Binayak Temple",
      history:
        "Located near the Chobhar Gorge, this shrine is famous for its stone idol, which is believed to have naturally emerged from the water.",
      significance: "Built / Founded: 1602 AD (723 Nepal Sambat).",
      facts: [
        "One of the four main Ganesh shrines of the Kathmandu Valley",
        "Sits beside the sacred Bagmati river at Chobhar",
        "The idol is said to have emerged naturally from the water",
      ],
    });
  } catch (e) {
    console.error("scan error", e);
    return Response.json({ error: "Failed to analyze image" }, { status: 500 });
  }
}
