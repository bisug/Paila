import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "../styles.css";

export const metadata: Metadata = {
  title: "Paila | Every Journey Begins with a Step",
  description: "Offline-first Nepal tourism for direct community travel.",
  openGraph: {
    title: "Paila | Every Journey Begins with a Step",
    description: "Offline-first Nepal tourism for direct community travel.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Paila | Every Journey Begins with a Step",
    description: "Offline-first Nepal tourism for direct community travel.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F9F8F6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-stone-100 antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
