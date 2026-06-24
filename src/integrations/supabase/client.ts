// Demo Mode: Mock Supabase Client
import type { Database } from "./types";

const demoSession = {
  access_token: "demo-token",
  token_type: "bearer",
  expires_in: 3600,
  refresh_token: "demo-refresh-token",
  user: {
    id: "demo-user-id",
    aud: "authenticated",
    role: "authenticated",
    email: "demo@example.com",
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

const mockAuth = {
  getSession: async () => ({ data: { session: demoSession }, error: null }),
  getUser: async () => ({ data: { user: demoSession.user }, error: null }),
  getClaims: async () => ({ data: {}, error: null }),
  onAuthStateChange: (callback: any) => {
    // Immediately call it with the demo session
    callback("SIGNED_IN", demoSession);
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
  updateUser: async () => ({ data: { user: demoSession.user }, error: null }),
  signInWithPassword: async () => ({ data: { session: demoSession }, error: null }),
  signOut: async () => ({ error: null }),
};

function createMockSupabaseClient() {
  const proxy = new Proxy({}, {
    get(target: any, prop: string) {
      if (prop === "auth") return mockAuth;
      
      if (prop === "from") {
        return (table: string) => {
          const chain = new Proxy({}, {
            get(target: any, prop: string) {
              if (prop === "then") return undefined; // allow async/await to work correctly if they await .select()
              // Stub all methods like select, insert, update, eq, order etc.
              return (...args: any[]) => {
                // Return null instead of array for single objects
                if (prop === "maybeSingle" || prop === "single") {
                  return {
                    then: (res: any) => res({ data: null, error: null }),
                    ...chain
                  };
                }
                // If it's a finalizing method like select, delete, upsert, we might want to return data
                if (prop === "select" || prop === "delete" || prop === "upsert" || prop === "update" || prop === "insert") {
                  return {
                    then: (res: any) => res({ data: [], error: null, count: 0 }), // always return empty data for now
                    ...chain
                  };
                }
                return chain;
              };
            }
          });
          return chain;
        };
      }
      return Reflect.get(target, prop);
    }
  });
  return proxy as any;
}

export const supabase = createMockSupabaseClient();
