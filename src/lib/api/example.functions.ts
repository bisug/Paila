"use server";
import { getServerConfig } from "../config.server";

export async function getGreeting({ data }: { data: { name: string } }) {
  const config = getServerConfig();
  return {
    greeting: `Hello, ${data.name}!`,
    mode: config.nodeEnv ?? "unknown",
  };
}
