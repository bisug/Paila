// Demo Mode: seeded in-memory Supabase stand-in.
//
// The real Supabase backend is not wired for the prototype. Instead of a client
// that returns empty data for every query (which made every data-backed screen
// look broken), this is a small in-memory backend that:
//   - seeds believable sample data for the demo user,
//   - persists writes for the lifetime of the process/tab,
//   - implements enough of the query builder + auth + storage surface that the
//     app uses (see the grep of `.from(`/`.auth.`/`.storage` call sites).
//
// ponytail: in-memory demo store, swap for real @supabase/ssr when a project is wired.
import type { Database } from "./types";

const DEMO_USER_ID = "demo-user-id";

function uid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

// ── Demo auth user/session ───────────────────────────────────────────────────
const demoUser = {
  id: DEMO_USER_ID,
  aud: "authenticated",
  role: "authenticated",
  email: "aarav.sharma@example.com",
  phone: "",
  app_metadata: { provider: "email" },
  user_metadata: {
    first_name: "Aarav",
    last_name: "Sharma",
    full_name: "Aarav Sharma",
    age: 28,
    gender: "male",
    auth_method: "email",
  } as Record<string, unknown>,
  created_at: "2026-01-04T09:00:00.000Z",
  updated_at: nowIso(),
};

const demoSession = {
  access_token: "demo-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: "demo-refresh-token",
  user: demoUser,
};

type Row = Record<string, any>;
type Store = Record<string, Row[]>;

// ── Seed data ────────────────────────────────────────────────────────────────
function seed(): Store {
  const t = (daysFromNow: number) =>
    new Date(Date.now() + daysFromNow * 86_400_000).toISOString().slice(0, 10);

  return {
    profiles: [
      {
        user_id: DEMO_USER_ID,
        account_type: "traveller",
        business_type: null,
        first_name: "Aarav",
        last_name: "Sharma",
        full_name: "Aarav Sharma",
        gender: "male",
        created_at: "2026-01-04T09:00:00.000Z",
        updated_at: nowIso(),
      },
    ],
    // Seed the demo user as an admin so the admin guide-review flow is reachable.
    user_roles: [{ id: uid(), user_id: DEMO_USER_ID, role: "admin", created_at: nowIso() }],
    user_interests: [
      {
        user_id: DEMO_USER_ID,
        interests: ["trekking", "food", "culture"],
        onboarded: true,
        created_at: "2026-01-04T09:00:00.000Z",
        updated_at: nowIso(),
      },
    ],
    admin_settings: [{ id: 1, admin_email: "admin@paila.app", updated_at: nowIso() }],
    notifications: [
      {
        id: uid(),
        user_id: DEMO_USER_ID,
        type: "booking_confirmed",
        title: "Booking confirmed: Ghandruk Heritage Homestay",
        body: "Your stay (2 nights) is confirmed.",
        link: "/profile/bookings",
        read: false,
        created_at: new Date(Date.now() - 3 * 3600_000).toISOString(),
      },
      {
        id: uid(),
        user_id: DEMO_USER_ID,
        type: "guide_status_approved",
        title: "Your guide verification was approved",
        body: "Congratulations! Your guide profile is now verified.",
        link: "/guide/verify",
        read: false,
        created_at: new Date(Date.now() - 26 * 3600_000).toISOString(),
      },
      {
        id: uid(),
        user_id: DEMO_USER_ID,
        type: "welcome",
        title: "Welcome to Paila",
        body: "Every journey begins with a step. Explore experiences near you.",
        link: "/",
        read: true,
        created_at: new Date(Date.now() - 5 * 86_400_000).toISOString(),
      },
    ],
    bookings: [
      {
        id: uid(),
        user_id: DEMO_USER_ID,
        hotel_slug: "ghandruk-heritage-homestay",
        hotel_name: "Ghandruk Heritage Homestay",
        hotel_location: "Ghandruk Village",
        hotel_image:
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80",
        check_in: t(9),
        check_out: t(11),
        guests: 2,
        nights: 2,
        price_per_night_npr: 2400,
        total_npr: 4800,
        total_usd_cents: 3609,
        currency: "USD",
        status: "confirmed",
        stripe_session_id: null,
        stripe_payment_intent: null,
        created_at: new Date(Date.now() - 3 * 3600_000).toISOString(),
        updated_at: nowIso(),
      },
      {
        id: uid(),
        user_id: DEMO_USER_ID,
        hotel_slug: "phewa-shore-retreat",
        hotel_name: "Phewa Shore Retreat",
        hotel_location: "Lakeside, Pokhara",
        hotel_image:
          "https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?auto=format&fit=crop&w=900&q=80",
        check_in: t(20),
        check_out: t(23),
        guests: 2,
        nights: 3,
        price_per_night_npr: 4500,
        total_npr: 13500,
        total_usd_cents: 10150,
        currency: "USD",
        status: "pending",
        stripe_session_id: null,
        stripe_payment_intent: null,
        created_at: new Date(Date.now() - 6 * 3600_000).toISOString(),
        updated_at: nowIso(),
      },
    ],
    checkpoints: [
      {
        id: uid(),
        user_id: DEMO_USER_ID,
        place_id: "seed-pokhara",
        name: "Phewa Lakeside",
        address: "Lakeside, Pokhara",
        lat: 28.2096,
        lng: 83.9586,
        created_at: new Date(Date.now() - 4 * 86_400_000).toISOString(),
      },
      {
        id: uid(),
        user_id: DEMO_USER_ID,
        place_id: "seed-sarangkot",
        name: "Sarangkot Viewpoint",
        address: "Sarangkot, Pokhara",
        lat: 28.2439,
        lng: 83.9486,
        created_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      },
    ],
    guide_verifications: [
      {
        id: uid(),
        user_id: "seed-guide-1",
        full_name: "Chhewang Gurung",
        guide_id_number: "NTB-4821",
        place: "Ghandruk Village",
        phone: "+9779861122335",
        id_card_path: "seed-guide-1/id-card.jpg",
        status: "approved",
        review_note: null,
        created_at: new Date(Date.now() - 12 * 86_400_000).toISOString(),
        updated_at: new Date(Date.now() - 10 * 86_400_000).toISOString(),
      },
      {
        id: uid(),
        user_id: "seed-guide-2",
        full_name: "Sunita Tamang",
        guide_id_number: "NTB-3390",
        place: "Sarangkot Ridge",
        phone: "+9779812345679",
        id_card_path: "seed-guide-2/id-card.jpg",
        status: "approved",
        review_note: null,
        created_at: new Date(Date.now() - 9 * 86_400_000).toISOString(),
        updated_at: new Date(Date.now() - 8 * 86_400_000).toISOString(),
      },
      {
        id: uid(),
        user_id: "seed-guide-3",
        full_name: "Maya Gurung",
        guide_id_number: "NTB-5567",
        place: "Ghandruk Village",
        phone: "+9779861122336",
        id_card_path: "seed-guide-3/id-card.jpg",
        status: "pending",
        review_note: null,
        created_at: new Date(Date.now() - 1 * 86_400_000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 86_400_000).toISOString(),
      },
    ],
  };
}

const db: Store = seed();

// ── Column defaults applied on insert ────────────────────────────────────────
function withInsertDefaults(table: string, row: Row): Row {
  const base: Row = { ...row };
  if (base.id === undefined && table !== "profiles" && table !== "user_interests") {
    base.id = uid();
  }
  if (base.created_at === undefined) base.created_at = nowIso();
  if (
    base.updated_at === undefined &&
    ["profiles", "bookings", "guide_verifications", "user_interests", "admin_settings"].includes(
      table,
    )
  ) {
    base.updated_at = nowIso();
  }
  if (table === "bookings" && base.status === undefined) base.status = "pending";
  if (table === "notifications" && base.read === undefined) base.read = false;
  return base;
}

type Filter = { col: string; op: "eq" | "in"; value: any };

// A chainable, awaitable query builder over one table in the in-memory store.
class Query implements PromiseLike<{ data: any; error: any; count?: number }> {
  private filters: Filter[] = [];
  private orderBy: { col: string; ascending: boolean } | null = null;
  private limitN: number | null = null;
  private op: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload: Row | Row[] | null = null;
  private onConflict: string | null = null;
  private singleFlag = false;
  private maybeFlag = false;
  private wantCount = false;
  private headOnly = false;
  private returning = false; // insert/upsert followed by .select()

  constructor(private table: string) {}

  private rows(): Row[] {
    return (db[this.table] ??= []);
  }

  private matches(row: Row): boolean {
    return this.filters.every((f) =>
      f.op === "eq"
        ? row[f.col] === f.value
        : Array.isArray(f.value) && f.value.includes(row[f.col]),
    );
  }

  // ── filters / modifiers ──
  eq(col: string, value: any) {
    this.filters.push({ col, op: "eq", value });
    return this;
  }
  in(col: string, value: any[]) {
    this.filters.push({ col, op: "in", value });
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderBy = { col, ascending: opts?.ascending ?? true };
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }

  // ── operations ──
  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (this.op === "insert" || this.op === "upsert") {
      this.returning = true;
    } else {
      this.op = "select";
    }
    if (opts?.count) this.wantCount = true;
    if (opts?.head) this.headOnly = true;
    return this;
  }
  insert(payload: Row | Row[]) {
    this.op = "insert";
    this.payload = payload;
    return this;
  }
  update(payload: Row) {
    this.op = "update";
    this.payload = payload;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }
  upsert(payload: Row | Row[], opts?: { onConflict?: string }) {
    this.op = "upsert";
    this.payload = payload;
    this.onConflict = opts?.onConflict ?? null;
    return this;
  }
  maybeSingle() {
    this.maybeFlag = true;
    return this;
  }
  single() {
    this.singleFlag = true;
    return this;
  }

  private applyReadShape(rows: Row[]) {
    let out = rows.filter((r) => this.matches(r));
    if (this.orderBy) {
      const { col, ascending } = this.orderBy;
      out = [...out].sort((a, b) => {
        if (a[col] === b[col]) return 0;
        const cmp = a[col] > b[col] ? 1 : -1;
        return ascending ? cmp : -cmp;
      });
    }
    if (this.limitN != null) out = out.slice(0, this.limitN);
    return out;
  }

  private run(): { data: any; error: any; count?: number } {
    const rows = this.rows();

    if (this.op === "insert" || this.op === "upsert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload as Row];
      const written: Row[] = [];
      for (const item of items) {
        let existing: Row | undefined;
        if (this.op === "upsert" && this.onConflict) {
          const keys = this.onConflict.split(",").map((k) => k.trim());
          existing = rows.find((r) => keys.every((k) => r[k] === item[k]));
        }
        if (existing) {
          Object.assign(existing, item, { updated_at: nowIso() });
          written.push(existing);
        } else {
          const row = withInsertDefaults(this.table, item);
          rows.push(row);
          written.push(row);
        }
      }
      const data = this.singleFlag || this.maybeFlag ? (written[0] ?? null) : written;
      return { data, error: null };
    }

    if (this.op === "update") {
      const patch = this.payload as Row;
      const updated: Row[] = [];
      for (const r of rows) {
        if (this.matches(r)) {
          Object.assign(r, patch);
          if ("updated_at" in r) r.updated_at = nowIso();
          updated.push(r);
        }
      }
      const data = this.singleFlag || this.maybeFlag ? (updated[0] ?? null) : updated;
      return { data, error: null };
    }

    if (this.op === "delete") {
      const kept = rows.filter((r) => !this.matches(r));
      db[this.table] = kept;
      return { data: null, error: null };
    }

    // select
    const out = this.applyReadShape(rows);
    if (this.singleFlag) return { data: out[0] ?? null, error: null };
    if (this.maybeFlag) return { data: out[0] ?? null, error: null };
    if (this.headOnly) return { data: null, error: null, count: out.length };
    if (this.wantCount) return { data: out, error: null, count: out.length };
    return { data: out, error: null };
  }

  then<TResult1 = { data: any; error: any; count?: number }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: any; error: any; count?: number }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.run()).then(onfulfilled, onrejected);
  }
}

// ── Storage stub ─────────────────────────────────────────────────────────────
const PLACEHOLDER_ID_IMAGE =
  "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=70";

const storage = {
  from(_bucket: string) {
    return {
      async upload(path: string) {
        return { data: { path }, error: null };
      },
      async createSignedUrl(_path: string, _expiresIn: number) {
        return { data: { signedUrl: PLACEHOLDER_ID_IMAGE }, error: null };
      },
      getPublicUrl(_path: string) {
        return { data: { publicUrl: PLACEHOLDER_ID_IMAGE } };
      },
      async remove(_paths: string[]) {
        return { data: null, error: null };
      },
    };
  },
};

// ── Auth stub (all methods resolve to the demo session) ──────────────────────
function extractNext(redirectTo?: string): string {
  if (!redirectTo) return "/";
  try {
    const url = new URL(redirectTo);
    return url.searchParams.get("next") || "/";
  } catch {
    return "/";
  }
}

const auth = {
  async getSession() {
    return { data: { session: demoSession }, error: null };
  },
  async getUser() {
    return { data: { user: demoUser }, error: null };
  },
  async getClaims() {
    return { data: { sub: DEMO_USER_ID }, error: null };
  },
  onAuthStateChange(callback: (event: string, session: typeof demoSession) => void) {
    callback("SIGNED_IN", demoSession);
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
  async signInWithPassword() {
    return { data: { session: demoSession, user: demoUser }, error: null };
  },
  async signUp() {
    // Return a session so the login page proceeds straight to onboarding.
    return { data: { session: demoSession, user: demoUser }, error: null };
  },
  async signInWithOAuth(opts?: { options?: { redirectTo?: string } }) {
    // Demo: no real provider round-trip — jump straight to the post-auth target.
    if (typeof window !== "undefined") {
      window.location.assign(extractNext(opts?.options?.redirectTo));
    }
    return { data: { provider: "google", url: null }, error: null };
  },
  async verifyOtp() {
    return { data: { session: demoSession, user: demoUser }, error: null };
  },
  async resend() {
    return { data: {}, error: null };
  },
  async updateUser(attrs?: { data?: Record<string, unknown> }) {
    if (attrs?.data) Object.assign(demoUser.user_metadata, attrs.data);
    demoUser.updated_at = nowIso();
    return { data: { user: demoUser }, error: null };
  },
  async exchangeCodeForSession() {
    return { data: { session: demoSession }, error: null };
  },
  async signOut() {
    return { error: null };
  },
};

// ── Public client ────────────────────────────────────────────────────────────
export const supabase = {
  auth,
  storage,
  from(table: string) {
    return new Query(table);
  },
  async rpc(fn: string) {
    if (fn === "has_role") return { data: true, error: null };
    return { data: null, error: null };
  },
} as any;

export type { Database };
