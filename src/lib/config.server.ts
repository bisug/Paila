import process from "node:process";

// Server-only config. Keep environment reads in server-only modules or route handlers.
//
// Public client values must use NEXT_PUBLIC_* and must never contain secrets.

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    // Add server-only values here, e.g.:
    //   databaseUrl: process.env.DATABASE_URL,
    //   stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  };
}
